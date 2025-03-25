import React, { useEffect, useState } from "react";
import { View, useColorScheme, TouchableWithoutFeedback, Keyboard, StatusBar, SafeAreaView } from "react-native";
import { useTimer } from "../hooks/useTimer";
import useTask from "../hooks/useTask";
import { Task } from "../types/core";
import { TimeEntrySchema } from "../types/entities";
import TaskForm from "../components/tasks/TaskForm";
import TaskList from "../components/tasks/TaskList";
import EmptyState from "../components/shared/EmptyState";
import { useRouter } from "expo-router";

/**
 * Home screen displays the task management interface
 */
export default function HomeScreen() {
  const { startTimer } = useTimer();
  const { 
    createTask, 
    getAllTasksWithTime,
    getFilteredTasks,
    refreshTasks, 
    isLoading, 
    error,
    timeEntries,
    deleteTask
  } = useTask();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();

  // Load tasks when component mounts
  useEffect(() => {
    loadTasks();
  }, []);

  // Helper function to check if a timestamp is from today
  const isToday = (timestamp: number): boolean => {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // Helper function to calculate time spent on a task today
  const calculateTimeSpentToday = (taskId: string, allTimeEntries: TimeEntrySchema[]): number => {
    const taskEntries = allTimeEntries.filter(entry => entry.taskId === taskId);
    
    return taskEntries.reduce((total, entry) => {
      // Skip entries that weren't active today
      const startedToday = isToday(entry.timeStarted);
      const endedToday = entry.timeEnded ? isToday(entry.timeEnded) : false;
      
      // If entry was not active today at all, skip it
      if (!startedToday && !endedToday && !entry.isRunning) {
        return total;
      }
      
      let timeToAdd = 0;
      
      // For running entries, calculate current elapsed time
      if (entry.isRunning) {
        const now = Math.floor(Date.now() / 1000);
        
        // If started today, count from start time
        if (startedToday) {
          timeToAdd = now - entry.timeStarted;
        } else {
          // If started before today, count from start of today
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          timeToAdd = now - Math.floor(startOfToday.getTime() / 1000);
        }
      } 
      // For completed entries
      else if (entry.timeEnded) {
        // Both started and ended today
        if (startedToday && endedToday) {
          timeToAdd = entry.timeEnded - entry.timeStarted;
        }
        // Started before today, ended today
        else if (!startedToday && endedToday) {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          timeToAdd = entry.timeEnded - Math.floor(startOfToday.getTime() / 1000);
        }
        // Started today, ended later (shouldn't happen but just in case)
        else if (startedToday && !endedToday) {
          const endOfToday = new Date();
          endOfToday.setHours(23, 59, 59, 999);
          timeToAdd = Math.floor(endOfToday.getTime() / 1000) - entry.timeStarted;
        }
      }
      
      return total + timeToAdd;
    }, 0);
  };

  // Helper function to get the last activity timestamp for a task
  const getLastActivityTime = (taskId: string, allTimeEntries: TimeEntrySchema[]): number => {
    const taskEntries = allTimeEntries.filter(entry => entry.taskId === taskId);
    
    if (taskEntries.length === 0) {
      return 0;
    }
    
    // Find the most recent activity
    return Math.max(
      ...taskEntries.map(entry => {
        // For running entries or entries with no end time, use current time
        if (entry.isRunning || !entry.timeEnded) {
          return Date.now() / 1000;
        }
        // Otherwise use the end time
        return entry.timeEnded;
      })
    );
  };

  // Load today's tasks from the database
  const loadTasks = async () => {
    try {
      console.log('[HomeScreen] Loading today\'s tasks');
      
      // Get all non-completed tasks
      const allTasks = await getFilteredTasks(showCompleted);
      
      // Process tasks to only include those active today and add today's time spent
      const todaysTasks = allTasks.map(task => {
        const timeSpentToday = calculateTimeSpentToday(task.id, timeEntries);
        const lastActivityTime = getLastActivityTime(task.id, timeEntries);
        
        return {
          ...task,
          totalTime: timeSpentToday, // Override totalTime with today's time
          lastActivityTime // Add property for sorting
        };
      });
      
      // Filter to only include tasks that have been worked on today or created today
      const filteredTasks = todaysTasks.filter(task => 
        task.totalTime > 0 || isToday(task.createdAt / 1000)
      );
      
      // Sort by last activity time, most recent first
      const sortedTasks = filteredTasks.sort((a, b) => 
        (b.lastActivityTime || 0) - (a.lastActivityTime || 0)
      );
      
      console.log(`[HomeScreen] Found ${sortedTasks.length} tasks active today`);
      setTasks(sortedTasks);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    }
  };

  // Refresh tasks when needed
  const handleRefresh = async () => {
    console.log('[HomeScreen] Refreshing tasks');
    await refreshTasks();
    loadTasks();
  };

  // Handle task creation
  const handleAddTask = async (taskName: string, startTimerAfterCreation: boolean) => {
    if (taskName.trim()) {
      try {
        setIsSubmitting(true);
        console.log('[HomeScreen] Creating task:', taskName.trim(), 'with timer:', startTimerAfterCreation);
        const newTask = await createTask(taskName.trim());
        
        // Automatically start timer if toggle is on
        if (startTimerAfterCreation) {
          handleStartTask(newTask.id);
        }
        
        // Refresh task list
        handleRefresh();
      } catch (error) {
        console.error("Failed to create task:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle starting a timer for a task
  const handleStartTask = (taskId: string) => {
    console.log('[HomeScreen] Starting timer for task ID:', taskId);
    startTimer(taskId);
  };
  
  // Handle viewing task details
  const handleTaskPress = (taskId: string) => {
    console.log('[HomeScreen] Viewing task details for task ID:', taskId);
    router.push(`/task/${taskId}`);
  };
  
  // Handle deleting a task
  const handleDeleteTask = async (taskId: string) => {
    console.log('[HomeScreen] Deleting task ID:', taskId);
    try {
      await deleteTask(taskId);
      // Refresh the task list after deletion
      await handleRefresh();
      console.log('[HomeScreen] Task deleted successfully:', taskId);
    } catch (error) {
      console.error('[HomeScreen] Error deleting task:', error);
    }
  };
  
  // Handle task reordering
  const handleReorderTasks = (reorderedTasks: Task[]) => {
    console.log('[HomeScreen] Tasks have been reordered');
    setTasks(reorderedTasks);
    // Note: In a real app, you might want to persist this order to storage
  };
  
  // Dismiss keyboard when tapping outside inputs
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <SafeAreaView className={`flex-1 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <View className="flex-1 px-4 pt-4">
          <TaskForm 
            onAddTask={handleAddTask} 
            isSubmitting={isSubmitting} 
          />
          
          {tasks.length > 0 ? (
            <TaskList 
              tasks={tasks} 
              onTaskPress={handleTaskPress} 
              onPlayPress={handleStartTask}
              onDeletePress={handleDeleteTask}
              onReorderTasks={handleReorderTasks}
              isLoading={isLoading}
            />
          ) : (
            <EmptyState 
              icon="clipboard-outline" 
              title="No tasks today" 
              message={`Create a task or start tracking time to see it here`} 
              isLoading={isLoading}
            />
          )}
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
