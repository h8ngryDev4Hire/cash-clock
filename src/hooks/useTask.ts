import { useCallback } from 'react';
import { useStorageContext } from '../context/StorageContext';
import { TaskSchema } from '../types/entities';

interface TaskDbData {
  item_id: string;
  name: string;
  is_running: number;
  is_grouped: number;
  is_completed: number;
  project_id: string | null;
}

export const useTask = () => {
  const storage = useStorageContext();

  const createTask = useCallback(async (task: Omit<TaskSchema, 'itemId' | 'created' | 'lastUpdated' | 'timeEntries' | 'getTotalTimeSpent'>) => {
    const dbData = {
      name: task.name,
      isRunning: task.isRunning,
      isGrouped: task.isGrouped,
      isCompleted: task.isCompleted,
      projectId: task.projectId,
      timeEntries: [],
      getTotalTimeSpent: function() {
        return this.timeEntries.reduce((total: number, entry: any) => 
          total + entry.timeSpent, 0);
      }
    };

    const transform = (dbData: any): TaskSchema => ({
      ...dbData,
      itemId: dbData.item_id,
      isRunning: !!dbData.is_running,
      isGrouped: !!dbData.is_grouped,
      isCompleted: !!dbData.is_completed,
      projectId: dbData.project_id,
      created: dbData.created,
      lastUpdated: dbData.last_updated,
      timeEntries: [],
      getTotalTimeSpent: function() {
        return this.timeEntries.reduce((total: number, entry: any) => 
          total + entry.timeSpent, 0);
      }
    });

    return storage.createEntity<TaskSchema>('tasks', dbData, transform);
  }, [storage]);

  const updateTask = useCallback(async (itemId: string, updates: Partial<Omit<TaskSchema, 'itemId' | 'created' | 'lastUpdated' | 'timeEntries' | 'getTotalTimeSpent'>>) => {
    const dbUpdates: Partial<Omit<TaskSchema, 'itemId' | 'created' | 'lastUpdated' | 'timeEntries' | 'getTotalTimeSpent'>> = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.isRunning !== undefined) dbUpdates.isRunning = updates.isRunning;
    if (updates.isGrouped !== undefined) dbUpdates.isGrouped = updates.isGrouped;
    if (updates.isCompleted !== undefined) dbUpdates.isCompleted = updates.isCompleted;
    if (updates.projectId !== undefined) dbUpdates.projectId = updates.projectId;

    await storage.updateEntity<TaskSchema>('tasks', itemId, dbUpdates);
  }, [storage]);

  const deleteTask = useCallback(async (itemId: string) => {
    await storage.deleteEntity('tasks', itemId, {
      cascade: [
        { table: 'time_entries', foreignKey: 'task_id' }
      ]
    });
  }, [storage]);

  const getTaskById = useCallback((itemId: string) => {
    return storage.tasks.find(task => task.itemId === itemId);
  }, [storage.tasks]);

  return {
    // Data
    tasks: storage.tasks,
    
    // Operations
    createTask,
    updateTask,
    deleteTask,
    getTaskById,
    
    // Loading and error states
    isLoading: storage.isLoading,
    error: storage.error,
    lastUpdated: storage.lastUpdated,
    
    // Refresh
    refreshData: storage.refreshData
  };
}; 