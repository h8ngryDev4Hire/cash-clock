import { useState, useCallback, useEffect } from 'react';
import { ErrorService } from '@lib/services/error/ErrorService';
import { ErrorLevel, ErrorContext, AppError } from '@def/error';

/**
 * IMPORTANT: Error Handling Approach
 * 
 * This project emphasizes using explicit try-catch blocks for error handling rather than
 * wrapper functions. Direct try-catch blocks improve code readability and make error flows
 * more obvious to developers reading the code. When handling errors:
 * 
 * 1. Use try-catch blocks directly in your async functions
 * 2. Call handleError within the catch block to format and log errors
 * 3. Consider whether errors should be component-local or global
 * 
 * Example:
 * ```
 * const { handleError, setIsLoading, clearError } = useError('MyComponent');
 * 
 * const myAsyncFunction = async () => {
 *   try {
 *     setIsLoading(true);
 *     clearError();
 *     const result = await someAsyncOperation();
 *     setIsLoading(false);
 *     return result;
 *   } catch (err) {
 *     handleError(err, ErrorLevel.ERROR, { operation: 'myAsyncFunction' });
 *     return null;
 *   }
 * };
 * ```
 */

// Global error state singleton for app-wide error handling
export class GlobalErrorState {
  private static instance: GlobalErrorState;
  private errorHandlers: Set<(error: AppError | null) => void> = new Set();
  private currentError: AppError | null = null;
  
  private constructor() {}
  
  public static getInstance(): GlobalErrorState {
    if (!GlobalErrorState.instance) {
      GlobalErrorState.instance = new GlobalErrorState();
    }
    return GlobalErrorState.instance;
  }
  
  // Set a global error
  public setGlobalError(error: AppError | null): void {
    this.currentError = error;
    this.notifyHandlers();
  }
  
  // Get current global error
  public getGlobalError(): AppError | null {
    return this.currentError;
  }
  
  // Register an error handler
  public registerHandler(handler: (error: AppError | null) => void): void {
    this.errorHandlers.add(handler);
    // Initialize handler with current error
    if (this.currentError) {
      handler(this.currentError);
    }
  }
  
  // Unregister an error handler
  public unregisterHandler(handler: (error: AppError | null) => void): void {
    this.errorHandlers.delete(handler);
  }
  
  // Notify all handlers
  private notifyHandlers(): void {
    this.errorHandlers.forEach(handler => {
      handler(this.currentError);
    });
  }
}

/**
 * Custom hook that provides components with error handling capabilities
 * Integrates with ErrorService for consistent error management across the app
 */
export const useError = (componentName?: string, handleGlobalErrors = false) => {
  // Local error state for this component
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Get singleton instances
  const errorService = ErrorService.getInstance();
  const globalErrorState = GlobalErrorState.getInstance();
  
  // Register for global errors if requested
  useEffect(() => {
    if (handleGlobalErrors) {
      const handler = (globalError: AppError | null) => {
        setError(globalError);
      };
      
      globalErrorState.registerHandler(handler);
      
      return () => {
        globalErrorState.unregisterHandler(handler);
      };
    }
  }, [handleGlobalErrors]);
  
  /**
   * Handle an error with proper logging and state updates
   */
  const handleError = useCallback((
    err: Error | unknown,
    level: ErrorLevel = ErrorLevel.ERROR,
    contextData: Partial<Omit<ErrorContext, 'component' | 'timestamp'>> = {},
    isGlobal = false
  ) => {
    // If not an Error instance, convert to Error
    const error = err instanceof Error ? err : new Error(String(err));
    
    // Create context with component name
    const context: Partial<ErrorContext> = {
      component: componentName,
      ...contextData
    };
    
    // Log error using ErrorService
    const appError = errorService.logError(error, level, context);
    
    // Update local or global state
    if (isGlobal) {
      globalErrorState.setGlobalError(appError);
    } else {
      setError(appError);
    }
    
    setIsLoading(false);
    
    return appError;
  }, [componentName, errorService]);
  
  /**
   * Clear current error
   */
  const clearError = useCallback((isGlobal = false) => {
    if (isGlobal) {
      globalErrorState.setGlobalError(null);
    } else {
      setError(null);
    }
  }, []);
  
  /**
   * Format error message for display in UI
   */
  const formatErrorMessage = useCallback((customMessage?: string) => {
    if (!error) return '';
    
    if (customMessage) {
      return customMessage;
    }
    
    return error.userMessage;
  }, [error]);
  
  /**
   * Check if current error is of a specific type
   */
  const isErrorType = useCallback((type: string) => {
    if (!error?.originalError) return false;
    
    return errorService.isErrorType(error.originalError, type);
  }, [error, errorService]);
  
  /**
   * Get recent error history for this component
   */
  const getErrorHistory = useCallback(() => {
    return errorService.getSessionErrors({
      component: componentName
    });
  }, [componentName, errorService]);
  
  /**
   * Promote an error to global level
   */
  const promoteToGlobal = useCallback((appError: AppError | null = error) => {
    if (appError) {
      globalErrorState.setGlobalError(appError);
    }
  }, [error]);
  
  /**
   * Get the current global error
   */
  const getGlobalError = useCallback(() => {
    return globalErrorState.getGlobalError();
  }, []);
  
  return {
    // Error state
    error,
    isLoading,
    hasError: !!error,
    errorMessage: error?.userMessage || '',
    errorLevel: error?.level,
    
    // Error utilities
    handleError,
    clearError,
    formatErrorMessage,
    isErrorType,
    setIsLoading,
    
    // Error history
    getErrorHistory,
    
    // Global error handling
    promoteToGlobal,
    getGlobalError
  };
}; 