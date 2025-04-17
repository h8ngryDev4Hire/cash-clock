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
  
  /**
   * Handle starting a new task from the timer player
   */
  const handleStartNewTask = async (newTaskName: string) => {
    try {
      log(`Starting new task: ${newTaskName}`, 'useTimerPlayer', 'handleStartNewTask', 'INFO');
      setIsLoading(true);
      clearError();
      
      // Create a new task and start the timer
      const task = await createTask(newTaskName);
      if (task) {
        setTaskName(task.name);
        startTimer(task.id);
      }
      setIsLoading(false);
    } catch (err) {
      handleError(err, ErrorLevel.ERROR, { operation: 'handleStartNewTask' }, true);
    }
  };
  
  /**
   * Handle selecting an existing task from search
   */
  const handleSelectExistingTask = async (selectedTaskId: string) => {
    try {
      log(`Selecting existing task: ${selectedTaskId}`, 'useTimerPlayer', 'handleSelectExistingTask', 'INFO');
      setIsLoading(true);
      clearError();
      
      // Fetch task data to update the name
      const taskData = await getTaskWithTime(selectedTaskId);
      if (taskData) {
        setTaskName(taskData.name);
        startTimer(taskData.id);
      } else {
        throw new Error(`Task with ID ${selectedTaskId} not found`);
      }
      
      setIsLoading(false);
    } catch (err) {
      handleError(err, ErrorLevel.ERROR, { operation: 'handleSelectExistingTask', entityId: selectedTaskId }, true);
    }
  };
  
  /**
   * Handle navigating to the task details page
   */
  const handleTaskPress = () => {
    if (!taskId) return;
    
    log(`Navigating to task details for task ID: ${taskId}`, 'useTimerPlayer', 'handleTaskPress', 'INFO');
    router.push(`/task/${taskId}`);
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
    handleSelectExistingTask,
    handleTaskPress,
    pauseTimer,
    resumeTimer,
    stopTimer
  };
} 