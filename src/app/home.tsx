import React, { useEffect, useState } from "react";
import { View, useColorScheme, TouchableWithoutFeedback, Keyboard, StatusBar, SafeAreaView } from "react-native";
import { useTimer } from "../hooks/useTimer";
import { useStorage } from "../hooks/useStorage";
import { TaskSchema } from "../types/entities";
import TaskForm from "../components/tasks/TaskForm";
import TaskList from "../components/tasks/TaskList";
import EmptyState from "../components/shared/EmptyState";

/**
 * TasksScreen displays the task management interface
 */
export default function HomeScreen() {
  const { startTimer } = useTimer();
  const { tasks, isLoading, refreshData } = useStorage();
  const [taskList, setTaskList] = useState<TaskSchema[]>([]);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Load tasks when component mounts
  useEffect(() => {
    refreshData();
  }, []);

  // Update task list when tasks change
  useEffect(() => {
    setTaskList(tasks.getAll());
  }, [tasks]);

  // Handle task creation
  const handleAddTask = (taskName: string, startTimerAfterCreation: boolean) => {
    if (taskName.trim()) {
      console.log('[HomeScreen] Creating task:', taskName.trim(), 'with timer:', startTimerAfterCreation);
      tasks.create({
        name: taskName.trim(),
        isRunning: false,
        isGrouped: false,
        isCompleted: false,
        projectId: null
      })
      .then((newTask: TaskSchema) => {
        // Automatically start timer if toggle is on
        if (startTimerAfterCreation) {
          handleStartTask(newTask.itemId);
        }
        refreshData();
      })
      .catch((error: Error) => {
        console.error("Failed to create task:", error);
      });
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
    // In a real app, navigate to task detail screen
  };
  
  // Dismiss keyboard when tapping outside inputs
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={isDark ? "#1F2937" : "#FFFFFF"}
      />
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View className="flex-1 px-4 pt-4">
            {/* Task input form */}
            <TaskForm onAddTask={handleAddTask} />
            
            {/* Task list or empty state */}
            {taskList.length > 0 ? (
              <TaskList 
                tasks={taskList} 
                onTaskPress={handleTaskPress}
                onPlayPress={handleStartTask}
              />
            ) : !isLoading && (
              <EmptyState 
                icon="time-outline"
                title="No tasks yet"
                message="Add your first task to start tracking time"
              />
            )}
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </>
  );
}
