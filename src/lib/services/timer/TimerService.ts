import { storageService } from '../storage/StorageService';
import { generateUUID } from '@lib/util/uuid';
import { millisecondsToSeconds, calculateElapsedTime } from '@lib/util/time/timeCalculations';
import { TimerStatus, TimerData } from '@def/timer';
import { log } from '@lib/util/debugging/logging';

// Table name for timer state in SQLite
const TIMER_STATE_TABLE = 'settings';
const TIMER_STATE_KEY = 'timer_state';

/**
 * TimerService is a singleton class that manages timer operations
 * It handles starting, stopping, pausing, and resuming timers
 * and persists timer state to storage using the SQLite StorageService
 */
export class TimerService {
  private static instance: TimerService;
  private timer: TimerData;
  private tickInterval: NodeJS.Timeout | null = null;
  private tickListeners: Set<(elapsedTime: number) => void> = new Set();
  private statusListeners: Set<(status: TimerStatus) => void> = new Set();
  private storageInitialized: boolean = false;
  
  /**
   * Private constructor prevents direct instantiation
   */
  private constructor() {
    // Initialize with default timer state
    this.timer = {
      id: generateUUID(),
      taskId: null,
      startTime: null,
      elapsedTime: 0,
      status: TimerStatus.IDLE,
      pausedAt: null,
    };
    
    // Load saved timer state if exists (async)
    this.loadTimerState();
  }
  
  /**
   * Gets the singleton instance of TimerService
   */
  public static getInstance(): TimerService {
    if (!TimerService.instance) {
      TimerService.instance = new TimerService();
    }
    return TimerService.instance;
  }
  
  /**
   * Starts a new timer for a task
   * @param taskId The task ID to associate with the timer
   */
  public startTimer(taskId: string): void {
    // If a timer is already running, stop it first
    if (this.timer.status === TimerStatus.RUNNING) {
      this.stopTimer();
    }
    
    const now = Date.now();
    
    this.timer = {
      id: generateUUID(),
      taskId,
      startTime: now,
      elapsedTime: 0,
      status: TimerStatus.RUNNING,
      pausedAt: null,
    };
    
    // Update task in database to mark as running
    try {
      storageService.update(
        'tasks', 
        { is_running: 1, last_updated: Math.floor(now / 1000) }, 
        'item_id = ?', 
        [taskId]
      );
    } catch (error) {
      log('Error updating task running state', 'TimerService', 'startTimer', 'ERROR', { variableName: 'error', value: error });
    }
    
    this.saveTimerState();
    this.startTickInterval();
    this.notifyStatusListeners();
  }
  
  /**
   * Pauses the current timer
   */
  public pauseTimer(): void {
    if (this.timer.status !== TimerStatus.RUNNING) return;
    
    const now = Date.now();
    
    // Calculate elapsed time up to now
    if (this.timer.startTime) {
      this.timer.elapsedTime += calculateElapsedTime(this.timer.startTime, now);
    }
    
    this.timer.status = TimerStatus.PAUSED;
    this.timer.pausedAt = now;
    this.timer.startTime = null; // Reset start time since we've accumulated elapsed time
    
    this.stopTickInterval();
    this.saveTimerState();
    this.notifyStatusListeners();
  }
  
  /**
   * Resumes the paused timer
   */
  public resumeTimer(): void {
    if (this.timer.status !== TimerStatus.PAUSED) return;
    
    const now = Date.now();
    
    // Start a new timing segment from now
    this.timer.startTime = now;
    this.timer.status = TimerStatus.RUNNING;
    this.timer.pausedAt = null;
    
    // Update task in database if we have a task ID
    if (this.timer.taskId) {
      try {
        storageService.update(
          'tasks', 
          { is_running: 1, last_updated: Math.floor(now / 1000) }, 
          'item_id = ?', 
          [this.timer.taskId]
        );
      } catch (error) {
        log('Error updating task running state', 'TimerService', 'resumeTimer', 'ERROR', { variableName: 'error', value: error });
      }
    }
    
    this.startTickInterval();
    this.saveTimerState();
    this.notifyStatusListeners();
  }
  
  /**
   * Stops the current timer and saves a time entry
   */
  public stopTimer(): void {
    if (this.timer.status === TimerStatus.IDLE) return;
    
    const now = Date.now();
    let finalElapsedTime = this.timer.elapsedTime;
    
    if (this.timer.status === TimerStatus.RUNNING && this.timer.startTime) {
      // Add the final segment's elapsed time
      finalElapsedTime += calculateElapsedTime(this.timer.startTime, now);
    }
    
    // Only save a time entry if we have a task ID and elapsed time > 0
    if (this.timer.taskId && finalElapsedTime > 0) {
      this.saveTimeEntry(this.timer.taskId, finalElapsedTime);
    }
    
    // Reset timer state
    this.timer = {
      id: generateUUID(),
      taskId: null,
      startTime: null,
      elapsedTime: 0,
      status: TimerStatus.IDLE,
      pausedAt: null,
    };
    
    this.stopTickInterval();
    this.saveTimerState();
    this.notifyStatusListeners();
    this.notifyTickListeners(0);
  }
  
  /**
   * Calculates the current elapsed time for the timer
   */
  public calculateElapsedTime(): number {
    if (this.timer.status === TimerStatus.IDLE) {
      return 0;
    }
    
    // For paused timer, return the accumulated time
    if (this.timer.status === TimerStatus.PAUSED) {
      return this.timer.elapsedTime;
    }
    
    // For running timer, calculate elapsed time based on start time + accumulated time
    if (this.timer.startTime) {
      return this.timer.elapsedTime + calculateElapsedTime(this.timer.startTime);
    }
    
    return this.timer.elapsedTime;
  }
  
  /**
   * Gets the current timer data
   */
  public getTimerData(): TimerData {
    return { ...this.timer };
  }
  
  /**
   * Gets the current timer status
   */
  public getStatus(): TimerStatus {
    return this.timer.status;
  }
  
  /**
   * Gets the current task ID associated with the timer
   */
  public getTaskId(): string | null {
    return this.timer.taskId;
  }
  
  /**
   * Adds a listener for timer tick events
   * @param callback Function to call on each tick with the current elapsed time
   */
  public addTickListener(callback: (elapsedTime: number) => void): void {
    this.tickListeners.add(callback);
    // Immediately call with current elapsed time
    callback(this.calculateElapsedTime());
  }
  
  /**
   * Removes a tick listener
   */
  public removeTickListener(callback: (elapsedTime: number) => void): void {
    this.tickListeners.delete(callback);
  }
  
  /**
   * Adds a listener for timer status changes
   * @param callback Function to call when timer status changes
   */
  public addStatusListener(callback: (status: TimerStatus) => void): void {
    this.statusListeners.add(callback);
    // Immediately call with current status
    callback(this.timer.status);
  }
  
  /**
   * Removes a status listener
   */
  public removeStatusListener(callback: (status: TimerStatus) => void): void {
    this.statusListeners.delete(callback);
  }
  
  /**
   * Private method to start the tick interval
   */
  private startTickInterval(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
    }
    
    // Update every 1000ms (1 second)
    this.tickInterval = setInterval(() => {
      const elapsedTime = this.calculateElapsedTime();
      this.notifyTickListeners(elapsedTime);
    }, 1000);
  }
  
  /**
   * Private method to stop the tick interval
   */
  private stopTickInterval(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }
  
  /**
   * Private method to notify all tick listeners
   */
  private notifyTickListeners(elapsedTime: number): void {
    this.tickListeners.forEach(listener => listener(elapsedTime));
  }
  
  /**
   * Private method to notify all status listeners
   */
  private notifyStatusListeners(): void {
    this.statusListeners.forEach(listener => listener(this.timer.status));
  }
  
  /**
   * Private method to save a time entry for a task
   * @param taskId The task ID to save the entry for
   * @param elapsedTime The elapsed time in milliseconds
   */
  private saveTimeEntry(taskId: string, elapsedTime: number): void {
    // Convert milliseconds to seconds for storage
    const elapsedSeconds = millisecondsToSeconds(elapsedTime);
    const now = Math.floor(Date.now() / 1000);
    
    // Create time entry object
    const timeEntry = {
      item_id: this.timer.id,
      task_id: taskId,
      is_running: 0,
      time_spent: elapsedSeconds,
      time_started: this.timer.startTime 
        ? Math.floor(this.timer.startTime / 1000) 
        : now - elapsedSeconds,
      time_ended: now,
      created: now,
      last_updated: now,
    };
    
    // Insert time entry into database
    try {
      storageService.insert('time_entries', timeEntry);
      
      // Update task with is_running = false
      storageService.update(
        'tasks', 
        { is_running: 0, last_updated: now }, 
        'item_id = ?', 
        [taskId]
      );
      
      log('Time entry saved', 'TimerService', 'saveTimeEntry', 'INFO', { variableName: 'timeEntry', value: timeEntry });
    } catch (error) {
      log('Error saving time entry', 'TimerService', 'saveTimeEntry', 'ERROR', { variableName: 'error', value: error });
    }
  }
  
  /**
   * Private method to save the current timer state to storage
   */
  private async saveTimerState(): Promise<void> {
    try {
      // Ensure settings table exists (only needed once)
      if (!this.storageInitialized) {
        await this.initializeStorage();
      }
      
      const timerState = JSON.stringify(this.timer);
      const timestamp = Math.floor(Date.now() / 1000);
      
      // Check if timer state record already exists
      const existingRecord = storageService.findOne(
        TIMER_STATE_TABLE, 
        '*', 
        'key = ?', 
        [TIMER_STATE_KEY]
      );
      
      if (existingRecord) {
        // Update existing record
        storageService.update(
          TIMER_STATE_TABLE, 
          { 
            value: timerState, 
            last_updated: timestamp 
          }, 
          'key = ?', 
          [TIMER_STATE_KEY]
        );
      } else {
        // Insert new record
        storageService.insert(TIMER_STATE_TABLE, {
          key: TIMER_STATE_KEY,
          value: timerState,
          created: timestamp,
          last_updated: timestamp
        });
      }
    } catch (error) {
      log('Error saving timer state', 'TimerService', 'saveTimerState', 'ERROR', { variableName: 'error', value: error });
    }
  }
  
  /**
   * Private method to load timer state from storage
   */
  private async loadTimerState(): Promise<void> {
    try {
      // Ensure settings table exists (only needed once)
      if (!this.storageInitialized) {
        await this.initializeStorage();
      }
      
      const storedState = storageService.findOne(
        TIMER_STATE_TABLE, 
        '*', 
        'key = ?', 
        [TIMER_STATE_KEY]
      );
      
      if (storedState && storedState.value) {
        const savedTimer = JSON.parse(storedState.value) as TimerData;
        const now = Date.now();
        
        // Check if the timer was running when the app was closed
        if (savedTimer.status === TimerStatus.RUNNING && savedTimer.startTime) {
          // Calculate elapsed time since app was closed and add to accumulated time
          const elapsedSinceClose = calculateElapsedTime(savedTimer.startTime, now);
          savedTimer.elapsedTime += elapsedSinceClose;
          
          // Reset start time to now
          savedTimer.startTime = now;
        }
        
        this.timer = savedTimer;
        
        // If the timer should be running, start the tick interval
        if (this.timer.status === TimerStatus.RUNNING) {
          this.startTickInterval();
        }
      }
    } catch (error) {
      log('Error loading timer state', 'TimerService', 'loadTimerState', 'ERROR', { variableName: 'error', value: error });
      // Keep using default state if we can't load
    }
  }
  
  /**
   * Initialize storage for timer state
   */
  private async initializeStorage(): Promise<void> {
    try {
      // Ensure the storage service is initialized
      await storageService.initialize();
      
      // Check if the settings table exists (should be created by the schema)
      const tableExists = storageService.tableExists(TIMER_STATE_TABLE);
      
      // If the table doesn't exist for some reason, we'll create it
      if (!tableExists) {
        storageService.createTable(
          TIMER_STATE_TABLE,
          `key TEXT PRIMARY KEY,
           value TEXT NOT NULL,
           created INTEGER NOT NULL,
           last_updated INTEGER NOT NULL`
        );
      }
      
      this.storageInitialized = true;
    } catch (error) {
      log('Error initializing storage for timer state', 'TimerService', 'initializeStorage', 'ERROR', { variableName: 'error', value: error });
      // Continue with in-memory only as fallback
    }
  }
  
  /**
   * Method that can be used for registering platform native modules
   * to enhance timer functionality in the background
   * 
   * @param handler Platform-specific background timer handler
   */
  public registerBackgroundHandler(handler: unknown): void {
    // This is a placeholder for future integration with native modules
    log('Background handler registered - not implemented yet', 'TimerService', 'registerBackgroundHandler', 'INFO');
  }
}

// Create and export singleton instance
export const timerService = TimerService.getInstance(); 