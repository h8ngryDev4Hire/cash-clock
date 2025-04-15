import { useContext, useCallback, useState, useEffect } from 'react';
import { StorageContext } from '../context/StorageContext';
import { TimeEntrySchema, TaskSchema, ProjectSchema } from '../types/entities';
import { startOfDay, endOfDay, isWithinInterval, format } from 'date-fns';
import { log } from '../lib/util/debugging/logging';

/**
 * Hook for managing time entries in calendar views
 */
export const useCalendarEntries = () => {
  const storage = useContext(StorageContext);
  
  if (!storage) {
    throw new Error('useCalendarEntries must be used within a StorageProvider');
  }

  /**
   * Get all time entries for a specific date
   */
  const getEntriesForDate = useCallback(async (date: Date): Promise<TimeEntrySchema[]> => {
    try {
      // Ensure we have the latest data
      await storage.refreshData();
      
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      log(`Getting entries between ${format(dayStart, 'yyyy-MM-dd HH:mm')} and ${format(dayEnd, 'yyyy-MM-dd HH:mm')}`, 
          'useCalendarEntries', 'getEntriesForDate', 'INFO');
      
      // Filter entries that fall within the day
      const entries = storage.timeEntries.filter(entry => {
        // Convert timestamps to dates
        const startTime = new Date(entry.timeStarted * 1000);
        const endTime = entry.timeEnded ? new Date(entry.timeEnded * 1000) : new Date();
        
        // Entry overlaps with the selected day if:
        // - It starts during the day
        // - It ends during the day
        // - It spans across the entire day
        return (
          isWithinInterval(startTime, { start: dayStart, end: dayEnd }) ||
          isWithinInterval(endTime, { start: dayStart, end: dayEnd }) ||
          (startTime < dayStart && endTime > dayEnd)
        );
      });
      
      log(`Found ${entries.length} entries for ${format(date, 'yyyy-MM-dd')}`, 
          'useCalendarEntries', 'getEntriesForDate', 'INFO');
      
      return entries;
    } catch (error) {
      log(`Error getting entries for date: ${error}`, 
          'useCalendarEntries', 'getEntriesForDate', 'ERROR', { variableName: 'error', value: error });
      return [];
    }
  }, [storage]);

  /**
   * Format time entries for calendar display
   */
  const formatEntriesForCalendar = useCallback(async (date: Date): Promise<CalendarTimeEntry[]> => {
    const entries = await getEntriesForDate(date);
    
    // Ensure we have the latest tasks data
    await storage.refreshData();
    
    const tasks = storage.tasks;
    const projects = storage.projects;
    
    // Log task data for debugging
    log(`Processing ${entries.length} entries with ${tasks.length} available tasks`, 
        'useCalendarEntries', 'formatEntriesForCalendar', 'DEBUG');
    
    return Promise.all(entries.map(async (entry) => {
      // Make sure we have a taskId from either the normalized property or access the raw DB property
      // Use type assertion to handle potential raw DB fields that aren't in the TypeScript interface
      const taskId = entry.taskId || (entry as any).task_id;
      
      if (!taskId) {
        log(`Entry is missing taskId, entry details: ${JSON.stringify(entry)}`, 
            'useCalendarEntries', 'formatEntriesForCalendar', 'ERROR');
        return {
          id: entry.itemId,
          taskId: 'unknown',
          taskName: 'Unknown Task',
          startTime: new Date(entry.timeStarted * 1000).getTime(),
          endTime: entry.timeEnded 
            ? new Date(entry.timeEnded * 1000).getTime() 
            : new Date().getTime(),
          color: '#808080',
          totalMinutes: Math.round(
            (entry.timeEnded || Math.floor(Date.now() / 1000) - entry.timeStarted) / 60
          )
        };
      }
      
      // Find associated task - log the task ID we're looking for
      log(`Looking for task with ID: ${taskId}`, 
          'useCalendarEntries', 'formatEntriesForCalendar', 'DEBUG');
      
      // Find task by ID
      let task = tasks.find(t => t.itemId === taskId);
      
      // Log whether we found the task
      if (task) {
        log(`Found task in memory: ${task.name}`, 'useCalendarEntries', 'formatEntriesForCalendar', 'DEBUG');
      } else {
        log(`Task not found in memory for ID: ${taskId}`, 'useCalendarEntries', 'formatEntriesForCalendar', 'DEBUG');
        
        // Try to get the task directly from the database
        try {
          // Use the findEntity method from storage context
          const taskFromDb = await storage.findEntity<TaskSchema>(
            'tasks', 
            taskId,
            (dbData) => ({
              itemId: dbData.item_id,
              name: dbData.name,
              isCompleted: !!dbData.is_completed,
              isRunning: !!dbData.is_running,
              isGrouped: !!dbData.is_grouped,
              projectId: dbData.project_id,
              created: dbData.created,
              lastUpdated: dbData.last_updated,
            })
          );
          
          if (taskFromDb) {
            log(`Found task from DB: ${taskFromDb.name}`, 
                'useCalendarEntries', 'formatEntriesForCalendar', 'DEBUG');
            task = taskFromDb;
          } else {
            log(`Task not found in DB for ID: ${taskId}`, 
                'useCalendarEntries', 'formatEntriesForCalendar', 'WARNING');
          }
        } catch (err) {
          log(`Error getting task from DB: ${err}`, 
              'useCalendarEntries', 'formatEntriesForCalendar', 'ERROR');
        }
      }
      
      // Find associated project if task has projectId
      let project: ProjectSchema | undefined = undefined;
      if (task?.projectId) {
        project = projects.find(p => p.itemId === task!.projectId);
        
        if (!project) {
          try {
            // Try to find project directly if not in memory
            const projectFromDb = await storage.findEntity<ProjectSchema>(
              'projects', 
              task.projectId,
              (dbData) => ({
                itemId: dbData.item_id,
                name: dbData.name,
                description: dbData.description,
                color: dbData.color,
                goals: dbData.goals,
                milestones: dbData.milestones,
                created: dbData.created,
                lastUpdated: dbData.last_updated,
              })
            );
            
            if (projectFromDb) {
              project = projectFromDb;
            }
          } catch (err) {
            log(`Error getting project from DB: ${err}`, 
                'useCalendarEntries', 'formatEntriesForCalendar', 'ERROR');
          }
        }
      }
      
      // Format the entry with the found task and project
      return {
        id: entry.itemId,
        taskId: taskId,
        taskName: task?.name || 'Unknown Task',
        projectId: task?.projectId,
        projectName: project?.name,
        startTime: new Date(entry.timeStarted * 1000).getTime(),
        endTime: entry.timeEnded 
          ? new Date(entry.timeEnded * 1000).getTime() 
          : new Date().getTime(),
        color: project?.color || '#808080',
        totalMinutes: Math.round(
          (entry.timeEnded || Math.floor(Date.now() / 1000) - entry.timeStarted) / 60
        )
      };
    }));
  }, [getEntriesForDate, storage]);

  return {
    getEntriesForDate,
    formatEntriesForCalendar
  };
};

/**
 * Interface for formatted calendar time entries
 */
export interface CalendarTimeEntry {
  id: string;
  taskId: string;
  taskName: string;
  projectId?: string | null;
  projectName?: string;
  startTime: number; // timestamp in ms
  endTime: number; // timestamp in ms
  color: string;
  totalMinutes: number;
} 