/**
 * Time calculation utilities for consistent time operations across the application
 */

import { TimeEntry } from '../../../types/core';

/**
 * Calculate elapsed time between a start timestamp and now
 * (or between start and end if end is provided)
 * 
 * @param startTime Start timestamp in milliseconds
 * @param endTime Optional end timestamp in milliseconds
 * @returns Elapsed time in milliseconds
 */
export function calculateElapsedTime(startTime: number, endTime?: number): number {
  if (!startTime) return 0;
  
  const end = endTime || Date.now();
  return end - startTime;
}

/**
 * Convert seconds to milliseconds
 * @param seconds Time in seconds
 * @returns Time in milliseconds
 */
export function secondsToMilliseconds(seconds: number): number {
  return seconds * 1000;
}

/**
 * Convert milliseconds to seconds
 * @param milliseconds Time in milliseconds
 * @returns Time in seconds
 */
export function millisecondsToSeconds(milliseconds: number): number {
  return Math.floor(milliseconds / 1000);
}

/**
 * Get the start of today in milliseconds
 */
export const getStartOfToday = (): number => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return startOfToday.getTime();
};

/**
 * Get the end of today in milliseconds
 */
export const getEndOfToday = (): number => {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  return endOfToday.getTime();
};

/**
 * Calculate time spent between two timestamps, clamped to today's boundaries
 */
export const calculateTimeSpentToday = (
  startTime: number,
  endTime: number | undefined,
  isRunning: boolean = false
): number => {
  const now = Date.now();
  const startOfToday = getStartOfToday();
  const endOfToday = getEndOfToday();
  
  // If not running and no end time, return 0
  if (!isRunning && !endTime) return 0;
  
  // If started before today, use start of today
  const effectiveStart = Math.max(startTime, startOfToday);
  
  // If running, use current time
  // If ended after today, use end of today
  // Otherwise use the end time
  const effectiveEnd = isRunning 
    ? now 
    : (endTime && endTime > endOfToday ? endOfToday : (endTime || now));
  
  return Math.max(0, effectiveEnd - effectiveStart);
};

/**
 * Calculate total time from time entries
 * @param timeEntries Array of time entries
 * @returns Total time in seconds
 */
export function calculateTotalTime(timeEntries: TimeEntry[]): number {
  return timeEntries.reduce((total, entry) => {
    const duration = entry.endTime ? entry.endTime - entry.startTime : 0;
    return total + duration;
  }, 0);
} 