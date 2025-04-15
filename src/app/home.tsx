import React, { useEffect, useState, useCallback } from "react";
import { View, useColorScheme, TouchableWithoutFeedback, Keyboard, StatusBar, SafeAreaView, TouchableOpacity, Text, ScrollView, FlatList } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { useTimer } from "@hooks/useTimer";
import useTask from "@hooks/useTask";
import { useError } from "@hooks/useError";
import { Task } from "@def/core";
import TaskFormSheet from "@components/tasks/TaskFormSheet";
import TaskDetailsSheet from "@components/tasks/TaskDetailsSheet/TaskDetailsSheet";
import TaskItem from "@components/tasks/TaskItem";
import EmptyState from "@components/shared/EmptyState";
import { useRouter } from "expo-router";
import { getTodaysTasks, getPastTasks, getTasksWithTodayTimeEntries } from "@lib/util/task/taskFilters";
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
  
  const [todaysActivity, setTodaysActivity] = useState<Task[]>([]);
  const [pastTasks, setPastTasks] = useState<Task[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTaskFormVisible, setTaskFormVisible] = useState(false);
  const [isTaskDetailsVisible, setTaskDetailsVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  
  // Total loading state combining task loading and error loading
  const isLoading = taskLoading || errorLoading;

  // Load tasks when component mounts
  useEffect(() => {
    loadTasks();
  }, []);

  // Load tasks from the database and separate into today's and past tasks
  const loadTasks = async () => {
    try {
      setIsLoading(true);
      clearError();
      log('Loading tasks and activity data', 'HomeScreen', 'loadTasks', 'INFO');
      
      // Get all non-completed tasks
      const allTasks = await getFilteredTasks(showCompleted);
      log(`Retrieved ${allTasks.length} tasks from storage`, 'HomeScreen', 'loadTasks', 'DEBUG');
      log(`Time entries in storage: ${timeEntries.length}`, 'HomeScreen', 'loadTasks', 'DEBUG');
      
      // Log time entries for today to help with debugging
      const today = new Date();
      const todayFormatted = today.toISOString().split('T')[0];
      log(`[DEBUG] Today's date is: ${todayFormatted}`, 'HomeScreen', 'loadTasks', 'DEBUG');
      
      // Map time entries to ensure taskId is properly set
      const mappedTimeEntries = timeEntries.map(entry => {
        // Handle potential different property names in database
        const entryAny = entry as any;
        return {
          ...entry,
          taskId: entry.taskId || entryAny.task_id // Use taskId if available, otherwise use task_id
        };
      });
      
      // Log the mapped time entries
      mappedTimeEntries.forEach((entry, index) => {
        const startDate = new Date(entry.timeStarted * 1000);
        const endDate = entry.timeEnded ? new Date(entry.timeEnded * 1000) : null;
        const startFormatted = startDate.toISOString().split('T')[0];
        const endFormatted = endDate ? endDate.toISOString().split('T')[0] : 'running';
        log(`[DEBUG] Time entry ${index + 1}: taskId=${entry.taskId}, started=${startFormatted}, ended=${endFormatted}, isRunning=${entry.isRunning}`,
            'HomeScreen', 'loadTasks', 'DEBUG');
      });
      
      // Process tasks using utility functions with mapped time entries
      log('Finding tasks with today\'s activity', 'HomeScreen', 'loadTasks', 'DEBUG');
      const tasksWithTodayActivity = getTasksWithTodayTimeEntries(allTasks, mappedTimeEntries, showCompleted);
      
      log('Finding past tasks', 'HomeScreen', 'loadTasks', 'DEBUG');
      const tasksFromPast = getPastTasks(allTasks, mappedTimeEntries, showCompleted);
      
      log(`Found ${tasksWithTodayActivity.length} tasks with activity today`, 'HomeScreen', 'loadTasks', 'INFO');
      log(`Found ${tasksFromPast.length} past tasks`, 'HomeScreen', 'loadTasks', 'INFO');
      
      // Log details about found tasks for debugging
      if (tasksWithTodayActivity.length > 0) {
        log('Today\'s activity tasks:', 'HomeScreen', 'loadTasks', 'DEBUG', {
          variableName: 'taskNames',
          value: tasksWithTodayActivity.map(t => `${t.name} (${t.id}): ${t.totalTime}s`)
        });
      } else {
        log('[DEBUG] No tasks found for Today\'s Activity section', 'HomeScreen', 'loadTasks', 'DEBUG');
      }
      
      setTodaysActivity(tasksWithTodayActivity);
      setPastTasks(tasksFromPast);
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
      log('Refreshing tasks and activity data', 'HomeScreen', 'handleRefresh', 'INFO');
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
        
        log('Creating task: ' + taskName.trim() + ' with timer: ' + startTimerAfterCreation, 'HomeScreen', 'handleAddTask', 'INFO');
        const newTask = await createTask(taskName.trim());
        
        // Automatically start timer if toggle is on
        if (startTimerAfterCreation) {
          handleStartTask(newTask.id);
        }
        
        // Refresh task list
        await handleRefresh();
        setIsLoading(false);
        return Promise.resolve();
      } catch (err) {
        handleError(err, ErrorLevel.ERROR, { 
          operation: 'createTask', 
          input: { taskName, startTimerAfterCreation } 
        });
        return Promise.reject(err);
      } finally {
        setIsSubmitting(false);
      }
    }
    return Promise.resolve();
  };

  // Handle starting a timer for a task
  const handleStartTask = (taskId: string) => {
    try {
      log('Starting timer for task ID: ' + taskId, 'HomeScreen', 'handleStartTask', 'INFO');
      startTimer(taskId);
    } catch (err) {
      handleError(err, ErrorLevel.ERROR, { operation: 'startTimer', entityId: taskId });
    }
  };
  
  // Handle viewing task details
  const handleTaskPress = (taskId: string) => {
    log('Viewing task details for task ID: ' + taskId, 'HomeScreen', 'handleTaskPress', 'INFO');
    setSelectedTaskId(taskId);
    setTaskDetailsVisible(true);
  };
  
  // Handle closing task details sheet
  const handleCloseTaskDetails = () => {
    setTaskDetailsVisible(false);
  };
  
  // Handle task deleted from the details sheet
  const handleTaskDeleted = () => {
    log('Task deleted from details sheet', 'HomeScreen', 'handleTaskDeleted', 'INFO');
    loadTasks();
  };
  
  // Handle deleting a task
  const handleDeleteTask = async (taskId: string) => {
    try {
      setIsLoading(true);
      clearError();
      log('Deleting task ID: ' + taskId, 'HomeScreen', 'handleDeleteTask', 'INFO');
      await deleteTask(taskId);
      // Refresh the task list after deletion
      await loadTasks();
      log('Task deleted successfully: ' + taskId, 'HomeScreen', 'handleDeleteTask', 'INFO');
      setIsLoading(false);
    } catch (err) {
      handleError(err, ErrorLevel.ERROR, { 
        operation: 'deleteTask', 
        entityId: taskId 
      });
    }
  };
  
  // Toggle task form visibility
  const toggleTaskForm = () => {
    setTaskFormVisible(!isTaskFormVisible);
  };
  
  // Dismiss keyboard when tapping outside inputs
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Render section header
  const renderSectionHeader = (title: string, count: number) => (
    <View className={`flex-row justify-between items-center py-3 px-1 mt-2 mb-1 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
      <Text className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
        {title}
      </Text>
      <View className={`px-2 py-1 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <Text className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {count}
        </Text>
      </View>
    </View>
  );

  // Render a task item directly (no drag functionality)
  const renderTaskItem = (task: Task) => {
    return (
      <TaskItem
        key={task.id}
        task={task}
        onPress={handleTaskPress}
        onPlayPress={handleStartTask}
        onDeletePress={handleDeleteTask}
      />
    );
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
          
          {/* Task lists */}
          {todaysActivity.length === 0 && pastTasks.length === 0 ? (
            <EmptyState 
              icon="clipboard-outline" 
              title="No tasks yet" 
              message={`Create a task or start tracking time to see it here`} 
              isLoading={isLoading}
            />
          ) : (
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {/* Today's activity section */}
              {renderSectionHeader("Today's Activity", todaysActivity.length)}
              {todaysActivity.length > 0 ? (
                <View className="mb-6">
                  {todaysActivity.map(task => renderTaskItem(task))}
                </View>
              ) : (
                <View className={`py-8 px-4 rounded-lg mb-4 items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <Ionicons name="today-outline" size={32} color={isDark ? '#9CA3AF' : '#9CA3AF'} />
                  <Text className={`mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    No activity recorded today
                  </Text>
                </View>
              )}
              
              {/* Past tasks section */}
              {renderSectionHeader("Past Tasks", pastTasks.length)}
              {pastTasks.length > 0 ? (
                <View className="mb-24">
                  {pastTasks.map(task => renderTaskItem(task))}
                </View>
              ) : (
                <View className={`py-8 px-4 rounded-lg mb-4 items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <Ionicons name="time-outline" size={32} color={isDark ? '#9CA3AF' : '#9CA3AF'} />
                  <Text className={`mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    No past tasks available
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
          
          {/* Task form sheet */}
          <TaskFormSheet 
            isVisible={isTaskFormVisible}
            onClose={() => setTaskFormVisible(false)}
            onAddTask={handleAddTask}
          />
          
          {/* Task details sheet */}
          <TaskDetailsSheet
            isVisible={isTaskDetailsVisible}
            onClose={handleCloseTaskDetails}
            taskId={selectedTaskId}
            onTaskDeleted={handleTaskDeleted}
          />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
