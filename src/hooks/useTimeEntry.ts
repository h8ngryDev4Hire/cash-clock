import { useCallback, useContext, useEffect } from 'react';
import { StorageContext } from '../context/StorageContext';
import { TimeEntrySchema } from '../types/entities';
import { log } from '../lib/util/debugging/logging';
import { toUITimeEntry, toTimeEntrySchema, sortTimeEntriesByStartTime } from '../lib/util/time/timeEntryTransformers';
import { TimeEntry } from '../types/core';

export const useTimeEntry = () => {
  const storage = useContext(StorageContext);
  
  if (!storage) {
    throw new Error('useTimeEntry must be used within a StorageProvider');
  }

  // Debug logging to check the actual storage state
  useEffect(() => {
    log('useTimeEntry: Storage context state', 'useTimeEntry', 'useEffect', 'DEBUG', {
      variableName: 'timeEntriesLength',
      value: storage.timeEntries?.length || 0
    });
    if (storage.timeEntries?.length > 0) {
      log('useTimeEntry: First few time entries', 'useTimeEntry', 'useEffect', 'DEBUG', {
        variableName: 'sampleEntries',
        value: storage.timeEntries.slice(0, 3)
      });
    }
  }, [storage.timeEntries]);

  const createTimeEntry = useCallback(async (entry: Omit<TimeEntrySchema, 'itemId' | 'created' | 'lastUpdated'>) => {
    const dbData = {
      taskId: entry.taskId,
      isRunning: entry.isRunning,
      timeSpent: entry.timeSpent,
      timeStarted: entry.timeStarted,
      timeEnded: entry.timeEnded
    };

    // Use storage transform instead of our own to maintain database compatibility
    const transform = (dbData: any): TimeEntrySchema => ({
      ...dbData,
      itemId: dbData.item_id,
      isRunning: !!dbData.is_running,
      timeSpent: dbData.time_spent,
      timeStarted: dbData.time_started,
      timeEnded: dbData.time_ended,
      created: dbData.created,
      lastUpdated: dbData.last_updated
    });

    const result = await storage.createEntity<TimeEntrySchema>('time_entries', dbData, transform);
    
    // If this is a running entry, update the task's running state
    if (entry.isRunning) {
      await storage.updateEntity('tasks', entry.taskId, { isRunning: true });
    }
    
    return result;
  }, [storage]);

  const updateTimeEntry = useCallback(async (itemId: string, updates: Partial<Omit<TimeEntrySchema, 'itemId' | 'created' | 'lastUpdated'>>) => {
    const dbUpdates: Partial<Omit<TimeEntrySchema, 'itemId' | 'created' | 'lastUpdated'>> = {};
    
    if (updates.isRunning !== undefined) dbUpdates.isRunning = updates.isRunning;
    if (updates.timeSpent !== undefined) dbUpdates.timeSpent = updates.timeSpent;
    if (updates.timeStarted !== undefined) dbUpdates.timeStarted = updates.timeStarted;
    if (updates.timeEnded !== undefined) dbUpdates.timeEnded = updates.timeEnded;

    await storage.updateEntity<TimeEntrySchema>('time_entries', itemId, dbUpdates);
    
    // If updating running state, update the task as well
    if (updates.isRunning !== undefined) {
      const entry = storage.timeEntries.find(e => e.itemId === itemId);
      if (entry) {
        const stillRunning = storage.timeEntries
          .filter(e => e.taskId === entry.taskId && e.itemId !== itemId)
          .some(e => e.isRunning);
        
        await storage.updateEntity('tasks', entry.taskId, { 
          isRunning: updates.isRunning || stillRunning 
        });
      }
    }
  }, [storage]);

  const deleteTimeEntry = useCallback(async (itemId: string) => {
    const entry = storage.timeEntries.find(e => e.itemId === itemId);
    if (entry) {
      await storage.deleteEntity('time_entries', itemId);
      
      // Update task running state if needed
      const stillRunning = storage.timeEntries
        .filter(e => e.taskId === entry.taskId && e.itemId !== itemId)
        .some(e => e.isRunning);
      
      await storage.updateEntity('tasks', entry.taskId, { isRunning: stillRunning });
    }
  }, [storage]);

  /**
   * Get time entries for a specific task
   */
  const getTimeEntriesForTask = useCallback(async (taskId: string | null): Promise<TimeEntrySchema[]> => {
    if (!taskId) {
      log('getTimeEntriesForTask: No taskId provided', 'useTimeEntry', 'getTimeEntriesForTask', 'WARNING');
      return [];
    }

    // First try to get from the storage context
    const entriesFromContext = storage.timeEntries.filter(entry => entry.taskId === taskId);
    
    log(`getTimeEntriesForTask: Found ${entriesFromContext.length} entries in context for taskId ${taskId}`, 
        'useTimeEntry', 'getTimeEntriesForTask', 'DEBUG');
    
    if (entriesFromContext.length > 0) {
      return entriesFromContext;
    }
    
    // If nothing in context, try directly from the database
    try {
      log(`getTimeEntriesForTask: Attempting direct database query for taskId ${taskId}`, 
          'useTimeEntry', 'getTimeEntriesForTask', 'DEBUG');
      
      // Use the findEntities method from storage context
      const entriesFromDb = await storage.findEntities<TimeEntrySchema>(
        'time_entries',
        'task_id = ?',
        [taskId],
        (dbData: any): TimeEntrySchema => ({
          ...dbData,
          itemId: dbData.item_id,
          isRunning: !!dbData.is_running,
          timeSpent: dbData.time_spent,
          timeStarted: dbData.time_started,
          timeEnded: dbData.time_ended,
          created: dbData.created,
          lastUpdated: dbData.last_updated,
          taskId: dbData.task_id
        })
      );
      
      log(`getTimeEntriesForTask: Found ${entriesFromDb.length} entries via direct query for taskId ${taskId}`, 
          'useTimeEntry', 'getTimeEntriesForTask', 'DEBUG');
      
      if (entriesFromDb.length > 0) {
        // If we found entries this way, refresh the context
        await storage.refreshData();
      }
      
      return entriesFromDb;
    } catch (error) {
      log(`getTimeEntriesForTask: Error getting time entries from DB: ${error}`, 
          'useTimeEntry', 'getTimeEntriesForTask', 'ERROR', { variableName: 'error', value: error });
      return [];
    }
  }, [storage]);

  /**
   * Get time entries in UI format for a specific task
   */
  const getTimeEntriesForTaskAsUI = useCallback(async (taskId: string | null): Promise<TimeEntry[]> => {
    if (!taskId) return [];
    
    const entries = await getTimeEntriesForTask(taskId);
    return entries.map(entry => toUITimeEntry(entry));
  }, [getTimeEntriesForTask]);

  /**
   * Load and sort time entries for a task, with proper error handling and logging
   * This combines all the logic needed to fetch, validate, and sort time entries
   */
  const loadTimeEntriesForTask = useCallback(async (taskId: string | null): Promise<TimeEntrySchema[]> => {
    if (!taskId) {
      log('loadTimeEntriesForTask: No taskId provided', 'useTimeEntry', 'loadTimeEntriesForTask', 'WARNING');
      return [];
    }
    
    try {
      // Ensure we have the latest data
      log('loadTimeEntriesForTask: Refreshing data first', 'useTimeEntry', 'loadTimeEntriesForTask', 'DEBUG');
      await storage.refreshData();
      
      // Fetch time entries 
      log(`loadTimeEntriesForTask: Fetching time entries for taskId ${taskId}`, 'useTimeEntry', 'loadTimeEntriesForTask', 'DEBUG');
      const entries = await getTimeEntriesForTask(taskId);
      
      // Validate entries
      const validEntries = Array.isArray(entries) ? entries : [];
      log(`loadTimeEntriesForTask: Retrieved ${validEntries.length} time entries`, 
          'useTimeEntry', 'loadTimeEntriesForTask', 'DEBUG');
      
      if (validEntries.length === 0) {
        log('loadTimeEntriesForTask: No time entries found', 'useTimeEntry', 'loadTimeEntriesForTask', 'INFO');
        return [];
      }
      
      // Use our utility function to sort entries
      try {
        const sortedEntries = sortTimeEntriesByStartTime(validEntries);
        log(`loadTimeEntriesForTask: Successfully sorted ${sortedEntries.length} time entries`, 
            'useTimeEntry', 'loadTimeEntriesForTask', 'DEBUG');
        return sortedEntries;
      } catch (sortError) {
        log(`loadTimeEntriesForTask: Error sorting time entries: ${sortError}`, 
            'useTimeEntry', 'loadTimeEntriesForTask', 'ERROR', { 
              variableName: 'error', 
              value: sortError 
            });
        // If sorting fails, return unsorted entries
        return validEntries;
      }
    } catch (error) {
      log(`loadTimeEntriesForTask: Error loading time entries: ${error}`, 
          'useTimeEntry', 'loadTimeEntriesForTask', 'ERROR', { 
            variableName: 'error', 
            value: error 
          });
      return [];
    }
  }, [storage, getTimeEntriesForTask]);

  /**
   * Create a new time entry from UI model
   */
  const createTimeEntryFromUI = useCallback(async (uiEntry: TimeEntry): Promise<TimeEntry> => {
    const schemaEntry = toTimeEntrySchema(uiEntry);
    const created = await createTimeEntry(schemaEntry);
    return toUITimeEntry(created);
  }, [createTimeEntry]);

  return {
    // Data
    timeEntries: storage.timeEntries,
    
    // Operations
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    getTimeEntriesForTask,
    getTimeEntriesForTaskAsUI,
    loadTimeEntriesForTask,
    createTimeEntryFromUI,
    
    // UI transformation helpers
    toUITimeEntry,
    toTimeEntrySchema,
    
    // Loading and error states
    isLoading: storage.isLoading,
    error: storage.error,
    lastUpdated: storage.lastUpdated,
    
    // Refresh
    refreshData: storage.refreshData
  };
}; 