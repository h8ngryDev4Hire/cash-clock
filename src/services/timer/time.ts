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
 * Convert seconds to milliseconds
 */
export function secondsToMilliseconds(seconds: number): number {
  return seconds * 1000;
}

/**
 * Convert milliseconds to seconds
 */
export function millisecondsToSeconds(milliseconds: number): number {
  return Math.floor(milliseconds / 1000);
}

/**
 * Format seconds as a duration string
 * @param seconds Time in seconds
 * @returns Formatted duration string (e.g., "2h 15m" or "45m")
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  }
  
  return `${minutes}m`;
}

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