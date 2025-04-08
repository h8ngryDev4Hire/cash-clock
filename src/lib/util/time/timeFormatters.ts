/**
 * Time formatting utilities for consistent display across the application
 */

/**
 * Formats elapsed time in seconds to MM:SS format
 * @param seconds Time in seconds
 * @returns Formatted time string (MM:SS)
 */
export function formatElapsedTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

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
 * Format relative time (e.g., "2 hours ago", "5 minutes ago")
 * @param timestamp Unix timestamp in milliseconds
 * @returns Formatted relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ago`;
  }
  if (hours > 0) {
    return `${hours}h ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return 'just now';
}

/**
 * Format task duration for display
 * @param totalTime Total time in seconds
 * @returns Formatted duration string
 */
export function formatTaskDuration(totalTime: number): string {
  if (totalTime < 60) {
    return `${totalTime}s`;
  }
  
  const hours = Math.floor(totalTime / 3600);
  const minutes = Math.floor((totalTime % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  }
  
  return `${minutes}m`;
} 