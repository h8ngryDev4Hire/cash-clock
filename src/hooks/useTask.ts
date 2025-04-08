import { useContext } from 'react';
import { TaskContext, TaskContextType } from '@context/TaskContext';
import { StorageContext } from '@context/StorageContext';
import { TaskSchema, TimeEntrySchema } from '@def/entities';
import { Task } from '@def/core';
import { toUITask, toTaskSchema, addTotalTime } from '@lib/util/task/taskTransformers';

/**
 * useTask hook provides a clean API for components to interact with task functionality
 * It abstracts the TaskContext and provides additional utility methods
 */
export const useTask = () => {
  // Get the task-specific operations
  const taskContext = useContext(TaskContext) as TaskContextType;
  
  if (!taskContext) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  
  // Get data from storage context
  const storageContext = useContext(StorageContext);
  
  if (!storageContext) {
    throw new Error('useTask must be used within a StorageProvider');
  }
  
  const { tasks, timeEntries, isLoading, error, refreshData } = storageContext;
  
  /**
   * Get all tasks with their current total time
   */
  const getAllTasksWithTime = async (): Promise<Task[]> => {
    const result: Task[] = [];
    
    // Get all tasks from storage context
    for (const task of tasks) {
      // Get the total time for this task
      const totalTime = await taskContext.getTaskTotalTime(task.itemId);
      
      // Convert to UI model and add to result
      result.push(addTotalTime(toUITask(task), totalTime));
    }
    
    return result;
  };
  
  /**
   * Get a task with its current total time
   */
  const getTaskWithTime = async (taskId: string): Promise<Task | null> => {
    const task = await taskContext.getTaskById(taskId);
    if (!task) return null;
    
    const totalTime = await taskContext.getTaskTotalTime(taskId);
    
    return addTotalTime(toUITask(task), totalTime);
  };
  
  /**
   * Create a new task
   */
  const createTask = async (name: string, projectId?: string): Promise<Task> => {
    const task = await taskContext.createTask(name, projectId);
    return toUITask(task);
  };
  
  /**
   * Update a task
   */
  const updateTask = async (
    taskId: string, 
    updates: Partial<{ name: string; projectId: string | null; isCompleted: boolean }>
  ): Promise<void> => {
    await taskContext.updateTask(taskId, updates);
  };
  
  /**
   * Delete a task
   */
  const deleteTask = async (taskId: string): Promise<void> => {
    await taskContext.deleteTask(taskId);
  };
  
  /**
   * Complete a task
   */
  const completeTask = async (taskId: string): Promise<void> => {
    await taskContext.completeTask(taskId);
  };
  
  /**
   * Reopen a completed task
   */
  const reopenTask = async (taskId: string): Promise<void> => {
    await taskContext.reopenTask(taskId);
  };
  
  /**
   * Assign a task to a project
   */
  const assignToProject = async (taskId: string, projectId: string): Promise<void> => {
    await taskContext.assignTaskToProject(taskId, projectId);
  };
  
  /**
   * Remove a task from its project
   */
  const removeFromProject = async (taskId: string): Promise<void> => {
    await taskContext.unassignTaskFromProject(taskId);
  };
  
  /**
   * Refresh tasks from the database
   */
  const refreshTasks = async (): Promise<void> => {
    await refreshData();
  };
  
  /**
   * Get tasks filtered by completion status
   */
  const getFilteredTasks = async (showCompleted: boolean): Promise<Task[]> => {
    const allTasks = await getAllTasksWithTime();
    return allTasks.filter(task => {
      const schemaTask = tasks.find((t: TaskSchema) => t.itemId === task.id);
      return schemaTask ? schemaTask.isCompleted === showCompleted : false;
    });
  };
  
  /**
   * Get tasks for a specific project
   */
  const getTasksByProject = async (projectId: string): Promise<Task[]> => {
    const allTasks = await getAllTasksWithTime();
    return allTasks.filter(task => task.projectId === projectId);
  };
  
  return {
    // State (now from StorageContext)
    tasks,
    timeEntries,
    isLoading,
    error,
    
    // Core task operations
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    reopenTask,
    
    // Task retrieval
    getAllTasksWithTime,
    getTaskWithTime,
    getFilteredTasks,
    getTasksByProject,
    
    // Project relationship
    assignToProject,
    removeFromProject,
    
    // Data management
    refreshTasks
  };
};

export default useTask; 