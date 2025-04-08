import React, { createContext, useContext, useCallback } from 'react';
import { taskService } from '@lib/services/task/TaskService';
import { TaskSchema, TimeEntrySchema } from '@def/entities';
import { Task, TimeEntry } from '@def/core';
import { StorageContext } from './StorageContext';
import { storageService } from '@lib/services/storage/StorageService';
import { generateUUID } from '@lib/util/uuid';
import { log } from '@lib/util/debugging/logging';



// Define the shape of our context
export interface TaskContextType {
  // No longer duplicate tasks and timeEntries here
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
}

// Create the context with a default (empty) value
export const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use StorageContext for data access
  const storageContext = useContext(StorageContext);
  
  if (!storageContext) {
    throw new Error('TaskProvider must be used within a StorageProvider');
  }
  
  const { refreshData } = storageContext;

  // Create a new task directly with the database
  const createTask = useCallback(async (name: string, projectId?: string): Promise<TaskSchema> => {
    try {
      log('Creating task with name: ' + name + ', projectId: ' + (projectId || 'none'), 'TaskContext.createTask', 'INFO');
      
      // Generate a unique ID
      const taskId = generateUUID();
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Use direct database access to ensure column names match
      storageService.insert('tasks', {
        item_id: taskId,
        name: name,
        project_id: projectId || null,
        is_completed: 0,
        is_running: 0,
        is_grouped: projectId ? 1 : 0,
        created: timestamp,
        last_updated: timestamp
      });
      
      log('Task created in database, refreshing data', 'TaskContext.createTask', 'INFO');
      
      // Force refresh data to update UI
      await refreshData();
      
      // Return the task in the expected format
      const newTask: TaskSchema = {
        itemId: taskId,
        name: name,
        projectId: projectId || null,
        isCompleted: false,
        isRunning: false,
        isGrouped: !!projectId,
        created: timestamp,
        lastUpdated: timestamp
      };
      
      log('Returning new task', 'TaskContext.createTask', 'INFO', { variableName: 'newTask', value: newTask });
      return newTask;
    } catch (error) {
      log('Failed to create task', 'TaskContext.createTask', 'ERROR', { variableName: 'error', value: error });
      throw error;
    }
  }, [refreshData]);

  // Update an existing task directly with the database
  const updateTask = useCallback(async (
    taskId: string, 
    updates: Partial<Omit<TaskSchema, 'itemId' | 'created' | 'lastUpdated'>>
  ): Promise<void> => {
    try {
      log(`Updating task: ${taskId}`, 'TaskContext.updateTask', 'INFO', { variableName: 'updates', value: updates });
      
      // Create database-friendly updates with snake_case names
      const dbUpdates: Record<string, any> = {};
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Add last_updated timestamp
      dbUpdates.last_updated = timestamp;
      
      // Map camelCase properties to snake_case column names
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted ? 1 : 0;
      if (updates.isRunning !== undefined) dbUpdates.is_running = updates.isRunning ? 1 : 0;
      if (updates.isGrouped !== undefined) dbUpdates.is_grouped = updates.isGrouped ? 1 : 0;
      if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;
      
      log('Updating database', 'TaskContext.updateTask', 'INFO', { variableName: 'dbUpdates', value: dbUpdates });
      
      // Direct database update
      storageService.update('tasks', dbUpdates, 'item_id = ?', [taskId]);
      
      log('Task updated in database, refreshing data', 'TaskContext.updateTask', 'INFO');
      
      // Force refresh data to update UI
      await refreshData();
    } catch (error) {
      log('Failed to update task', 'TaskContext.updateTask', 'ERROR', { variableName: 'error', value: error });
      throw error;
    }
  }, [refreshData]);

  // Delete a task directly with the database
  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      log(`Deleting task: ${taskId}`, 'TaskContext.deleteTask', 'INFO');
      
      // First delete associated time entries
      storageService.delete('time_entries', 'task_id = ?', [taskId]);
      
      // Then delete the task
      storageService.delete('tasks', 'item_id = ?', [taskId]);
      
      log('Task deleted from database, refreshing data', 'TaskContext.deleteTask', 'INFO');
      
      // Force refresh data to update UI
      await refreshData();
    } catch (error) {
      log('Failed to delete task', 'TaskContext.deleteTask', 'ERROR', { variableName: 'error', value: error });
      throw error;
    }
  }, [refreshData]);

  // Get a task by ID directly from the database
  const getTaskById = useCallback(async (taskId: string): Promise<TaskSchema | null> => {
    try {
      log(`Getting task by ID: ${taskId}`, 'TaskContext.getTaskById', 'INFO');
      
      const result = storageService.findOne('tasks', '*', 'item_id = ?', [taskId]);
      
      if (!result) {
        log(`No task found with ID: ${taskId}`, 'TaskContext.getTaskById', 'INFO');
        return null;
      }
      
      log('Found task in database', 'TaskContext.getTaskById', 'INFO', { variableName: 'result', value: result });
      
      // Convert to TaskSchema
      return {
        itemId: result.item_id,
        name: result.name,
        projectId: result.project_id,
        isCompleted: !!result.is_completed,
        isRunning: !!result.is_running,
        isGrouped: !!result.is_grouped,
        created: result.created,
        lastUpdated: result.last_updated
      };
    } catch (error) {
      log('Failed to get task by ID', 'TaskContext.getTaskById', 'ERROR', { variableName: 'error', value: error });
      throw error;
    }
  }, []);

  // Get time entries for a task directly from the database
  const getTimeEntriesForTask = useCallback(async (taskId: string): Promise<TimeEntrySchema[]> => {
    try {
      log(`Getting time entries for task: ${taskId}`, 'TaskContext.getTimeEntriesForTask', 'INFO');
      
      const results = storageService.find('time_entries', '*', 'task_id = ?', [taskId]);
      
      log('Found time entries', 'TaskContext.getTimeEntriesForTask', 'INFO', { variableName: 'results', value: results });
      
      // Convert to TimeEntrySchema[]
      return results.map(row => ({
        itemId: row.item_id,
        taskId: row.task_id,
        isRunning: !!row.is_running,
        timeSpent: row.time_spent,
        timeStarted: row.time_started,
        timeEnded: row.time_ended,
        created: row.created,
        lastUpdated: row.last_updated
      }));
    } catch (error) {
      log('Failed to get time entries for task', 'TaskContext.getTimeEntriesForTask', 'ERROR', { variableName: 'error', value: error });
      throw error;
    }
  }, []);

  // Get total time for a task
  const getTaskTotalTime = useCallback(async (taskId: string): Promise<number> => {
    try {
      const entries = await getTimeEntriesForTask(taskId);
      const totalTime = entries.reduce((total, entry) => total + (entry.timeSpent || 0), 0);
      log(`Total time for task ${taskId}: ${totalTime}`, 'TaskContext.getTaskTotalTime', 'INFO');
      return totalTime;
    } catch (error) {
      log('Failed to get task total time', 'TaskContext.getTaskTotalTime', 'ERROR', { variableName: 'error', value: error });
      throw error;
    }
  }, [getTimeEntriesForTask]);

  // Mark a task as completed
  const completeTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      await updateTask(taskId, {
        isCompleted: true,
        isRunning: false
      });
    } catch (error) {
      log('Failed to complete task', 'TaskContext.completeTask', 'ERROR', { variableName: 'error', value: error });
      throw error;
    }
  }, [updateTask]);

  // Reopen a completed task
  const reopenTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      await updateTask(taskId, {
        isCompleted: false
      });
    } catch (error) {
      log('Failed to reopen task', 'TaskContext.reopenTask', 'ERROR', { variableName: 'error', value: error });
      throw error;
    }
  }, [updateTask]);

  // Assign a task to a project
  const assignTaskToProject = useCallback(async (taskId: string, projectId: string): Promise<void> => {
    try {
      await updateTask(taskId, {
        projectId,
        isGrouped: true
      });
    } catch (error) {
      log('Failed to assign task to project', 'TaskContext.assignTaskToProject', 'ERROR', { variableName: 'error', value: error });
      throw error;
    }
  }, [updateTask]);

  // Remove a task from its project
  const unassignTaskFromProject = useCallback(async (taskId: string): Promise<void> => {
    try {
      await updateTask(taskId, {
        projectId: null,
        isGrouped: false
      });
    } catch (error) {
      log('Failed to unassign task from project', 'TaskContext.unassignTaskFromProject', 'ERROR', { variableName: 'error', value: error });
      throw error;
    }
  }, [updateTask]);

  return (
    <TaskContext.Provider
      value={{
        // Methods only, no duplicated state
        createTask,
        updateTask,
        deleteTask,
        getTaskById,
        getTimeEntriesForTask,
        getTaskTotalTime,
        completeTask,
        reopenTask,
        assignTaskToProject,
        unassignTaskFromProject
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

