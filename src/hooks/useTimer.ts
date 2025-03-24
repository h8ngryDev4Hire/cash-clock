import { useContext } from 'react';
import { TimerContext } from '../context/TimerContext';
import { TimerContextValue } from '../types/timer';

/**
 * Custom hook to access the timer context
 * @returns TimerContextValue with timer state and actions
 * @throws Error if used outside a TimerProvider
 */
export const useTimer = (): TimerContextValue => {
  const context = useContext(TimerContext);
  
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  
  return context;
}; 