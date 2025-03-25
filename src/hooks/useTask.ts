import { useContext } from 'react';
import { TaskContext, TaskContextType } from '../context/TaskContext';
import { TaskSchema, TimeEntrySchema } from '../types/entities';
import { Task } from '../types/core';

/**
 * useTask hook provides a clean API for components to interact with task functionality
 * It abstracts the TaskContext and provides additional utility methods
 */
export const useTask = () => {
  const context = useContext(TaskContext) as TaskContextType;
  
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  
  // Convert a TaskSchema to UI Task model
  const toUITask = (task: TaskSchema): Task => ({
    id: task.itemId,
    name: task.name,
    totalTime: 0, // Will be populated by getTaskWithTime
    projectId: task.projectId || undefined,
    createdAt: task.created * 1000, // Convert to milliseconds
    updatedAt: task.lastUpdated * 1000, // Convert to milliseconds
  });
  
  /**
   * Get all tasks with their current total time
   */
  const getAllTasksWithTime = async (): Promise<Task[]> => {
    const result: Task[] = [];
    
    // Get all tasks from context
    for (const task of context.tasks) {
      // Get the total time for this task
      const totalTime = await context.getTaskTotalTime(task.itemId);
      
      // Convert to UI model and add to result
      result.push({
        ...toUITask(task),
        totalTime
      });
    }
    
    return result;
  };
  
  /**
   * Get a task with its current total time
   */
  const getTaskWithTime = async (taskId: string): Promise<Task | null> => {
    const task = await context.getTaskById(taskId);
    if (!task) return null;
    
    const totalTime = await context.getTaskTotalTime(taskId);
    
    return {
      ...toUITask(task),
      totalTime
    };
  };
  
  /**
   * Create a new task
   */
  const createTask = async (name: string, projectId?: string): Promise<Task> => {
    const task = await context.createTask(name, projectId);
    return toUITask(task);
  };
  
  /**
   * Update a task
   */
  const updateTask = async (
    taskId: string, 
    updates: Partial<{ name: string; projectId: string | null; isCompleted: boolean }>
  ): Promise<void> => {
    await context.updateTask(taskId, updates);
  };
  
  /**
   * Delete a task
   */
  const deleteTask = async (taskId: string): Promise<void> => {
    await context.deleteTask(taskId);
  };
  
  /**
   * Complete a task
   */
  const completeTask = async (taskId: string): Promise<void> => {
    await context.completeTask(taskId);
  };
  
  /**
   * Reopen a completed task
   */
  const reopenTask = async (taskId: string): Promise<void> => {
    await context.reopenTask(taskId);
  };
  
  /**
   * Assign a task to a project
   */
  const assignToProject = async (taskId: string, projectId: string): Promise<void> => {
    await context.assignTaskToProject(taskId, projectId);
  };
  
  /**
   * Remove a task from its project
   */
  const removeFromProject = async (taskId: string): Promise<void> => {
    await context.unassignTaskFromProject(taskId);
  };
  
  /**
   * Refresh tasks from the database
   */
  const refreshTasks = async (): Promise<void> => {
    await context.refreshTasks();
  };
  
  /**
   * Get tasks filtered by completion status
   */
  const getFilteredTasks = async (showCompleted: boolean): Promise<Task[]> => {
    const tasks = await getAllTasksWithTime();
    return tasks.filter(task => {
      const schemaTask = context.tasks.find((t: TaskSchema) => t.itemId === task.id);
      return schemaTask ? schemaTask.isCompleted === showCompleted : false;
    });
  };
  
  /**
   * Get tasks for a specific project
   */
  const getTasksByProject = async (projectId: string): Promise<Task[]> => {
    const tasks = await getAllTasksWithTime();
    return tasks.filter(task => task.projectId === projectId);
  };
  
  return {
    // State
    tasks: context.tasks,
    timeEntries: context.timeEntries,
    isLoading: context.isLoading,
    error: context.error,
    
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