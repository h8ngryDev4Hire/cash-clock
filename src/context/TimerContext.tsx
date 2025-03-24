import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { timerService } from '../services/timer/TimerService';
import { formatTime } from '../services/timer/time';
import { TimerStatus, TimerData, TimerContextValue } from '../types/timer';

// Create the context with a default value
export const TimerContext = createContext<TimerContextValue | undefined>(undefined);

// TimerProvider props interface
interface TimerProviderProps {
  children: ReactNode;
}

/**
 * TimerProvider component that wraps the app and provides timer functionality
 */
export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  // State to track in the context
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [timerData, setTimerData] = useState<TimerData>(timerService.getTimerData());
  
  // Setup listeners for timer updates
  useEffect(() => {
    // Listen for timer ticks and update elapsed time
    const handleTick = (time: number) => {
      setElapsedTime(time);
    };
    
    // Listen for timer status changes and update timer data
    const handleStatusChange = (status: TimerStatus) => {
      setTimerData(timerService.getTimerData());
    };
    
    // Register listeners
    timerService.addTickListener(handleTick);
    timerService.addStatusListener(handleStatusChange);
    
    // Initial state
    setElapsedTime(timerService.calculateElapsedTime());
    setTimerData(timerService.getTimerData());
    
    // Cleanup listeners on unmount
    return () => {
      timerService.removeTickListener(handleTick);
      timerService.removeStatusListener(handleStatusChange);
    };
  }, []);
  
  // Create context value
  const contextValue: TimerContextValue = {
    isRunning: timerData.status === TimerStatus.RUNNING,
    isPaused: timerData.status === TimerStatus.PAUSED,
    elapsedTime,
    formattedTime: formatTime(elapsedTime),
    taskId: timerData.taskId,
    
    startTimer: (taskId: string) => timerService.startTimer(taskId),
    pauseTimer: () => timerService.pauseTimer(),
    resumeTimer: () => timerService.resumeTimer(),
    stopTimer: () => timerService.stopTimer(),
  };
  
  return (
    <TimerContext.Provider value={contextValue}>
      {children}
    </TimerContext.Provider>
  );
};