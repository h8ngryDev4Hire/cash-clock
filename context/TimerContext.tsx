import React, { createContext, useContext, useState, useEffect } from 'react';

interface TimerContextType {
  isRunning: boolean;
  elapsedTime: number;
  currentTaskId: string | null;
  startTimer: (taskId: string) => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

export const TimerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const startTimer = (taskId: string) => {
    setCurrentTaskId(taskId);
    setIsRunning(true);
    setStartTime(Date.now());
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const stopTimer = () => {
    setIsRunning(false);
    // Here we would log the time spent on the current task
    // This will be implemented when we add the TaskContext
  };

  const resetTimer = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setCurrentTaskId(null);
    setStartTime(null);
  };

  return (
    <TimerContext.Provider
      value={{
        isRunning,
        elapsedTime,
        currentTaskId,
        startTimer,
        pauseTimer,
        stopTimer,
        resetTimer,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};