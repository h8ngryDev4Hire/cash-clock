/**
 * Logging utility for the application
 * This provides a consistent way to log messages across the codebase.
 * 
 * In production, NO logs will ever be emitted.
 */

// String literal union type for log levels
export type LogLevel = 'VERBOSE' | 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

// Numeric values for log level comparisons
const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  'VERBOSE': 0,
  'DEBUG': 1,
  'INFO': 2,
  'WARNING': 3,
  'ERROR': 4,
  'CRITICAL': 5
};

// Determine which log levels are enabled
// In production, nothing will be logged
const ENABLED_LOG_LEVELS: Record<LogLevel, boolean> = {
  'VERBOSE': __DEV__,
  'DEBUG': __DEV__,
  'INFO': __DEV__,
  'WARNING': __DEV__,
  'ERROR': __DEV__,
  'CRITICAL': __DEV__
};

// Interface for structured metadata
export interface LogMetadata {
  variableName: string;
  value: any;
}

/**
 * Log a message to the console with the specified level
 * 
 * @param message The message to log
 * @param caller The name of the function/method that called the logging function
 * @param level The level of the log message
 * @param metadata Optional structured metadata about variables
 */
export function log(
  message: string,
  caller: string,
  level: LogLevel,
  metadata?: LogMetadata
): void {
  // In production, nothing will be logged
  if (!__DEV__) return;
  
  // Check if this log level is enabled
  if (!ENABLED_LOG_LEVELS[level]) return;
  
  // Format timestamp
  const timestamp = new Date().toISOString();
  
  // Build the log message
  const logPrefix = `[${level}] [${caller}]:`;
  
  // Use appropriate console method based on level
  const numericLevel = LOG_LEVEL_VALUES[level];
  
  if (numericLevel >= LOG_LEVEL_VALUES['ERROR']) {
    console.error(`${logPrefix} ${message}`);
  } else if (numericLevel >= LOG_LEVEL_VALUES['WARNING']) {
    console.warn(`${logPrefix} ${message}`);
  } else {
    console.log(`${logPrefix} ${message}`);
  }
  
  // Log metadata if provided
  if (metadata) {
    console.log(`[ ${caller}: ${metadata.variableName} ]`, metadata.value);
  }
}

