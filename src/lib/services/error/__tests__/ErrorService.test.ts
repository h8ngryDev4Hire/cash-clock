import { ErrorService, ErrorTypes } from '../ErrorService';
import { ErrorLevel, AppError } from '@def/error';

describe('ErrorService', () => {
  let errorService: ErrorService;
  
  // Mock console methods to prevent log output during tests
  const originalConsole = {
    info: console.info,
    warn: console.warn,
    error: console.error
  };
  
  beforeEach(() => {
    // Clear singleton instance
    // @ts-ignore: Accessing private static property for testing
    ErrorService.instance = undefined;
    errorService = ErrorService.getInstance();
    
    // Mock console methods
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  });
  
  afterEach(() => {
    // Restore console methods
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });
  
  describe('getInstance', () => {
    it('should return the same instance when called multiple times', () => {
      const instance1 = ErrorService.getInstance();
      const instance2 = ErrorService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('logError', () => {
    it('should create an AppError object with correct properties', () => {
      const error = new Error('Test error');
      const level = ErrorLevel.WARNING;
      const context = { component: 'TestComponent', operation: 'testOperation' };
      
      const appError = errorService.logError(error, level, context);
      
      expect(appError).toMatchObject({
        originalError: error,
        message: 'Test error',
        level: ErrorLevel.WARNING,
        context: expect.objectContaining({
          component: 'TestComponent',
          operation: 'testOperation',
          timestamp: expect.any(Number)
        })
      });
      expect(appError.id).toMatch(/^error_\d+_/);
    });
    
    it('should add error to session errors', () => {
      const error = new Error('Test error');
      errorService.logError(error);
      
      const sessionErrors = errorService.getSessionErrors();
      expect(sessionErrors).toHaveLength(1);
      expect(sessionErrors[0].message).toBe('Test error');
    });
    
    it('should log error to console with appropriate level', () => {
      errorService.logError(new Error('Info error'), ErrorLevel.INFO);
      errorService.logError(new Error('Warning error'), ErrorLevel.WARNING);
      errorService.logError(new Error('Error'), ErrorLevel.ERROR);
      errorService.logError(new Error('Fatal error'), ErrorLevel.FATAL);
      
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('getUserMessage', () => {
    it('should return correct user message for error types', () => {
      const networkError = new Error('Failed to fetch');
      networkError.name = 'NetworkError';
      
      const dbError = new Error('SQLite constraint violation');
      dbError.name = 'SQLiteError';
      
      const validationError = new Error('Invalid input');
      validationError.name = 'ValidationError';
      
      expect(errorService.getUserMessage(networkError)).toContain('internet connection');
      expect(errorService.getUserMessage(dbError)).toContain('problem saving your data');
      expect(errorService.getUserMessage(validationError)).toContain('not valid');
    });
    
    it('should return level-based message when type is not recognized', () => {
      const genericError = new Error('Something went wrong');
      
      expect(errorService.getUserMessage(genericError, ErrorLevel.INFO))
        .toContain('Something minor');
      expect(errorService.getUserMessage(genericError, ErrorLevel.WARNING))
        .toContain('not critical');
      expect(errorService.getUserMessage(genericError, ErrorLevel.ERROR))
        .toContain('encountered a problem');
      expect(errorService.getUserMessage(genericError, ErrorLevel.FATAL))
        .toContain('critical error');
    });
  });
  
  describe('getSessionErrors', () => {
    beforeEach(() => {
      // Set up some test errors
      errorService.logError(new Error('Error 1'), ErrorLevel.INFO, { 
        component: 'Component1', 
        operation: 'operation1',
        entityType: 'task'
      });
      
      errorService.logError(new Error('Error 2'), ErrorLevel.WARNING, { 
        component: 'Component2', 
        operation: 'operation2',
        entityType: 'timeEntry'
      });
      
      errorService.logError(new Error('Error 3'), ErrorLevel.ERROR, { 
        component: 'Component1', 
        operation: 'operation3',
        entityType: 'task'
      });
    });
    
    it('should return all errors when no filter is provided', () => {
      const errors = errorService.getSessionErrors();
      expect(errors).toHaveLength(3);
    });
    
    it('should filter errors by level', () => {
      const errors = errorService.getSessionErrors({ level: ErrorLevel.INFO });
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Error 1');
    });
    
    it('should filter errors by component', () => {
      const errors = errorService.getSessionErrors({ component: 'Component1' });
      expect(errors).toHaveLength(2);
    });
    
    it('should filter errors by operation', () => {
      const errors = errorService.getSessionErrors({ operation: 'operation2' });
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe('Error 2');
    });
    
    it('should filter errors by entityType', () => {
      const errors = errorService.getSessionErrors({ entityType: 'task' });
      expect(errors).toHaveLength(2);
    });
    
    it('should filter errors by date range', () => {
      const now = Date.now();
      
      // Add an error with a future timestamp (for testing)
      const futureTime = now + 10000;
      const pastTime = now - 10000;
      
      // @ts-ignore - Setting the timestamp directly for testing
      errorService.logError(new Error('Future error')).context.timestamp = futureTime;
      // @ts-ignore - Setting the timestamp directly for testing
      errorService.logError(new Error('Past error')).context.timestamp = pastTime;
      
      const middleErrors = errorService.getSessionErrors({ 
        fromDate: pastTime + 1000,
        toDate: futureTime - 1000
      });
      
      // Should include the original 3 errors but not the future or past ones
      expect(middleErrors).toHaveLength(3);
    });
    
    it('should respect the limit option', () => {
      const errors = errorService.getSessionErrors({ limit: 2 });
      expect(errors).toHaveLength(2);
    });
  });
  
  describe('clearSessionErrors', () => {
    it('should remove all session errors', () => {
      errorService.logError(new Error('Test error 1'));
      errorService.logError(new Error('Test error 2'));
      
      expect(errorService.getSessionErrors()).toHaveLength(2);
      
      errorService.clearSessionErrors();
      
      expect(errorService.getSessionErrors()).toHaveLength(0);
    });
  });
  
  describe('isErrorType', () => {
    it('should correctly identify known error types', () => {
      const networkError = new Error('Failed to fetch');
      networkError.name = 'NetworkError';
      
      const fetchError = new Error('Fetch failed');
      fetchError.name = 'FetchError';
      
      const dbError = new Error('Database constraint error');
      dbError.name = 'ConstraintError';
      
      expect(errorService.isErrorType(networkError, 'NetworkError')).toBe(true);
      expect(errorService.isErrorType(fetchError, 'NetworkError')).toBe(true); // Should match from the NetworkError category
      expect(errorService.isErrorType(dbError, 'DatabaseError')).toBe(true);
    });
    
    it('should match error by name or message content', () => {
      const customError = new Error('Custom error with ValidationError in message');
      expect(errorService.isErrorType(customError, 'ValidationError')).toBe(true);
      
      const namedError = new Error('Some error');
      namedError.name = 'CustomName';
      expect(errorService.isErrorType(namedError, 'CustomName')).toBe(true);
    });
    
    it('should return false for non-matching errors', () => {
      const error = new Error('Regular error');
      expect(errorService.isErrorType(error, 'NetworkError')).toBe(false);
      expect(errorService.isErrorType(error, 'DatabaseError')).toBe(false);
      expect(errorService.isErrorType(error, 'NonExistentType')).toBe(false);
    });
    
    it('should handle null/undefined errors safely', () => {
      // @ts-ignore - Testing with undefined for robustness
      expect(errorService.isErrorType(undefined, 'NetworkError')).toBe(false);
      // @ts-ignore - Testing with null for robustness
      expect(errorService.isErrorType(null, 'DatabaseError')).toBe(false);
    });
  });
}); 