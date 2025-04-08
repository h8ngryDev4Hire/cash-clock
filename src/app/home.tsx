import React, { useEffect, useState } from "react";
import { View, useColorScheme, TouchableWithoutFeedback, Keyboard, StatusBar, SafeAreaView } from "react-native";
import { useTimer } from "@hooks/useTimer";
import useTask from "@hooks/useTask";
import { useError } from "@hooks/useError";
import { Task } from "@def/core";
import TaskForm from "@components/tasks/TaskForm";
import TaskList from "@components/tasks/TaskList";
import EmptyState from "@components/shared/EmptyState";
import { useRouter } from "expo-router";
import { getTodaysTasks } from "@lib/util/task/taskFilters";
import { LocalErrorMessage } from "@components/ui/LocalErrorMessage";
import { ErrorLevel } from "@def/error";
import { log } from "@lib/util/debugging/logging";

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
    isLoading: taskLoading, 
    error: taskError,
    timeEntries,
    deleteTask
  } = useTask();
  
  // Initialize error handling
  const { 
    error, 
    isLoading: errorLoading, 
    handleError, 
    clearError,
    setIsLoading
  } = useError('HomeScreen');
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  
  // Total loading state combining task loading and error loading
  const isLoading = taskLoading || errorLoading;

  // Load tasks when component mounts
  useEffect(() => {
    loadTasks();
  }, []);

  // Load today's tasks from the database
  const loadTasks = async () => {
    try {
      setIsLoading(true);
      clearError();
      log('Loading today\'s tasks', 'HomeScreen', 'INFO');
      
      // Get all non-completed tasks
      const allTasks = await getFilteredTasks(showCompleted);
      
      // Process tasks using utility function
      const todaysTasks = getTodaysTasks(allTasks, timeEntries);
      
      log('Found ' + todaysTasks.length + ' tasks active today', 'HomeScreen', 'INFO');
      setTasks(todaysTasks);
      setIsLoading(false);
    } catch (err) {
      handleError(err, ErrorLevel.ERROR, { operation: 'loadTasks' });
    }
  };

  // Refresh tasks when needed
  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      clearError();
      log('Refreshing tasks', 'HomeScreen', 'INFO');
      await refreshTasks();
      await loadTasks();
      setIsLoading(false);
    } catch (err) {
      handleError(err, ErrorLevel.ERROR, { operation: 'refreshTasks' });
    }
  };

  // Handle task creation
  const handleAddTask = async (taskName: string, startTimerAfterCreation: boolean) => {
    if (taskName.trim()) {
      try {
        setIsSubmitting(true);
        setIsLoading(true);
        clearError();
        
        log('Creating task: ' + taskName.trim() + ' with timer: ' + startTimerAfterCreation, 'HomeScreen', 'INFO');
        const newTask = await createTask(taskName.trim());
        
        // Automatically start timer if toggle is on
        if (startTimerAfterCreation) {
          handleStartTask(newTask.id);
        }
        
        // Refresh task list
        await handleRefresh();
        setIsLoading(false);
      } catch (err) {
        handleError(err, ErrorLevel.ERROR, { 
          operation: 'createTask', 
          input: { taskName, startTimerAfterCreation } 
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Handle starting a timer for a task
  const handleStartTask = (taskId: string) => {
    try {
      log('Starting timer for task ID: ' + taskId, 'HomeScreen', 'INFO');
      startTimer(taskId);
    } catch (err) {
      handleError(err, ErrorLevel.ERROR, { operation: 'startTimer', entityId: taskId });
    }
  };
  
  // Handle viewing task details
  const handleTaskPress = (taskId: string) => {
    log('Viewing task details for task ID: ' + taskId, 'HomeScreen', 'INFO');
    router.push(`/task/${taskId}`);
  };
  
  // Handle deleting a task
  const handleDeleteTask = async (taskId: string) => {
    try {
      setIsLoading(true);
      clearError();
      log('Deleting task ID: ' + taskId, 'HomeScreen', 'INFO');
      await deleteTask(taskId);
      // Refresh the task list after deletion
      await loadTasks();
      log('Task deleted successfully: ' + taskId, 'HomeScreen', 'INFO');
      setIsLoading(false);
    } catch (err) {
      handleError(err, ErrorLevel.ERROR, { 
        operation: 'deleteTask', 
        entityId: taskId 
      });
    }
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
          {/* Display local error message if there's an error */}
          {error && (
            <View className="mb-2">
              <LocalErrorMessage 
                error={error} 
                onDismiss={clearError} 
              />
            </View>
          )}
          
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
