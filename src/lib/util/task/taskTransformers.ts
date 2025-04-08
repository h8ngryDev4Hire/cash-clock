import { Task } from '@def/core';
import { TaskSchema } from '@def/entities';

/**
 * Convert a TaskSchema to UI Task model
 */
export const toUITask = (task: TaskSchema): Task => ({
  id: task.itemId,
  name: task.name,
  totalTime: 0, // Will be populated by getTaskWithTime
  projectId: task.projectId || undefined,
  createdAt: task.created * 1000, // Convert to milliseconds
  updatedAt: task.lastUpdated * 1000, // Convert to milliseconds
});

/**
 * Convert a UI Task model to TaskSchema
 */
export const toTaskSchema = (task: Task): TaskSchema => ({
  itemId: task.id,
  name: task.name,
  projectId: task.projectId || null,
  created: Math.floor(task.createdAt / 1000), // Convert to seconds
  lastUpdated: Math.floor(task.updatedAt / 1000), // Convert to seconds
  isCompleted: false, // Default value
  isRunning: false, // Default value
  isGrouped: false, // Default value
});

/**
 * Add total time to a task
 */
export const addTotalTime = (task: Task, totalTime: number): Task => ({
  ...task,
  totalTime,
}); 