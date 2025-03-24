import { useCallback } from 'react';
import { useStorageContext } from '../context/StorageContext';
import { TaskSchema, TimeEntrySchema, ProjectSchema } from '../types/entities';
import { EntityType, EntityOperations, StorageHookResult } from '../types/storage';

/**
 * useStorage is a custom hook that provides a unified interface for
 * CRUD operations on different entity types in storage
 */
export function useStorage<T = TaskSchema | TimeEntrySchema | ProjectSchema>(
  entityType?: EntityType
): StorageHookResult<T> {
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
    getById: (id) => getTaskById?.(id) || undefined,
    create: (data) => createTask?.(data) || Promise.reject(new Error('Task creation not available')),
    update: (id, updates) => updateTask?.(id, updates) || Promise.reject(new Error('Task update not available')),
    delete: (id) => deleteTask?.(id) || Promise.reject(new Error('Task deletion not available'))
  };
  
  // TimeEntry operations
  const timeEntryOperations: EntityOperations<TimeEntrySchema> = {
    getAll: () => timeEntries,
    getById: (id) => timeEntries.find(entry => entry.itemId === id),
    create: (data) => createTimeEntry?.(data) || Promise.reject(new Error('TimeEntry creation not available')),
    update: (id, updates) => updateTimeEntry?.(id, updates) || Promise.reject(new Error('TimeEntry update not available')),
    delete: (id) => deleteTimeEntry?.(id) || Promise.reject(new Error('TimeEntry deletion not available'))
  };
  
  // Project operations
  const projectOperations: EntityOperations<ProjectSchema> = {
    getAll: () => projects,
    getById: (id) => projects.find(project => project.itemId === id),
    create: (data) => createProject?.(data) || Promise.reject(new Error('Project creation not available')),
    update: (id, updates) => updateProject?.(id, updates) || Promise.reject(new Error('Project update not available')),
    delete: (id) => deleteProject?.(id) || Promise.reject(new Error('Project deletion not available'))
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