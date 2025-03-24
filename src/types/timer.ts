/**
 * Timer-related type definitions
 */

/**
 * Timer status enum
 */
export enum TimerStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
}

/**
 * Timer data interface representing the internal state of the timer
 */
export interface TimerData {
  id: string;
  taskId: string | null;
  startTime: number | null;
  elapsedTime: number; // in milliseconds
  status: TimerStatus;
  pausedAt: number | null;
}

/**
 * TimerContextValue defines the shape of the timer context API
 * exposed to components through the useTimer hook
 */
export interface TimerContextValue {
  // Timer state
  isRunning: boolean;
  isPaused: boolean;
  elapsedTime: number;
  formattedTime: string;
  taskId: string | null;
  
  // Timer actions
  startTimer: (taskId: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
}

/**
 * Legacy TimerContextType from older implementation
 * @deprecated Use TimerContextValue instead
 */
export interface TimerContextType {
  isRunning: boolean;
  elapsedTime: number;
  currentTaskId: string | null;
  startTimer: (taskId: string) => any;
  pauseTimer: () => void;
  stopTimer: (entryId: string) => void;
  resetTimer: () => void;
} 