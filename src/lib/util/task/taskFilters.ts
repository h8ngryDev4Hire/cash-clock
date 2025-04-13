import { Task } from '@def/core';
import { TimeEntrySchema } from '@def/entities';
import { log } from '@lib/util/debugging/logging';

/**
 * Check if a timestamp is from today
 */
export const isToday = (timestamp: number): boolean => {
  const date = new Date(timestamp * 1000);
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
};

/**
 * Calculate time spent on a task today
 */
export const calculateTimeSpentToday = (taskId: string, allTimeEntries: TimeEntrySchema[]): number => {
  const taskEntries = allTimeEntries.filter(entry => entry.taskId === taskId);
  
  return taskEntries.reduce((total, entry) => {
    // Skip entries that weren't active today
    const startedToday = isToday(entry.timeStarted);
    const endedToday = entry.timeEnded ? isToday(entry.timeEnded) : false;
    
    // If entry was not active today at all, skip it
    if (!startedToday && !endedToday && !entry.isRunning) {
      return total;
    }
    
    let timeToAdd = 0;
    
    // For running entries, calculate current elapsed time
    if (entry.isRunning) {
      const now = Math.floor(Date.now() / 1000);
      
      // If started today, count from start time
      if (startedToday) {
        timeToAdd = now - entry.timeStarted;
      } else {
        // If started before today, count from start of today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        timeToAdd = now - Math.floor(startOfToday.getTime() / 1000);
      }
    } 
    // For completed entries
    else if (entry.timeEnded) {
      // Both started and ended today
      if (startedToday && endedToday) {
        timeToAdd = entry.timeEnded - entry.timeStarted;
      }
      // Started before today, ended today
      else if (!startedToday && endedToday) {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        timeToAdd = entry.timeEnded - Math.floor(startOfToday.getTime() / 1000);
      }
      // Started today, ended later (shouldn't happen but just in case)
      else if (startedToday && !endedToday) {
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        timeToAdd = Math.floor(endOfToday.getTime() / 1000) - entry.timeStarted;
      }
    }
    
    return total + timeToAdd;
  }, 0);
};

/**
 * Get the last activity timestamp for a task
 */
export const getLastActivityTime = (taskId: string, allTimeEntries: TimeEntrySchema[]): number => {
  const taskEntries = allTimeEntries.filter(entry => entry.taskId === taskId);
  
  if (taskEntries.length === 0) {
    return 0;
  }
  
  // Find the most recent activity
  return Math.max(
    ...taskEntries.map(entry => {
      // For running entries or entries with no end time, use current time
      if (entry.isRunning || !entry.timeEnded) {
        return Date.now() / 1000;
      }
      // Otherwise use the end time
      return entry.timeEnded;
    })
  );
};

/**
 * Filter and sort tasks for today's view
 */
export const getTodaysTasks = (
  tasks: Task[],
  timeEntries: TimeEntrySchema[],
  showCompleted: boolean = false
): Task[] => {
  // Process tasks to only include those active today and add today's time spent
  const todaysTasks = tasks.map(task => {
    const timeSpentToday = calculateTimeSpentToday(task.id, timeEntries);
    const lastActivityTime = getLastActivityTime(task.id, timeEntries);
    
    return {
      ...task,
      totalTime: timeSpentToday, // Override totalTime with today's time
      lastActivityTime // Add property for sorting
    };
  });
  
  // Filter to only include tasks that have been worked on today or created today
  const filteredTasks = todaysTasks.filter(task => 
    (task.totalTime > 0 || isToday(task.createdAt / 1000)) && 
    (showCompleted || !task.isCompleted)
  );
  
  // Sort by last activity time, most recent first
  return filteredTasks.sort((a, b) => 
    (b.lastActivityTime || 0) - (a.lastActivityTime || 0)
  );
};

/**
 * Filter tasks by project
 */
export const getTasksByProject = (
  tasks: Task[],
  projectId: string | null,
  showCompleted: boolean = false
): Task[] => {
  return tasks.filter(task => {
    // Filter by project
    const projectMatch = 
      (projectId === null && !task.projectId) || // No project filter, no project assigned
      (projectId && task.projectId === projectId); // Project filter matches task project
    
    // Filter by completion status
    const completionMatch = showCompleted || !task.isCompleted;
    
    return projectMatch && completionMatch;
  });
};

/**
 * Sort tasks by different criteria
 */
export interface TaskSortOptions {
  sortBy: 'name' | 'time' | 'created' | 'updated' | 'project';
  order: 'asc' | 'desc';
}

/**
 * Sort tasks by the specified criteria
 */
export const sortTasks = (
  tasks: Task[],
  options: TaskSortOptions = { sortBy: 'updated', order: 'desc' }
): Task[] => {
  const { sortBy, order } = options;
  const multiplier = order === 'asc' ? 1 : -1;
  
  return [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return multiplier * a.name.localeCompare(b.name);
        
      case 'time':
        return multiplier * ((a.totalTime || 0) - (b.totalTime || 0));
        
      case 'created':
        return multiplier * (a.createdAt - b.createdAt);
        
      case 'project':
        // Sort by project ID (null projects come last)
        if (!a.projectId && b.projectId) return multiplier;
        if (a.projectId && !b.projectId) return -multiplier;
        if (a.projectId && b.projectId) {
          return multiplier * a.projectId.localeCompare(b.projectId);
        }
        return 0;
        
      case 'updated':
      default:
        return multiplier * (a.updatedAt - b.updatedAt);
    }
  });
};

/**
 * Filter and sort tasks for the past tasks view (tasks that haven't been worked on today)
 */
export const getPastTasks = (
  tasks: Task[],
  timeEntries: TimeEntrySchema[],
  showCompleted: boolean = false
): Task[] => {
  // Get today's tasks to exclude them
  const todaysTaskIds = new Set(
    getTodaysTasks(tasks, timeEntries, showCompleted).map(task => task.id)
  );
  
  // Filter to only include tasks that:
  // 1. Have not been worked on today (not in todaysTaskIds)
  // 2. Have some time logged (totalTime > 0)
  // 3. Match completion filter
  const pastTasks = tasks.filter(task => 
    !todaysTaskIds.has(task.id) && 
    task.totalTime > 0 && 
    (showCompleted || !task.isCompleted)
  );
  
  // Sort by last activity time or updated time
  return pastTasks.sort((a, b) => {
    const aLastActivity = getLastActivityTime(a.id, timeEntries);
    const bLastActivity = getLastActivityTime(b.id, timeEntries);
    
    // If both have activity time, sort by that
    if (aLastActivity && bLastActivity) {
      return bLastActivity - aLastActivity;
    }
    
    // Fall back to updated time
    return b.updatedAt - a.updatedAt;
  });
};

/**
 * Check if a task has any time entries on today's date
 */
export const hasTimeEntryToday = (taskId: string, allTimeEntries: TimeEntrySchema[]): boolean => {
  log(`Checking if task ${taskId} has time entries today`, 'taskFilters', 'hasTimeEntryToday', 'DEBUG');
  
  const taskEntries = allTimeEntries.filter(entry => entry.taskId === taskId);
  
  if (taskEntries.length === 0) {
    log(`Task ${taskId} has no time entries at all`, 'taskFilters', 'hasTimeEntryToday', 'DEBUG');
    return false;
  }
  
  // Check if any entry was active today
  const hasEntryToday = taskEntries.some(entry => {
    const startedToday = isToday(entry.timeStarted);
    const endedToday = entry.timeEnded ? isToday(entry.timeEnded) : false;
    const isRunningToday = entry.isRunning && (startedToday || isToday(Date.now() / 1000));
    
    const hasActivityToday = startedToday || endedToday || isRunningToday;
    
    if (hasActivityToday) {
      log(`Task ${taskId} has activity today: started today: ${startedToday}, ended today: ${endedToday}, running today: ${isRunningToday}`, 
          'taskFilters', 'hasTimeEntryToday', 'DEBUG');
    }
    
    return hasActivityToday;
  });
  
  return hasEntryToday;
};

/**
 * Get all tasks that have time entries from today
 * This includes tasks that:
 * 1. Have time entries that started today
 * 2. Have time entries that ended today
 * 3. Have running time entries
 */
export const getTasksWithTodayTimeEntries = (
  tasks: Task[],
  timeEntries: TimeEntrySchema[],
  showCompleted: boolean = false
): Task[] => {
  log(`Finding all tasks with today's time entries. Total tasks: ${tasks.length}, Total time entries: ${timeEntries.length}`, 
      'taskFilters', 'getTasksWithTodayTimeEntries', 'INFO');
      
  // Process tasks to evaluate today's activity
  const tasksWithTodayEntries = tasks
    .filter(task => {
      // Check if the task has time entries today
      const hasTodayTimeEntry = hasTimeEntryToday(task.id, timeEntries);
      
      // Apply completion filter
      const matchesCompletionFilter = showCompleted || !task.isCompleted;
      
      // Include if it has today's time entry and matches completion filter
      const shouldInclude = hasTodayTimeEntry && matchesCompletionFilter;
      
      log(`Task ${task.id} (${task.name}): has today's entry: ${hasTodayTimeEntry}, include: ${shouldInclude}`, 
          'taskFilters', 'getTasksWithTodayTimeEntries', 'DEBUG');
      
      return shouldInclude;
    })
    .map(task => {
      // Calculate time spent today
      const timeSpentToday = calculateTimeSpentToday(task.id, timeEntries);
      const lastActivityTime = getLastActivityTime(task.id, timeEntries);
      
      log(`Task ${task.id} (${task.name}): time spent today: ${timeSpentToday} seconds`, 
          'taskFilters', 'getTasksWithTodayTimeEntries', 'DEBUG');
      
      return {
        ...task,
        totalTime: timeSpentToday, // Override with today's time
        lastActivityTime // Add for sorting
      };
    });
  
  // Sort by last activity time, most recent first
  const sortedTasks = tasksWithTodayEntries.sort((a, b) => 
    (b.lastActivityTime || 0) - (a.lastActivityTime || 0)
  );
  
  log(`Found ${sortedTasks.length} tasks with today's time entries`, 
      'taskFilters', 'getTasksWithTodayTimeEntries', 'INFO');
  
  return sortedTasks;
}; 