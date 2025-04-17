/**
 * Core entity types and interfaces for the application
 */

/**
 * Entity ID types
 */
export type TaskId = string;
export type TimeEntryId = string;
export type ProjectId = string;
export type ItemId = TaskId | TimeEntryId | ProjectId;

/**
 * Base entity interface
 * All database entities inherit from this
 */
export interface BaseItem {
  itemId: ItemId;
  created: number;
  lastUpdated: number;
}

/**
 * Task schema representing a task in the database
 */
export interface TaskSchema extends BaseItem {
  name: string;
  isRunning: boolean;
  isGrouped: boolean;
  isCompleted: boolean;
  projectId: ProjectId | null;
  timeEntries?: TimeEntrySchema[];
  getTotalTimeSpent?: () => number;
}

/**
 * Time entry schema representing a time tracking entry in the database
 */
export interface TimeEntrySchema extends BaseItem {
  taskId: TaskId;
  isRunning: boolean;
  timeSpent: number;
  timeStarted: number;
  timeEnded: number | null;
}

/**
 * Project schema representing a project in the database
 */
export interface ProjectSchema extends BaseItem {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  goals?: string;
  milestones?: string;
}

/**
 * Task model for UI components
 */
export interface Task {
  id: string;
  name: string;
  totalTime: number; // in seconds
  projectId?: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  isRunning?: boolean;
  isCompleted?: boolean;
}

/**
 * Time entry model for UI components
 */
export interface TimeEntry {
  id: string;
  taskId: string;
  startTime: number; // timestamp
  endTime: number | null; // timestamp
  duration: number; // in seconds
  isRunning?: boolean;
}

/**
 * Project model for UI components
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  goals?: string;
  milestones?: string;
  createdAt: number;
  updatedAt: number;
} 