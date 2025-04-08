import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { storageService } from '@lib/services/storage/StorageService';
import { TaskSchema, TimeEntrySchema, ProjectSchema } from '@def/entities';
import { StorageContextType } from '@def/storage';
import { errorService } from '@lib/services/error/ErrorService';
import { ErrorLevel } from '@def/error';
import { log } from '@lib/util/debugging/logging';

// Create the context with a default value
export const StorageContext = createContext<StorageContextType>({} as StorageContextType);

// Provider component
export const StorageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State for entity data
  const [tasks, setTasks] = useState<TaskSchema[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntrySchema[]>([]);
  const [projects, setProjects] = useState<ProjectSchema[]>([]);
  
  // State for loading, errors, and cache management
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  
  // Config constants
  const MAX_RETRIES = 3;
  
  // Initialize database once on app startup
  const initializeDatabase = useCallback(async (): Promise<boolean> => {
    try {
      // Initialize the database if needed
      await storageService.initialize();
      setIsInitialized(true);
      return true;
    } catch (err) {
      log('Failed to initialize database: ' + err, 'StorageContext', 'ERROR', { variableName: 'err', value: err });
      setError(new Error('Failed to initialize database'));
      setIsInitialized(false);
      return false;
    }
  }, []);
  
  // Load all data from the database
  const loadAllData = useCallback(async (retryCount = 0): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Initialize the database if not already initialized
      if (!isInitialized) {
        const initialized = await initializeDatabase();
        if (!initialized) {
          setIsLoading(false);
          return;
        }
      }
      
      // Load projects
      const projectRows = await storageService.find('projects');
      const loadedProjects = projectRows.map(row => ({
        ...row,
        itemId: row.item_id,
        created: row.created,
        lastUpdated: row.last_updated
      }));
      
      // Load tasks
      const taskRows = await storageService.find('tasks');
      const loadedTasks = taskRows.map(row => ({
        ...row,
        itemId: row.item_id,
        isRunning: !!row.is_running,
        isGrouped: !!row.is_grouped,
        isCompleted: !!row.is_completed,
        projectId: row.project_id,
        created: row.created,
        lastUpdated: row.last_updated,
        timeEntries: [],
        getTotalTimeSpent: function() {
          return this.timeEntries.reduce((total: number, entry: TimeEntrySchema) => 
            total + entry.timeSpent, 0);
        }
      }));
      
      // Load time entries
      const timeEntryRows = await storageService.find('time_entries');
      const loadedTimeEntries = timeEntryRows.map(row => ({
        ...row,
        itemId: row.item_id,
        isRunning: !!row.is_running,
        timeSpent: row.time_spent,
        timeStarted: row.time_started,
        timeEnded: row.time_ended,
        created: row.created,
        lastUpdated: row.last_updated
      }));
      
      // Assign time entries to their tasks
      loadedTasks.forEach(task => {
        task.timeEntries = loadedTimeEntries.filter(entry => 
          entry.taskId === task.itemId);
      });
      
      // Update state with loaded data
      setProjects(loadedProjects);
      setTasks(loadedTasks);
      setTimeEntries(loadedTimeEntries);
      setLastUpdated(Date.now());
      setIsLoading(false);
    } catch (err) {
      log('Failed to load data: ' + err, 'StorageContext', 'ERROR', { variableName: 'err', value: err });
      
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        log('Retrying data load (' + (retryCount + 1) + '/' + MAX_RETRIES + ')...', 'StorageContext', 'INFO');
        setTimeout(() => loadAllData(retryCount + 1), 1000);
      } else {
        const formattedError = err instanceof Error ? err : new Error('Failed to load data after multiple attempts');
        errorService.logError(
          formattedError,
          ErrorLevel.ERROR,
          {
            component: 'StorageContext',
            operation: 'loadAllData'
          }
        );
        setError(formattedError);
        setIsLoading(false);
      }
    }
  }, [isInitialized, initializeDatabase]);

  // Generic entity operations
  const createEntity = useCallback(async <T extends { itemId: string }>(
    table: string,
    data: Omit<T, 'itemId' | 'created' | 'lastUpdated'>,
    transform?: (dbData: any) => T
  ): Promise<T> => {
    if (!isInitialized) {
      throw new Error('Database not initialized');
    }
    
    const now = Date.now();
    const itemId = `${table.slice(0, -1)}_${now}_${Math.floor(Math.random() * 1000)}`;
    
    const dbData = {
      item_id: itemId,
      ...data,
      created: now,
      last_updated: now
    };

    await storageService.insert(table, dbData);
    await loadAllData();
    
    const entity = transform ? transform(dbData) : { ...dbData, itemId } as unknown as T;
    return entity;
  }, [loadAllData, isInitialized]);

  const updateEntity = useCallback(async <T extends { itemId: string }>(
    table: string,
    itemId: string,
    updates: Partial<Omit<T, 'itemId' | 'created' | 'lastUpdated'>>,
    transform?: (dbData: any) => T
  ): Promise<void> => {
    if (!isInitialized) {
      throw new Error('Database not initialized');
    }
    
    const now = Date.now();
    const dbUpdates: Record<string, any> = {
      last_updated: now,
      ...updates
    };

    await storageService.update(table, dbUpdates, 'item_id = ?', [itemId]);
    await loadAllData();
  }, [loadAllData, isInitialized]);

  const deleteEntity = useCallback(async (
    table: string,
    itemId: string,
    options?: {
      cascade?: { table: string; foreignKey: string }[];
      beforeDelete?: () => Promise<void>;
      afterDelete?: () => Promise<void>;
    }
  ): Promise<void> => {
    if (!isInitialized) {
      throw new Error('Database not initialized');
    }
    
    await storageService.transaction(async (tx: any) => {
      if (options?.beforeDelete) {
        await options.beforeDelete();
      }

      if (options?.cascade) {
        for (const { table: cascadeTable, foreignKey } of options.cascade) {
          await tx.executeSql(
            `DELETE FROM ${cascadeTable} WHERE ${foreignKey} = ?`,
            [itemId]
          );
        }
      }

      await tx.executeSql(`DELETE FROM ${table} WHERE item_id = ?`, [itemId]);

      if (options?.afterDelete) {
        await options.afterDelete();
      }
    });
    await loadAllData();
  }, [loadAllData, isInitialized]);

  const findEntity = useCallback(async <T extends { itemId: string }>(
    table: string,
    itemId: string,
    transform?: (dbData: any) => T
  ): Promise<T | null> => {
    if (!isInitialized) {
      throw new Error('Database not initialized');
    }
    
    const result = await storageService.findOne(table, '*', 'item_id = ?', [itemId]);
    if (!result) return null;
    
    return transform ? transform(result) : { ...result, itemId: result.item_id } as unknown as T;
  }, [isInitialized]);

  const findEntities = useCallback(async <T extends { itemId: string }>(
    table: string,
    where?: string,
    params?: any[],
    transform?: (dbData: any) => T
  ): Promise<T[]> => {
    if (!isInitialized) {
      throw new Error('Database not initialized');
    }
    
    const results = await storageService.find(table, '*', where || '', params || []);
    return results.map(result => transform ? transform(result) : { ...result, itemId: result.item_id } as unknown as T);
  }, [isInitialized]);

  // Initial data load and database initialization
  useEffect(() => {
    // Initialize the database and load initial data
    const initialize = async () => {
      try {
        const success = await initializeDatabase();
        if (success) {
          await loadAllData();
        }
      } catch (err) {
        log('Error during initialization: ' + err, 'StorageContext', 'ERROR', { variableName: 'err', value: err });
        setError(new Error('Failed to initialize database and load data'));
        setIsLoading(false);
      }
    };
    
    initialize();
  }, [initializeDatabase, loadAllData]);

  // Context value
  const value: StorageContextType = {
    tasks,
    timeEntries,
    projects,
    isLoading,
    error,
    lastUpdated,
    refreshData: loadAllData,
    createEntity,
    updateEntity,
    deleteEntity,
    findEntity,
    findEntities,
    isInitialized
  };
  
  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
};