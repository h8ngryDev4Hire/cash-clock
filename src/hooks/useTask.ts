import { useContext } from 'react';
import { TaskContext, TaskContextType } from '@context/TaskContext';
import { StorageContext } from '@context/StorageContext';
import { TaskSchema, TimeEntrySchema } from '@def/entities';
import { Task } from '@def/core';
import { toUITask, toTaskSchema, addTotalTime } from '@lib/util/task/taskTransformers';
import { calculateTotalDuration } from '@lib/util/time/timeEntryTransformers';
import { log } from '@lib/util/debugging/logging';

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
    log(`getTaskWithTime: Fetching task details for taskId: ${taskId}`, 'useTask', 'getTaskWithTime', 'DEBUG');
    
    const task = await taskContext.getTaskById(taskId);
    if (!task) {
      log(`getTaskWithTime: No task found for ID: ${taskId}`, 'useTask', 'getTaskWithTime', 'WARNING');
      return null;
    }
    
    // Use the taskContext method to get the total time, which already has caching logic
    const totalTime = await taskContext.getTaskTotalTime(taskId);
    
    const taskWithTime = addTotalTime(toUITask(task), totalTime);
    log(`getTaskWithTime: Successfully retrieved task - name: ${taskWithTime.name}, totalTime: ${taskWithTime.totalTime}`, 
        'useTask', 'getTaskWithTime', 'DEBUG');
        
    return taskWithTime;
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
    log(`updateTask: Updating task ID ${taskId} with: ${JSON.stringify(updates)}`, 'useTask', 'updateTask', 'INFO');
    await taskContext.updateTask(taskId, updates);
  };
  
  /**
   * Delete a task
   */
  const deleteTask = async (taskId: string): Promise<boolean> => {
    try {
      log(`deleteTask: Deleting task ID ${taskId}`, 'useTask', 'deleteTask', 'INFO');
      await taskContext.deleteTask(taskId);
      log(`deleteTask: Successfully deleted task ID ${taskId}`, 'useTask', 'deleteTask', 'INFO');
      return true;
    } catch (err) {
      log(`deleteTask: Error deleting task ${taskId}: ${err}`, 'useTask', 'deleteTask', 'ERROR', { 
        variableName: 'error', 
        value: err 
      });
      return false;
    }
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
    log('refreshTasks: Refreshing tasks data from storage', 'useTask', 'refreshTasks', 'DEBUG');
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
  
  /**
   * Calculate total time spent on a task
   * This is a more direct method that doesn't rely on the context
   */
  const calculateTaskTotalTime = (taskId: string): number => {
    const taskTimeEntries = timeEntries.filter(entry => entry.taskId === taskId);
    return calculateTotalDuration(taskTimeEntries);
  };
  
  /**
   * Load and refresh complete task data
   * This method combines multiple operations for fetching fresh task data
   */
  const loadTaskDetails = async (taskId: string | null): Promise<Task | null> => {
    if (!taskId) {
      log('loadTaskDetails: No taskId provided', 'useTask', 'loadTaskDetails', 'WARNING');
      return null;
    }
    
    try {
      // Refresh all data first to ensure we have the latest
      log('loadTaskDetails: Refreshing all data first', 'useTask', 'loadTaskDetails', 'DEBUG');
      await refreshData();
      
      // Then fetch the specific task with time
      log(`loadTaskDetails: Fetching task details for ID ${taskId}`, 'useTask', 'loadTaskDetails', 'DEBUG');
      const taskData = await getTaskWithTime(taskId);
      
      if (!taskData) {
        log(`loadTaskDetails: No task found for ID ${taskId}`, 'useTask', 'loadTaskDetails', 'WARNING');
        return null;
      }
      
      log(`loadTaskDetails: Successfully loaded task ${taskId} - ${taskData.name}`, 'useTask', 'loadTaskDetails', 'INFO');
      return taskData;
    } catch (err) {
      log(`loadTaskDetails: Error loading task data for ${taskId}: ${err}`, 'useTask', 'loadTaskDetails', 'ERROR', {
        variableName: 'error',
        value: err
      });
      return null;
    }
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
    loadTaskDetails,
    
    // Time calculations
    calculateTaskTotalTime,
    
    // Project relationship
    assignToProject,
    removeFromProject,
    
    // Data management
    refreshTasks,
    refreshData,
    
    // Transformation utilities
    toUITask,
    toTaskSchema,
    addTotalTime
  };
};

export default useTask; 