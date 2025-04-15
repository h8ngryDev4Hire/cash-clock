import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import useTask from './useTask';
import { useTimer } from './useTimer';
import { useError } from './useError';
import { ErrorLevel } from '@def/error';
import { millisecondsToSeconds } from '@lib/util/time/timeCalculations';
import { log } from '@lib/util/debugging/logging';

/**
 * Custom hook that encapsulates all timer player functionality
 * This centralizes the timer player logic from the layout component
 */
export function useTimerPlayer() {
  const { isRunning, isPaused, elapsedTime, taskId, startTimer, pauseTimer, resumeTimer, stopTimer } = useTimer();
  const { createTask, getTaskWithTime } = useTask();
  const router = useRouter();
  const pathname = usePathname();
  const [taskName, setTaskName] = useState("Unnamed Task");
  
  // Initialize error handling - use global errors since this is a persistent UI component
  const { handleError, setIsLoading, clearError } = useError('TimerPlayer', false); 
  
  // Determine if timer should be visible
  const isTimerActive = isRunning || isPaused;
  const isHomeView = pathname === "/home" || pathname === "/";
  const shouldShowTimer = isTimerActive || isHomeView;
  
  // Get task name when taskId changes
  useEffect(() => {
    const fetchTaskName = async () => {
      if (taskId) {
        try {
          setIsLoading(true);
          clearError();
          
          const taskData = await getTaskWithTime(taskId);
          if (taskData) {
            setTaskName(taskData.name);
          }
          
          setIsLoading(false);
        } catch (err) {
          // Use global error handling for task loading failures
          handleError(err, ErrorLevel.ERROR, { 
            operation: 'fetchTaskName', 
            entityId: taskId 
          }, true);
        }
      }
    };
    
    fetchTaskName();
  }, [taskId]);
  
  // Convert milliseconds to seconds for the TimerPlayer component
  const elapsedTimeInSeconds = millisecondsToSeconds(elapsedTime);
  
  // Handle starting a new task
  const handleStartNewTask = async (name: string) => {
    if (name.trim()) {
      try {
        setIsLoading(true);
        clearError();
        
        // Create a new task and start the timer for it
        const newTask = await createTask(name.trim());
        startTimer(newTask.id);
        
        setIsLoading(false);
      } catch (err) {
        // Use global error handling for quick task creation
        handleError(err, ErrorLevel.ERROR, { 
          operation: 'createQuickTask', 
          input: { name } 
        }, true);
      }
    } else {
      handleError(
        new Error('Task name cannot be empty'),
        ErrorLevel.WARNING,
        { operation: 'validateQuickTaskName' },
        true // Set as global error
      );
    }
  };
  
  // Handle task press to navigate to task details
  const handleTaskPress = () => {
    if (taskId) {
      // Navigate to the task details screen
      router.push(`/task/${taskId}`);
    }
  };
  
  return {
    // State
    taskName,
    elapsedTimeInSeconds,
    isRunning,
    isPaused,
    
    // Visibility
    shouldShowTimer,
    isTimerActive,
    
    // Actions
    handleStartNewTask,
    handleTaskPress,
    pauseTimer,
    resumeTimer,
    stopTimer
  };
} 