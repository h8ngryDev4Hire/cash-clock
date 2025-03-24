import React from 'react';
import { TimerProvider } from './TimerContext';
import { TaskProvider } from './TaskContext';
import { StorageProvider } from './StorageContext';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <StorageProvider>
      <TaskProvider>
        <TimerProvider>
          {children}
        </TimerProvider>
      </TaskProvider>
    </StorageProvider>
  );
};
