import { 
  ErrorLevel, 
  ErrorContext, 
  AppError, 
  ErrorFilterOptions
} from '@def/error';

/**
 * IMPORTANT: Error Handling Approach
 * 
 * This project uses explicit try-catch blocks for error handling rather than wrapper functions.
 * When implementing error handling in services:
 * 
 * 1. Wrap operations in try-catch blocks
 * 2. Use errorService.logError to create standardized error objects with appropriate context
 * 3. Consider whether to rethrow or handle the error at the service level
 * 
 * Example:
 * ```
 * try {
 *   // Perform operation
 *   return result;
 * } catch (error) {
 *   const appError = errorService.logError(
 *     error instanceof Error ? error : new Error(String(error)),
 *     ErrorLevel.ERROR,
 *     {
 *       component: 'ServiceName',
 *       operation: 'methodName',
 *       entityType: 'entityName',
 *       input: someInputData
 *     }
 *   );
 *   throw appError; // Rethrow to let calling code handle it
 * }
 * ```
 */

/**
 * Common error types that can be checked with isErrorType
 */
export const ErrorTypes = {
  NetworkError: [
    'NetworkError',
    'AbortError',
    'FetchError'
  ],
  DatabaseError: [
    'SQLiteError',
    'DatabaseError',
    'ConstraintError'
  ],
  ValidationError: [
    'ValidationError',
    'TypeError',
    'SyntaxError'
  ],
  AuthError: [
    'AuthError',
    'TokenError',
    'PermissionError'
  ]
};

/**
 * Default user-friendly error messages by category
 */
const DEFAULT_USER_MESSAGES: Record<string, string> = {
  [ErrorLevel.INFO]: 'Something minor happened that you might want to know about.',
  [ErrorLevel.WARNING]: 'Something unexpected happened, but it\'s not critical.',
  [ErrorLevel.ERROR]: 'Sorry, we encountered a problem. Please try again.',
  [ErrorLevel.FATAL]: 'A critical error has occurred. Please restart the app.',
  
  // Error type specific messages
  'NetworkError': 'Please check your internet connection and try again.',
  'DatabaseError': 'There was a problem saving your data. Please try again.',
  'ValidationError': 'Some of the information entered is not valid.',
  'AuthError': 'There was a problem with your account. Please sign in again.',
  
  // Specific validation error messages
  'TaskNameEmpty': 'Task name cannot be empty.',
  'TaskNameTooShort': 'Task name must be at least 3 characters long.',
  'TaskNameTooLong': 'Task name cannot exceed 50 characters.',
  
  // Fallback
  'default': 'An unexpected error occurred. Please try again later.'
};

/**
 * ErrorService provides centralized error handling functionality
 * for consistent error management across the application.
 */
export class ErrorService {
  private static instance: ErrorService;
  private sessionErrors: AppError[] = [];
  
  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    // Initialize any required properties
  }
  
  /**
   * Get the singleton instance of ErrorService
   */
  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }
  
  /**
   * Log an error with context and severity
   */
  public logError(
    error: Error,
    level: ErrorLevel = ErrorLevel.ERROR,
    context: Partial<ErrorContext> = {}
  ): AppError {
    // Create a standardized error object
    const errorId = this.generateErrorId();
    const timestamp = Date.now();
    
    const appError: AppError = {
      id: errorId,
      originalError: error,
      message: error.message,
      userMessage: this.getUserMessage(error, level),
      level,
      context: {
        ...context,
        timestamp
      },
      stack: error.stack
    };
    
    // Save to session errors
    this.sessionErrors.push(appError);
    
    // Log to console based on level
    this.consoleLog(appError);
    
    return appError;
  }
  
  /**
   * Get a user-friendly message for an error
   */
  public getUserMessage(error: Error, level: ErrorLevel = ErrorLevel.ERROR): string {
    // Check for specific error message patterns first
    if (error.message.includes('Task name cannot be empty')) {
      return DEFAULT_USER_MESSAGES['TaskNameEmpty'];
    }
    
    if (error.message.includes('Task name must be at least')) {
      return DEFAULT_USER_MESSAGES['TaskNameTooShort'];
    }
    
    if (error.message.includes('Task name cannot exceed')) {
      return DEFAULT_USER_MESSAGES['TaskNameTooLong'];
    }
    
    // Then check if it's a known error type
    for (const [type, patterns] of Object.entries(ErrorTypes)) {
      if (this.isErrorType(error, type)) {
        return DEFAULT_USER_MESSAGES[type] || DEFAULT_USER_MESSAGES[level];
      }
    }
    
    // Fallback to level-based message
    return DEFAULT_USER_MESSAGES[level] || DEFAULT_USER_MESSAGES.default;
  }
  
  /**
   * Get all session errors with optional filtering
   */
  public getSessionErrors(filter?: ErrorFilterOptions): AppError[] {
    if (!filter) {
      return [...this.sessionErrors];
    }
    
    return this.sessionErrors.filter(error => {
      // Filter by level
      if (filter.level) {
        const levels = Array.isArray(filter.level) ? filter.level : [filter.level];
        if (!levels.includes(error.level)) return false;
      }
      
      // Filter by component
      if (filter.component && error.context.component !== filter.component) {
        return false;
      }
      
      // Filter by operation
      if (filter.operation && error.context.operation !== filter.operation) {
        return false;
      }
      
      // Filter by entity type
      if (filter.entityType && error.context.entityType !== filter.entityType) {
        return false;
      }
      
      // Filter by date range
      if (filter.fromDate && error.context.timestamp < filter.fromDate) {
        return false;
      }
      
      if (filter.toDate && error.context.timestamp > filter.toDate) {
        return false;
      }
      
      return true;
    }).slice(0, filter.limit || this.sessionErrors.length);
  }
  
  /**
   * Clear all session errors
   */
  public clearSessionErrors(): void {
    this.sessionErrors = [];
  }
  
  /**
   * Check if an error matches a specific error type
   */
  public isErrorType(error: Error, type: string): boolean {
    if (!error) return false;
    
    // If it's a known category, check against its patterns
    if (type in ErrorTypes) {
      const patterns = ErrorTypes[type as keyof typeof ErrorTypes];
      
      return patterns.some(pattern => 
        error.name === pattern || 
        error.constructor.name === pattern ||
        error.message.includes(pattern)
      );
    }
    
    // Otherwise check if it's a direct match
    return (
      error.name === type || 
      error.constructor.name === type ||
      error.message.includes(type)
    );
  }
  
  /**
   * Generate a unique ID for an error
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Log the error to the console based on its level
   */
  private consoleLog(error: AppError): void {
    const { level, message, context, id } = error;
    const logMessage = `[${level.toUpperCase()}] ${id}: ${message}`;
    
    switch (level) {
      case ErrorLevel.INFO:
        console.info(logMessage, { context, error: error.originalError });
        break;
      case ErrorLevel.WARNING:
        console.warn(logMessage, { context, error: error.originalError });
        break;
      case ErrorLevel.ERROR:
        console.error(logMessage, { context, error: error.originalError });
        break;
      case ErrorLevel.FATAL:
        console.error(`FATAL: ${logMessage}`, { context, error: error.originalError });
        break;
    }
  }
}

// Export a singleton instance
export const errorService = ErrorService.getInstance(); 