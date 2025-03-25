import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/task/TaskService';
import { storageService } from '../services/storage/StorageService';
import { TaskSchema, TimeEntrySchema } from '../types/entities';
import { Task, TimeEntry } from '../types/core';

// Define the shape of our context
export interface TaskContextType {
  tasks: TaskSchema[];
  timeEntries: TimeEntrySchema[];
  isLoading: boolean;
  error: Error | null;
  createTask: (name: string, projectId?: string) => Promise<TaskSchema>;
  updateTask: (taskId: string, updates: Partial<Omit<TaskSchema, 'itemId' | 'created' | 'lastUpdated'>>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  getTaskById: (taskId: string) => Promise<TaskSchema | null>;
  getTimeEntriesForTask: (taskId: string) => Promise<TimeEntrySchema[]>;
  getTaskTotalTime: (taskId: string) => Promise<number>;
  completeTask: (taskId: string) => Promise<void>;
  reopenTask: (taskId: string) => Promise<void>;
  assignTaskToProject: (taskId: string, projectId: string) => Promise<void>;
  unassignTaskFromProject: (taskId: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

// Create the context with a default (empty) value
export const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<TaskSchema[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntrySchema[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Helper function to load tasks from the database
  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Initialize the database if needed
      await storageService.initialize();
      
      // Get all tasks
      const allTasks = await taskService.getAllTasks();
      setTasks(allTasks);
      
      // For each task, get its time entries
      const allTimeEntries: TimeEntrySchema[] = [];
      for (const task of allTasks) {
        const entries = await taskService.getTimeEntriesForTask(task.itemId);
        allTimeEntries.push(...entries);
      }
      setTimeEntries(allTimeEntries);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
      setIsLoading(false);
    }
  }, []);

  // Load tasks on component mount
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Create a new task
  const createTask = useCallback(async (name: string, projectId?: string): Promise<TaskSchema> => {
    try {
      const newTask = await taskService.createTask(name, projectId);
      
      // Update local state
      setTasks(prevTasks => [...prevTasks, newTask]);
      
      return newTask;
    } catch (error) {
      console.error('Failed to create task:', error);
      setError(error instanceof Error ? error : new Error('Failed to create task'));
      throw error;
    }
  }, []);

  // Update an existing task
  const updateTask = useCallback(async (
    taskId: string, 
    updates: Partial<Omit<TaskSchema, 'itemId' | 'created' | 'lastUpdated'>>
  ): Promise<void> => {
    try {
      await taskService.updateTask(taskId, updates);
      
      // Update local state
    setTasks(prevTasks => 
      prevTasks.map(task => 
          task.itemId === taskId 
            ? { 
                ...task, 
                ...updates, 
                lastUpdated: Math.floor(Date.now() / 1000) 
              } 
          : task
      )
    );
    } catch (error) {
      console.error('Failed to update task:', error);
      setError(error instanceof Error ? error : new Error('Failed to update task'));
      throw error;
    }
  }, []);

  // Delete a task
  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      await taskService.deleteTask(taskId);
      
      // Update local state
      setTasks(prevTasks => prevTasks.filter(task => task.itemId !== taskId));
      setTimeEntries(prevEntries => prevEntries.filter(entry => entry.taskId !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
      setError(error instanceof Error ? error : new Error('Failed to delete task'));
      throw error;
    }
  }, []);

  // Get a task by ID
  const getTaskById = useCallback(async (taskId: string): Promise<TaskSchema | null> => {
    try {
      return await taskService.getTaskById(taskId);
    } catch (error) {
      console.error('Failed to get task by ID:', error);
      setError(error instanceof Error ? error : new Error('Failed to get task by ID'));
      throw error;
    }
  }, []);

  // Get time entries for a task
  const getTimeEntriesForTask = useCallback(async (taskId: string): Promise<TimeEntrySchema[]> => {
    try {
      return await taskService.getTimeEntriesForTask(taskId);
    } catch (error) {
      console.error('Failed to get time entries for task:', error);
      setError(error instanceof Error ? error : new Error('Failed to get time entries'));
      throw error;
    }
  }, []);

  // Get total time for a task
  const getTaskTotalTime = useCallback(async (taskId: string): Promise<number> => {
    try {
      return await taskService.getTaskTotalTime(taskId);
    } catch (error) {
      console.error('Failed to get task total time:', error);
      setError(error instanceof Error ? error : new Error('Failed to calculate task time'));
      throw error;
    }
  }, []);

  // Mark a task as completed
  const completeTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      await taskService.completeTask(taskId);
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.itemId === taskId 
            ? { 
                ...task, 
                isCompleted: true,
                isRunning: false,
                lastUpdated: Math.floor(Date.now() / 1000) 
              } 
            : task
        )
      );
    } catch (error) {
      console.error('Failed to complete task:', error);
      setError(error instanceof Error ? error : new Error('Failed to complete task'));
      throw error;
    }
  }, []);

  // Reopen a completed task
  const reopenTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      await taskService.reopenTask(taskId);
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.itemId === taskId 
            ? { 
                ...task, 
                isCompleted: false,
                lastUpdated: Math.floor(Date.now() / 1000) 
              } 
            : task
        )
      );
    } catch (error) {
      console.error('Failed to reopen task:', error);
      setError(error instanceof Error ? error : new Error('Failed to reopen task'));
      throw error;
    }
  }, []);

  // Assign a task to a project
  const assignTaskToProject = useCallback(async (taskId: string, projectId: string): Promise<void> => {
    try {
      await taskService.assignTaskToProject(taskId, projectId);
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.itemId === taskId 
            ? { 
                ...task, 
                projectId,
                isGrouped: true,
                lastUpdated: Math.floor(Date.now() / 1000) 
              } 
            : task
        )
      );
    } catch (error) {
      console.error('Failed to assign task to project:', error);
      setError(error instanceof Error ? error : new Error('Failed to assign task to project'));
      throw error;
    }
  }, []);

  // Remove a task from its project
  const unassignTaskFromProject = useCallback(async (taskId: string): Promise<void> => {
    try {
      await taskService.unassignTaskFromProject(taskId);
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.itemId === taskId 
            ? { 
                ...task, 
                projectId: null,
                isGrouped: false,
                lastUpdated: Math.floor(Date.now() / 1000) 
              } 
            : task
        )
      );
    } catch (error) {
      console.error('Failed to unassign task from project:', error);
      setError(error instanceof Error ? error : new Error('Failed to unassign task from project'));
      throw error;
    }
  }, []);

  return (
    <TaskContext.Provider
      value={{
        tasks,
        timeEntries,
        isLoading,
        error,
        createTask,
        updateTask,
        deleteTask,
        getTaskById,
        getTimeEntriesForTask,
        getTaskTotalTime,
        completeTask,
        reopenTask,
        assignTaskToProject,
        unassignTaskFromProject,
        refreshTasks: loadTasks
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

// Custom hook to use the task context
export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};