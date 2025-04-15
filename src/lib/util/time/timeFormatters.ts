/**
 * Time formatting utilities for consistent display across the application
 */

// Add date-fns imports at the top of the file
import { format, isToday as dateFnsIsToday, isYesterday, formatDistanceToNow } from 'date-fns';

/**
 * Format seconds as HH:MM:SS
 * @param seconds Number of seconds
 * @returns Formatted time string (e.g., "01:23:45")
 */
export const formatElapsedTime = (seconds: number): string => {
  if (seconds < 0) seconds = 0;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
};

/**
 * Formats milliseconds into a human-readable time string
 * @param milliseconds Time in milliseconds
 * @param showMilliseconds Whether to include milliseconds in the output
 * @returns Formatted time string (HH:MM:SS)
 */
export function formatTime(milliseconds: number, showMilliseconds: boolean = false): string {
  if (milliseconds < 0) milliseconds = 0;
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ms = milliseconds % 1000;
  
  // Format as HH:MM:SS
  const formattedHours = hours > 0 ? `${hours.toString().padStart(2, '0')}:` : '';
  const formattedMinutes = `${minutes.toString().padStart(2, '0')}:`;
  const formattedSeconds = seconds.toString().padStart(2, '0');
  
  let formattedTime = `${formattedHours}${formattedMinutes}${formattedSeconds}`;
  
  // Optionally add milliseconds
  if (showMilliseconds) {
    formattedTime += `.${ms.toString().padStart(3, '0')}`;
  }
  
  return formattedTime;
}

/**
 * Format seconds as a human-readable duration (Xh Ym)
 * @param seconds Number of seconds
 * @returns Formatted duration string (e.g., "1h 23m")
 */
export const formatDuration = (seconds: number): string => {
  if (seconds < 0) seconds = 0;
  if (seconds === 0) return '0m';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  }
  
  return `${minutes}m`;
};

/**
 * Format task duration for display (alias of formatDuration for backward compatibility)
 * @param totalTime Total time in seconds
 * @returns Formatted duration string
 */
export const formatTaskDuration = formatDuration;

/**
 * Format a timestamp into a relative time string (e.g., "2 hours ago")
 * @param timestamp Timestamp in milliseconds
 * @returns Relative time string
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSeconds = Math.floor(diffMs / 1000);
  
  if (diffSeconds < 60) {
    return 'Just now';
  }
  
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  }
  
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {
    return `${diffWeeks} ${diffWeeks === 1 ? 'week' : 'weeks'} ago`;
  }
  
  // For older entries, just return the date
  const date = new Date(timestamp);
  return date.toLocaleDateString();
};

/**
 * Format a timestamp to a readable date-time string
 * @param timestamp Timestamp in seconds (Unix timestamp)
 * @returns Formatted date-time string (e.g., "Jan 15, 9:30 AM")
 */
export const formatTimeStamp = (timestamp: number | null): string => {
  if (!timestamp) return 'N/A';
  
  // Convert from Unix timestamp (seconds) to JavaScript Date (milliseconds)
  const date = new Date(timestamp * 1000);
  
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

/**
 * Check if a timestamp is from today
 * @param timestamp Timestamp in seconds
 * @returns Boolean indicating if the timestamp is from today
 */
export const isToday = (timestamp: number): boolean => {
  const date = new Date(timestamp * 1000);
  return dateFnsIsToday(date);
};

/**
 * Format a date as a human-readable day string
 * @param date Date object
 * @returns Day string (e.g., "Today", "Yesterday", or "Mon, Jan 15")
 */
export const formatDay = (date: Date): string => {
  if (dateFnsIsToday(date)) {
    return 'Today';
  }
  
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  
  return format(date, 'EEE, MMM d');
}; 