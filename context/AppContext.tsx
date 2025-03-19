import React from 'react';
import { TimerProvider } from './TimerContext';
import { TaskProvider } from './TaskContext';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TaskProvider>
      <TimerProvider>
        {children}
      </TimerProvider>
    </TaskProvider>
  );
};