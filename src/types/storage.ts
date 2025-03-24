/**
 * Storage-related type definitions
 */
import { TaskSchema, TimeEntrySchema, ProjectSchema } from './tasks';

/**
 * Entity types supported by the storage system
 */
export type EntityType = 'task' | 'timeEntry' | 'project';

/**
 * Generic type for entity operations provided by the storage system
 */
export type EntityOperations<T> = {
  getAll: () => T[];
  getById: (id: string) => T | undefined;
  create: (data: any) => Promise<T>;
  update: (id: string, updates: Partial<any>) => Promise<void>;
  delete: (id: string) => Promise<void>;
};

/**
 * Storage context interface that defines the shape of the StorageContext
 * exposed to components and hooks
 */
export interface StorageContextType {
  // Data state
  tasks: TaskSchema[];
  timeEntries: TimeEntrySchema[];
  projects: ProjectSchema[];
  
  // Loading and error states
  isLoading: boolean;
  error: Error | null;
  lastUpdated: number | null;
  
  // Core storage operations
  refreshData: () => Promise<void>;
  
  // Generic entity operations
  createEntity: <T extends { itemId: string }>(
    table: string,
    data: Omit<T, 'itemId' | 'created' | 'lastUpdated'>,
    transform?: (dbData: any) => T
  ) => Promise<T>;
  
  updateEntity: <T extends { itemId: string }>(
    table: string,
    itemId: string,
    updates: Partial<Omit<T, 'itemId' | 'created' | 'lastUpdated'>>,
    transform?: (dbData: any) => T
  ) => Promise<void>;
  
  deleteEntity: (
    table: string,
    itemId: string,
    options?: {
      cascade?: { table: string; foreignKey: string }[];
      beforeDelete?: () => Promise<void>;
      afterDelete?: () => Promise<void>;
    }
  ) => Promise<void>;
  
  findEntity: <T extends { itemId: string }>(
    table: string,
    itemId: string,
    transform?: (dbData: any) => T
  ) => Promise<T | null>;
  
  findEntities: <T extends { itemId: string }>(
    table: string,
    where?: string,
    params?: any[],
    transform?: (dbData: any) => T
  ) => Promise<T[]>;
  
  // Task-specific operations (these are for compatibility with existing code)
  createTask?: (data: Omit<TaskSchema, 'itemId' | 'created' | 'lastUpdated'>) => Promise<TaskSchema>;
  updateTask?: (taskId: string, updates: Partial<Omit<TaskSchema, 'itemId' | 'created' | 'lastUpdated'>>) => Promise<void>;
  deleteTask?: (taskId: string) => Promise<void>;
  getTaskById?: (taskId: string) => TaskSchema | undefined;
  getTimeEntriesForTask?: (taskId: string) => TimeEntrySchema[];
  
  // TimeEntry-specific operations (these are for compatibility with existing code)
  createTimeEntry?: (data: Omit<TimeEntrySchema, 'itemId' | 'created' | 'lastUpdated'>) => Promise<TimeEntrySchema>;
  updateTimeEntry?: (entryId: string, updates: Partial<Omit<TimeEntrySchema, 'itemId' | 'created' | 'lastUpdated'>>) => Promise<void>;
  deleteTimeEntry?: (entryId: string) => Promise<void>;
  
  // Project-specific operations (these are for compatibility with existing code)
  createProject?: (data: Omit<ProjectSchema, 'itemId' | 'created' | 'lastUpdated'>) => Promise<ProjectSchema>;
  updateProject?: (projectId: string, updates: Partial<Omit<ProjectSchema, 'itemId' | 'created' | 'lastUpdated'>>) => Promise<void>;
  deleteProject?: (projectId: string) => Promise<void>;
  
  // Add any other methods that might be used in the codebase
  [key: string]: any;
}

/**
 * Type for the useStorage hook return value
 */
export interface StorageHookResult<T = TaskSchema | TimeEntrySchema | ProjectSchema> {
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
} 