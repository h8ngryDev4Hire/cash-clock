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
  
  // Config constants
  const MAX_RETRIES = 3;
  
  // No longer need to initialize database - handled by orchestratorService
  
  // Load all data from the database
  const loadAllData = useCallback(async (retryCount = 0): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      
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
      log('Failed to load data: ' + err, 'StorageContext', 'loadAllData', 'ERROR', { 
        variableName: 'err', 
        value: err 
      });
      
      // Retry logic
      if (retryCount < MAX_RETRIES) {
        log('Retrying data load (' + (retryCount + 1) + '/' + MAX_RETRIES + ')...', 'StorageContext', 'loadAllData', 'INFO');
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
  }, []);

  // Helper function to convert camelCase to snake_case
  const camelToSnakeCase = (str: string): string => {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  };

  // Generic entity operations
  const createEntity = useCallback(async <T extends { itemId: string }>(
    table: string,
    data: Omit<T, 'itemId' | 'created' | 'lastUpdated'>,
    transform?: (dbData: any) => T
  ): Promise<T> => {
    const now = Date.now();
    const itemId = `${table.slice(0, -1)}_${now}_${Math.floor(Math.random() * 1000)}`;
    
    // Convert all camelCase keys to snake_case for database compatibility
    const dbData: Record<string, any> = {
      item_id: itemId,
      created: now,
      last_updated: now
    };
    
    // Convert each key from camelCase to snake_case
    Object.entries(data).forEach(([key, value]) => {
      const snakeCaseKey = camelToSnakeCase(key);
      dbData[snakeCaseKey] = value;
    });

    await storageService.insert(table, dbData);
    await loadAllData();
    
    const entity = transform ? transform(dbData) : { ...dbData, itemId } as unknown as T;
    return entity;
  }, [loadAllData]);

  const updateEntity = useCallback(async <T extends { itemId: string }>(
    table: string,
    itemId: string,
    updates: Partial<Omit<T, 'itemId' | 'created' | 'lastUpdated'>>,
    transform?: (dbData: any) => T
  ): Promise<void> => {
    const now = Date.now();
    // Convert all camelCase keys to snake_case for database compatibility
    const dbUpdates: Record<string, any> = {
      last_updated: now
    };
    
    // Convert each key from camelCase to snake_case
    Object.entries(updates).forEach(([key, value]) => {
      const snakeCaseKey = camelToSnakeCase(key);
      dbUpdates[snakeCaseKey] = value;
    });

    await storageService.update(table, dbUpdates, 'item_id = ?', [itemId]);
    await loadAllData();
  }, [loadAllData]);

  const deleteEntity = useCallback(async (
    table: string,
    itemId: string,
    options?: {
      cascade?: { table: string; foreignKey: string }[];
      beforeDelete?: () => Promise<void>;
      afterDelete?: () => Promise<void>;
    }
  ): Promise<void> => {
    try {
      if (options?.beforeDelete) {
        await options.beforeDelete();
      }

      if (options?.cascade) {
        for (const { table: cascadeTable, foreignKey } of options.cascade) {
          storageService.delete(cascadeTable, `${foreignKey} = ?`, [itemId]);
        }
      }

      // Use direct delete instead of transaction execution
      storageService.delete(table, 'item_id = ?', [itemId]);

      if (options?.afterDelete) {
        await options.afterDelete();
      }
      
      await loadAllData();
    } catch (error) {
      log('Error in deleteEntity: ' + error, 'StorageContext', 'deleteEntity', 'ERROR', { 
        variableName: 'deleteEntityParams', 
        value: { table, itemId, error }
      });
      throw error;
    }
  }, [loadAllData]);

  const findEntity = useCallback(async <T extends { itemId: string }>(
    table: string,
    itemId: string,
    transform?: (dbData: any) => T
  ): Promise<T | null> => {
    const result = await storageService.findOne(table, '*', 'item_id = ?', [itemId]);
    if (!result) return null;
    
    return transform ? transform(result) : { ...result, itemId: result.item_id } as unknown as T;
  }, []);

  const findEntities = useCallback(async <T extends { itemId: string }>(
    table: string,
    where?: string,
    params?: any[],
    transform?: (dbData: any) => T
  ): Promise<T[]> => {
    const results = await storageService.find(table, '*', where || '', params || []);
    return results.map(result => transform ? transform(result) : { ...result, itemId: result.item_id } as unknown as T);
  }, []);

  // Load initial data after mounting
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

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
    isInitialized: true // Always true now since initialization is handled by orchestrator
  };
  
  return (
    <StorageContext.Provider value={value}>
      {children}
    </StorageContext.Provider>
  );
};