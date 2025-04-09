import { errorService } from '../error/ErrorService';
import { storageService } from '../storage/StorageService';
import { log } from '@lib/util/debugging/logging';
import { ErrorLevel } from '@def/error';

/**
 * Initialization status tracking
 */
export enum InitStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Service initialization result
 */
interface InitResult {
  success: boolean;
  error?: Error;
}

/**
 * OrchestratorService
 * 
 * This service manages the application startup process by initializing
 * all required services in the correct order based on dependencies.
 * 
 * The initialization sequence is:
 * 1. ErrorService (for logging startup errors)
 * 2. StorageService (database initialization)
 * 3. Other services that depend on storage
 */
class OrchestratorService {
  private isInitializing: boolean = false;
  private initializationStatus: Record<string, InitStatus> = {
    error: InitStatus.NOT_STARTED,
    storage: InitStatus.NOT_STARTED,
    // Add other services as needed
  };
  
  private initializationErrors: Record<string, Error | undefined> = {};
  private startTime: number = 0;
  private endTime: number = 0;
  
  /**
   * Initialize all application services in the correct order
   */
  public async initialize(): Promise<boolean> {
    // Prevent concurrent initializations
    if (this.isInitializing) {
      log('Initialization already in progress, skipping duplicate call', 'OrchestratorService', 'initialize', 'WARNING');
      return false;
    }
    
    this.isInitializing = true;
    this.startTime = Date.now();
    
    try {
      log('Starting application initialization', 'OrchestratorService', 'initialize', 'INFO');
      
      // Initialize ErrorService first (for logging startup errors)
      // Note: ErrorService is typically self-initializing on first use
      this.updateStatus('error', InitStatus.IN_PROGRESS);
      this.updateStatus('error', InitStatus.COMPLETED);
      
      // Initialize StorageService (database)
      this.updateStatus('storage', InitStatus.IN_PROGRESS);
      const storageResult = await this.initializeStorage();
      
      if (!storageResult.success) {
        this.handleInitError('storage', storageResult.error);
        return false;
      }
      
      this.updateStatus('storage', InitStatus.COMPLETED);
      
      // Add initialization for other services here
      // ...
      
      // Finish initialization
      this.endTime = Date.now();
      log(`Application initialized successfully in ${this.endTime - this.startTime}ms`, 'OrchestratorService', 'initialize', 'INFO');
      return true;
    } catch (error) {
      this.endTime = Date.now();
      
      const formattedError = error instanceof Error ? error : new Error(String(error));
      log(`Application initialization failed after ${this.endTime - this.startTime}ms: ${formattedError.message}`, 
          'OrchestratorService', 'initialize', 'ERROR');
      
      errorService.logError(
        formattedError,
        ErrorLevel.FATAL,
        {
          component: 'OrchestratorService',
          operation: 'initialize'
        }
      );
      
      return false;
    } finally {
      this.isInitializing = false;
    }
  }
  
  /**
   * Initialize the storage service
   */
  private async initializeStorage(): Promise<InitResult> {
    try {
      log('Initializing storage service', 'OrchestratorService', 'initializeStorage', 'INFO');
      await storageService.initialize();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  
  /**
   * Handle initialization error for a service
   */
  private handleInitError(serviceName: string, error?: Error): void {
    const errorMessage = error?.message || 'Unknown error';
    log(`Failed to initialize ${serviceName}: ${errorMessage}`, 'OrchestratorService', 'handleInitError', 'ERROR');
    
    this.updateStatus(serviceName, InitStatus.FAILED);
    this.initializationErrors[serviceName] = error;
    
    errorService.logError(
      error || new Error(`Failed to initialize ${serviceName}`),
      ErrorLevel.FATAL,
      {
        component: 'OrchestratorService',
        operation: 'initialize',
        entityType: serviceName
      }
    );
  }
  
  /**
   * Update the initialization status of a service
   */
  private updateStatus(serviceName: string, status: InitStatus): void {
    this.initializationStatus[serviceName] = status;
    log(`Service ${serviceName} initialization status: ${status}`, 'OrchestratorService', 'updateStatus', 'VERBOSE');
  }
  
  /**
   * Check if all services have been initialized successfully
   */
  public isInitialized(): boolean {
    return Object.values(this.initializationStatus).every(
      status => status === InitStatus.COMPLETED
    );
  }
  
  /**
   * Get initialization status information
   */
  public getInitializationStatus(): Record<string, InitStatus> {
    return { ...this.initializationStatus };
  }
  
  /**
   * Get initialization errors
   */
  public getInitializationErrors(): Record<string, Error | undefined> {
    return { ...this.initializationErrors };
  }
  
  /**
   * Get initialization timing information
   */
  public getInitializationTiming(): { startTime: number; endTime: number; duration: number } {
    return {
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.endTime - this.startTime
    };
  }
}

// Export a singleton instance
export const orchestratorService = new OrchestratorService(); 