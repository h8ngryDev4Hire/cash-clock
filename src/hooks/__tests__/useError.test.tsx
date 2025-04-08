import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useError, GlobalErrorState } from '../useError';
import { ErrorService } from '@lib/services/error/ErrorService';
import { ErrorLevel, AppError } from '@def/error';

// Mock ErrorService
jest.mock('@lib/services/error/ErrorService', () => {
  const mockErrorService = {
    logError: jest.fn(),
    getUserMessage: jest.fn(),
    getSessionErrors: jest.fn(),
    isErrorType: jest.fn()
  };
  
  return {
    ErrorService: {
      getInstance: jest.fn(() => mockErrorService)
    }
  };
});

describe('useError', () => {
  const mockErrorService = ErrorService.getInstance() as jest.Mocked<ErrorService>;
  
  const mockAppError: AppError = {
    id: 'error_123',
    originalError: new Error('Test error'),
    message: 'Test error',
    userMessage: 'A friendly error message',
    level: ErrorLevel.ERROR,
    context: {
      component: 'TestComponent',
      timestamp: Date.now()
    }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockErrorService.logError.mockReturnValue(mockAppError);
    
    // Reset global error state between tests
    const globalErrorState = GlobalErrorState.getInstance();
    act(() => {
      globalErrorState.setGlobalError(null);
    });
  });
  
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useError('TestComponent'));
    
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
    expect(result.current.errorMessage).toBe('');
  });
  
  describe('handleError', () => {
    it('should handle Error objects correctly', () => {
      const { result } = renderHook(() => useError('TestComponent'));
      const error = new Error('Test error');
      
      act(() => {
        result.current.handleError(error);
      });
      
      expect(mockErrorService.logError).toHaveBeenCalledWith(
        error,
        ErrorLevel.ERROR,
        { component: 'TestComponent' }
      );
      
      expect(result.current.error).toEqual(mockAppError);
      expect(result.current.hasError).toBe(true);
      expect(result.current.errorMessage).toBe('A friendly error message');
    });
    
    it('should convert non-Error objects to Error', () => {
      const { result } = renderHook(() => useError('TestComponent'));
      const errorString = 'String error';
      
      act(() => {
        result.current.handleError(errorString);
      });
      
      // Check the first argument (error) to see if it was converted to Error
      expect(mockErrorService.logError).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'String error' }),
        ErrorLevel.ERROR,
        { component: 'TestComponent' }
      );
    });
    
    it('should handle error level and context', () => {
      const { result } = renderHook(() => useError('TestComponent'));
      const error = new Error('Operation failed');
      const context = { operation: 'saveData', entityId: '123' };
      
      act(() => {
        result.current.handleError(error, ErrorLevel.WARNING, context);
      });
      
      expect(mockErrorService.logError).toHaveBeenCalledWith(
        error,
        ErrorLevel.WARNING,
        { component: 'TestComponent', ...context }
      );
    });
    
    it('should set global error when isGlobal is true', () => {
      const { result } = renderHook(() => useError('TestComponent'));
      const error = new Error('Global error');
      
      act(() => {
        result.current.handleError(error, ErrorLevel.ERROR, {}, true);
      });
      
      // Local component error should not be set
      expect(result.current.error).toBeNull();
      
      // But global error should be available via getGlobalError
      expect(result.current.getGlobalError()).toEqual(mockAppError);
    });
  });
  
  describe('clearError', () => {
    it('should clear local error', () => {
      const { result } = renderHook(() => useError('TestComponent'));
      
      // Set an error first
      act(() => {
        result.current.handleError(new Error('Test error'));
      });
      
      expect(result.current.error).toEqual(mockAppError);
      
      // Clear it
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });
    
    it('should clear global error when isGlobal is true', () => {
      const { result } = renderHook(() => useError('TestComponent'));
      const globalErrorState = GlobalErrorState.getInstance();
      
      // Set a global error
      act(() => {
        globalErrorState.setGlobalError(mockAppError);
      });
      
      expect(result.current.getGlobalError()).toEqual(mockAppError);
      
      // Clear it
      act(() => {
        result.current.clearError(true);
      });
      
      expect(result.current.getGlobalError()).toBeNull();
    });
  });
  
  describe('formatErrorMessage', () => {
    it('should return empty string when no error', () => {
      const { result } = renderHook(() => useError('TestComponent'));
      
      expect(result.current.formatErrorMessage()).toBe('');
    });
    
    it('should return user message from error', () => {
      const { result } = renderHook(() => useError('TestComponent'));
      
      // Set an error first
      act(() => {
        result.current.handleError(new Error('Test error'));
      });
      
      expect(result.current.formatErrorMessage()).toBe('A friendly error message');
    });
    
    it('should return custom message when provided', () => {
      const { result } = renderHook(() => useError('TestComponent'));
      
      // Set an error first
      act(() => {
        result.current.handleError(new Error('Test error'));
      });
      
      expect(result.current.formatErrorMessage('Custom message')).toBe('Custom message');
    });
  });
  
  describe('isErrorType', () => {
    it('should return false when no error', () => {
      const { result } = renderHook(() => useError('TestComponent'));
      
      expect(result.current.isErrorType('NetworkError')).toBe(false);
    });
    
    it('should call ErrorService.isErrorType with the error', () => {
      const { result } = renderHook(() => useError('TestComponent'));
      mockErrorService.isErrorType.mockReturnValue(true);
      
      // Set an error first
      act(() => {
        result.current.handleError(new Error('Test error'));
      });
      
      expect(result.current.isErrorType('ValidationError')).toBe(true);
      expect(mockErrorService.isErrorType).toHaveBeenCalledWith(
        mockAppError.originalError,
        'ValidationError'
      );
    });
  });
  
  describe('getErrorHistory', () => {
    it('should call ErrorService.getSessionErrors with component filter', () => {
      const { result } = renderHook(() => useError('TestComponent'));
      const mockErrors = [mockAppError];
      mockErrorService.getSessionErrors.mockReturnValue(mockErrors);
      
      const history = result.current.getErrorHistory();
      
      expect(history).toBe(mockErrors);
      expect(mockErrorService.getSessionErrors).toHaveBeenCalledWith({
        component: 'TestComponent'
      });
    });
  });
  
  describe('setIsLoading', () => {
    it('should update loading state', () => {
      const { result } = renderHook(() => useError('TestComponent'));
      
      expect(result.current.isLoading).toBe(false);
      
      act(() => {
        result.current.setIsLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
      
      act(() => {
        result.current.setIsLoading(false);
      });
      
      expect(result.current.isLoading).toBe(false);
    });
  });
  
  describe('GlobalErrorState', () => {
    it('should notify handlers when global error changes', () => {
      // Setup a handler mock
      const handler = jest.fn();
      const globalErrorState = GlobalErrorState.getInstance();
      
      // Register the handler
      globalErrorState.registerHandler(handler);
      
      // Set a global error
      globalErrorState.setGlobalError(mockAppError);
      
      // Handler should be called with the error
      expect(handler).toHaveBeenCalledWith(mockAppError);
      
      // Clear error
      globalErrorState.setGlobalError(null);
      
      // Handler should be called with null
      expect(handler).toHaveBeenCalledWith(null);
      
      // Unregister handler
      globalErrorState.unregisterHandler(handler);
      
      // Set another error
      globalErrorState.setGlobalError(mockAppError);
      
      // Handler should not be called again
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });
}); 