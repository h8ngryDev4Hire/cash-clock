/**
 * Error handling types for CashClock application
 */

/**
 * Error severity classification
 */
export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal'
}

/**
 * Structure for error context data
 */
export interface ErrorContext {
  component?: string;   // UI component where error occurred
  operation?: string;   // Operation that failed (e.g., "createTask")
  entityId?: string;    // ID of entity involved (e.g., task ID)
  entityType?: string;  // Type of entity involved (e.g., "task", "timeEntry")
  input?: unknown;      // Input data that caused error
  timestamp: number;    // When the error occurred
}

/**
 * Structure for a standardized error in the application
 */
export interface AppError {
  id: string;           // Unique error ID
  originalError: Error; // Original error object
  message: string;      // Technical error message
  userMessage: string;  // User-friendly message
  level: ErrorLevel;    // Error severity
  context: ErrorContext; // Error context data
  stack?: string;       // Error stack trace
}

/**
 * Options for filtering errors
 */
export interface ErrorFilterOptions {
  level?: ErrorLevel | ErrorLevel[];
  component?: string;
  operation?: string;
  entityType?: string;
  fromDate?: number;
  toDate?: number;
  limit?: number;
} 