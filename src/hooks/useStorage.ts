import { useCallback } from 'react';
import { useStorageContext } from '../context/StorageContext';
import { TaskSchema, TimeEntrySchema, ProjectSchema } from '../types/tasks';

type EntityType = 'task' | 'timeEntry' | 'project';

// Generic type for entity operations
type EntityOperations<T> = {
  getAll: () => T[];
  getById: (id: string) => T | undefined;
  create: (data: any) => Promise<T>;
  update: (id: string, updates: Partial<any>) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

/**
 * useStorage is a custom hook that provides a unified interface for
 * CRUD operations on different entity types in storage
 */
export function useStorage<T = TaskSchema | TimeEntrySchema | ProjectSchema>(
  entityType?: EntityType
): {
  // Common state and operations
  isLoading: boolean;
  error: Error | null;
  lastUpdated: number | null;
  refreshData: () => Promise<void>;
  
  // Generic entity operations (if entityType provided)
  entity: EntityType extends undefined ? undefined : EntityOperations<T>;
  
  // Type-specific operations (always available)
  tasks: EntityOperations<TaskSchema>;
  timeEntries: EntityOperations<TimeEntrySchema>;
  projects: EntityOperations<ProjectSchema>;
} {
  const { 
    tasks, timeEntries, projects,
    isLoading, error, lastUpdated, refreshData,
    createTask, updateTask, deleteTask,
    createTimeEntry, updateTimeEntry, deleteTimeEntry,
    createProject, updateProject, deleteProject,
    getTaskById, getTimeEntriesForTask
  } = useStorageContext();
  
  // Task operations
  const taskOperations: EntityOperations<TaskSchema> = {
    getAll: () => tasks,
    getById: getTaskById,
    create: createTask,
    update: updateTask,
    delete: deleteTask
  };
  
  // TimeEntry operations
  const timeEntryOperations: EntityOperations<TimeEntrySchema> = {
    getAll: () => timeEntries,
    getById: (id) => timeEntries.find(entry => entry.itemId === id),
    create: createTimeEntry,
    update: updateTimeEntry,
    delete: deleteTimeEntry
  };
  
  // Project operations
  const projectOperations: EntityOperations<ProjectSchema> = {
    getAll: () => projects,
    getById: (id) => projects.find(project => project.itemId === id),
    create: createProject,
    update: updateProject,
    delete: deleteProject
  };
  
  // Helper to get time entries for a task
  const getEntriesForTask = useCallback((taskId: string) => {
    return timeEntries.filter(entry => entry.taskId === taskId);
  }, [timeEntries]);
  
  // If entityType is provided, return operations for that entity type
  let entityOperations: EntityOperations<any> | undefined;
  if (entityType === 'task') {
    entityOperations = taskOperations;
  } else if (entityType === 'timeEntry') {
    entityOperations = timeEntryOperations;
  } else if (entityType === 'project') {
    entityOperations = projectOperations;
  }

  return {
    isLoading,
    error,
    lastUpdated,
    refreshData,
    entity: entityOperations as EntityType extends undefined ? undefined : EntityOperations<T>,
    tasks: taskOperations,
    timeEntries: timeEntryOperations,
    projects: projectOperations
  };
}

export default useStorage;