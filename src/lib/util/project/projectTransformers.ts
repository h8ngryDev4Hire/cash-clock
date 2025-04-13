/**
 * Utility functions for transforming project data and calculating statistics
 */
import { ProjectSchema, TaskSchema, TimeEntrySchema } from '@def/entities';
import { Project } from '@def/core';

/**
 * Transform a database project schema to a UI project model
 */
export const transformProjectSchemaToModel = (schema: ProjectSchema): Project => {
  return {
    id: schema.itemId,
    name: schema.name,
    description: schema.description,
    color: schema.color,
    goals: schema.goals,
    milestones: schema.milestones,
    createdAt: schema.created,
    updatedAt: schema.lastUpdated
  };
};

/**
 * Get total time spent on a project by aggregating task times
 */
export const getProjectTotalTime = (
  projectId: string,
  tasks: TaskSchema[],
  timeEntries: TimeEntrySchema[]
): number => {
  // Find all tasks belonging to this project
  const projectTasks = tasks.filter(task => task.projectId === projectId);
  
  if (projectTasks.length === 0) {
    return 0;
  }
  
  // Sum up the total time spent on all project tasks
  return projectTasks.reduce((totalTime, task) => {
    // Get all time entries for this task
    const taskEntries = timeEntries.filter(entry => entry.taskId === task.itemId);
    
    // Sum up time for all entries
    const taskTotalTime = taskEntries.reduce((taskTime, entry) => {
      // For completed entries, use the recorded time
      if (!entry.isRunning && entry.timeSpent > 0) {
        return taskTime + entry.timeSpent;
      }
      
      // For running entries, calculate current time
      if (entry.isRunning) {
        const now = Math.floor(Date.now() / 1000);
        const elapsedTime = now - entry.timeStarted;
        return taskTime + elapsedTime;
      }
      
      return taskTime;
    }, 0);
    
    return totalTime + taskTotalTime;
  }, 0);
};

/**
 * Get the count of tasks in a project
 */
export const getProjectTaskCount = (
  projectId: string,
  tasks: TaskSchema[]
): number => {
  return tasks.filter(task => task.projectId === projectId).length;
};

/**
 * Get the count of completed tasks in a project
 */
export const getProjectCompletedTaskCount = (
  projectId: string,
  tasks: TaskSchema[]
): number => {
  return tasks.filter(task => task.projectId === projectId && task.isCompleted).length;
};

/**
 * Calculate project completion percentage
 */
export const getProjectCompletionPercentage = (
  projectId: string,
  tasks: TaskSchema[]
): number => {
  const totalTasks = getProjectTaskCount(projectId, tasks);
  if (totalTasks === 0) {
    return 0;
  }
  
  const completedTasks = getProjectCompletedTaskCount(projectId, tasks);
  return Math.round((completedTasks / totalTasks) * 100);
};

/**
 * Project with additional calculated statistics
 */
export interface ProjectWithStats extends Project {
  taskCount: number;
  completedTaskCount: number;
  completionPercentage: number;
  totalTime: number;
}

/**
 * Enhance a project with calculated statistics
 */
export const enhanceProjectWithStats = (
  project: Project,
  tasks: TaskSchema[],
  timeEntries: TimeEntrySchema[]
): ProjectWithStats => {
  const taskCount = getProjectTaskCount(project.id, tasks);
  const completedTaskCount = getProjectCompletedTaskCount(project.id, tasks);
  const completionPercentage = getProjectCompletionPercentage(project.id, tasks);
  const totalTime = getProjectTotalTime(project.id, tasks, timeEntries);
  
  return {
    ...project,
    taskCount,
    completedTaskCount,
    completionPercentage,
    totalTime
  };
}; 