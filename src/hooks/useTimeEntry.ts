import { useCallback, useContext } from 'react';
import { StorageContext } from '../context/StorageContext';
import { TimeEntrySchema } from '../types/entities';

export const useTimeEntry = () => {
  const storage = useContext(StorageContext);
  
  if (!storage) {
    throw new Error('useTimeEntry must be used within a StorageProvider');
  }

  const createTimeEntry = useCallback(async (entry: Omit<TimeEntrySchema, 'itemId' | 'created' | 'lastUpdated'>) => {
    const dbData = {
      taskId: entry.taskId,
      isRunning: entry.isRunning,
      timeSpent: entry.timeSpent,
      timeStarted: entry.timeStarted,
      timeEnded: entry.timeEnded
    };

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

  const getTimeEntriesForTask = useCallback((taskId: string) => {
    return storage.timeEntries.filter(entry => entry.taskId === taskId);
  }, [storage.timeEntries]);

  return {
    // Data
    timeEntries: storage.timeEntries,
    
    // Operations
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    getTimeEntriesForTask,
    
    // Loading and error states
    isLoading: storage.isLoading,
    error: storage.error,
    lastUpdated: storage.lastUpdated,
    
    // Refresh
    refreshData: storage.refreshData
  };
}; 