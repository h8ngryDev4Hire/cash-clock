import { storageService } from '@services/storage/StorageService';
import { generateUUID } from '@services/timer/uuid';
import { TaskSchema, TimeEntrySchema, ProjectId } from '@types/entities';

/**
 * TaskService provides business logic for task operations
 * It interacts with StorageService for database persistence
 */
export class TaskService {
  private static instance: TaskService;

  /**
   * Private constructor prevents direct instantiation
   */
  private constructor() {}

  /**
   * Gets the singleton instance of TaskService
   */
  public static getInstance(): TaskService {
    if (!TaskService.instance) {
      TaskService.instance = new TaskService();
    }
    return TaskService.instance;
  }

  /**
   * Create a new task
   * @param name Task name
   * @param projectId Optional project ID to associate with the task
   * @returns The created task
   */
  public async createTask(name: string, projectId?: ProjectId): Promise<TaskSchema> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const itemId = generateUUID();

      const taskData = {
        item_id: itemId,
        name,
        is_running: 0,
        is_grouped: projectId ? 1 : 0,
        is_completed: 0,
        project_id: projectId || null,
        created: now,
        last_updated: now
      };

      storageService.insert('tasks', taskData);

      return {
        itemId,
        name,
        isRunning: false,
        isGrouped: !!projectId,
        isCompleted: false,
        projectId: projectId || null,
        created: now,
        lastUpdated: now
      };
    } catch (error) {
      console.error('Error creating task:', error);
      throw new Error('Failed to create task');
    }
  }

  /**
   * Update an existing task
   * @param taskId ID of the task to update
   * @param updates Partial task data to update
   */
  public async updateTask(
    taskId: string, 
    updates: Partial<Omit<TaskSchema, 'itemId' | 'created' | 'lastUpdated'>>
  ): Promise<void> {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      // Convert from schema properties to database column names
      const dbUpdates: Record<string, any> = { last_updated: now };
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.isRunning !== undefined) dbUpdates.is_running = updates.isRunning ? 1 : 0;
      if (updates.isGrouped !== undefined) dbUpdates.is_grouped = updates.isGrouped ? 1 : 0;
      if (updates.isCompleted !== undefined) dbUpdates.is_completed = updates.isCompleted ? 1 : 0;
      if (updates.projectId !== undefined) dbUpdates.project_id = updates.projectId;

      storageService.update('tasks', dbUpdates, 'item_id = ?', [taskId]);
    } catch (error) {
      console.error('Error updating task:', error);
      throw new Error('Failed to update task');
    }
  }

  /**
   * Delete a task and all associated time entries
   * @param taskId ID of the task to delete
   */
  public async deleteTask(taskId: string): Promise<void> {
    try {
      // First delete all time entries for this task (cascade delete)
      storageService.delete('time_entries', 'task_id = ?', [taskId]);
      
      // Then delete the task itself
      storageService.delete('tasks', 'item_id = ?', [taskId]);
    } catch (error) {
      console.error('Error deleting task:', error);
      throw new Error('Failed to delete task');
    }
  }

  /**
   * Get a task by ID
   * @param taskId ID of the task to retrieve
   * @returns The task or null if not found
   */
  public async getTaskById(taskId: string): Promise<TaskSchema | null> {
    try {
      const result = storageService.findOne('tasks', '*', 'item_id = ?', [taskId]);
      
      if (!result) return null;
      
      return {
        itemId: result.item_id,
        name: result.name,
        isRunning: !!result.is_running,
        isGrouped: !!result.is_grouped,
        isCompleted: !!result.is_completed,
        projectId: result.project_id,
        created: result.created,
        lastUpdated: result.last_updated
      };
    } catch (error) {
      console.error('Error getting task by ID:', error);
      throw new Error('Failed to get task');
    }
  }

  /**
   * Get all tasks
   * @returns Array of all tasks
   */
  public async getAllTasks(): Promise<TaskSchema[]> {
    try {
      const results = storageService.find('tasks');
      
      return results.map(row => ({
        itemId: row.item_id,
        name: row.name,
        isRunning: !!row.is_running,
        isGrouped: !!row.is_grouped,
        isCompleted: !!row.is_completed,
        projectId: row.project_id,
        created: row.created,
        lastUpdated: row.last_updated
      }));
    } catch (error) {
      console.error('Error getting all tasks:', error);
      throw new Error('Failed to get tasks');
    }
  }

  /**
   * Get tasks for a specific project
   * @param projectId Project ID to filter tasks by
   * @returns Array of tasks for the project
   */
  public async getTasksByProject(projectId: string): Promise<TaskSchema[]> {
    try {
      const results = storageService.find('tasks', '*', 'project_id = ?', [projectId]);
      
      return results.map(row => ({
        itemId: row.item_id,
        name: row.name,
        isRunning: !!row.is_running,
        isGrouped: !!row.is_grouped,
        isCompleted: !!row.is_completed,
        projectId: row.project_id,
        created: row.created,
        lastUpdated: row.last_updated
      }));
    } catch (error) {
      console.error('Error getting tasks by project:', error);
      throw new Error('Failed to get tasks for project');
    }
  }

  /**
   * Get time entries for a specific task
   * @param taskId Task ID to get time entries for
   * @returns Array of time entries for the task
   */
  public async getTimeEntriesForTask(taskId: string): Promise<TimeEntrySchema[]> {
    try {
      const results = storageService.find('time_entries', '*', 'task_id = ?', [taskId]);
      
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
      console.error('Error getting time entries for task:', error);
      throw new Error('Failed to get time entries');
    }
  }

  /**
   * Calculate total time spent on a task
   * @param taskId Task ID to calculate time for
   * @returns Total time in seconds
   */
  public async getTaskTotalTime(taskId: string): Promise<number> {
    try {
      const timeEntries = await this.getTimeEntriesForTask(taskId);
      
      return timeEntries.reduce((total, entry) => {
        // For completed entries, use the recorded time
        if (entry.timeEnded) {
          return total + entry.timeSpent;
        }
        
        // For running entries, calculate current elapsed time
        if (entry.isRunning) {
          const now = Math.floor(Date.now() / 1000);
          const elapsed = now - entry.timeStarted;
          return total + entry.timeSpent + elapsed;
        }
        
        return total + entry.timeSpent;
      }, 0);
    } catch (error) {
      console.error('Error calculating task total time:', error);
      throw new Error('Failed to calculate task time');
    }
  }

  /**
   * Complete a task
   * @param taskId ID of the task to mark as completed
   */
  public async completeTask(taskId: string): Promise<void> {
    return this.updateTask(taskId, { isCompleted: true, isRunning: false });
  }

  /**
   * Reopen a completed task
   * @param taskId ID of the task to mark as not completed
   */
  public async reopenTask(taskId: string): Promise<void> {
    return this.updateTask(taskId, { isCompleted: false });
  }

  /**
   * Assign a task to a project
   * @param taskId ID of the task to assign
   * @param projectId ID of the project to assign to
   */
  public async assignTaskToProject(taskId: string, projectId: string): Promise<void> {
    return this.updateTask(taskId, { projectId, isGrouped: true });
  }

  /**
   * Remove a task from its project
   * @param taskId ID of the task to unassign
   */
  public async unassignTaskFromProject(taskId: string): Promise<void> {
    return this.updateTask(taskId, { projectId: null, isGrouped: false });
  }
}

// Create and export singleton instance
export const taskService = TaskService.getInstance(); 