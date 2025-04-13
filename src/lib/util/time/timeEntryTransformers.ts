/**
 * Utility functions for transforming time entry data
 */
import { TimeEntry } from '@def/core';
import { TimeEntrySchema } from '@def/entities';

/**
 * Convert a TimeEntrySchema to UI TimeEntry model
 */
export const toUITimeEntry = (entry: TimeEntrySchema): TimeEntry => ({
  id: entry.itemId,
  taskId: entry.taskId,
  startTime: entry.timeStarted * 1000, // Convert to milliseconds
  endTime: entry.timeEnded ? entry.timeEnded * 1000 : null, // Convert to milliseconds
  duration: entry.timeSpent * 1000, // Convert to milliseconds
});

/**
 * Convert a UI TimeEntry model to TimeEntrySchema
 */
export const toTimeEntrySchema = (entry: TimeEntry): TimeEntrySchema => ({
  itemId: entry.id,
  taskId: entry.taskId,
  isRunning: entry.endTime === null, // If no end time, it's still running
  timeStarted: Math.floor(entry.startTime / 1000), // Convert to seconds
  timeEnded: entry.endTime ? Math.floor(entry.endTime / 1000) : 0, // Convert to seconds
  timeSpent: Math.floor(entry.duration / 1000), // Convert to seconds
  created: 0, // Will be set by storage service
  lastUpdated: 0, // Will be set by storage service
});

/**
 * Calculate total duration of multiple time entries
 */
export const calculateTotalDuration = (entries: TimeEntrySchema[]): number => {
  if (!entries || entries.length === 0) return 0;
  
  return entries.reduce((total, entry) => {
    if (entry.isRunning) {
      // For running entries, calculate current elapsed time
      const now = Math.floor(Date.now() / 1000);
      return total + (now - entry.timeStarted);
    } else {
      // For completed entries, use stored time spent
      return total + (entry.timeSpent || 0);
    }
  }, 0);
};

/**
 * Sort time entries by start time (newest first)
 */
export const sortTimeEntriesByStartTime = (entries: TimeEntrySchema[]): TimeEntrySchema[] => {
  if (!entries || entries.length === 0) return [];
  
  return [...entries].sort((a, b) => {
    const startTimeA = a.timeStarted || 0;
    const startTimeB = b.timeStarted || 0;
    return startTimeB - startTimeA;
  });
}; 