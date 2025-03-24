import React from "react";
import { View, useColorScheme, TouchableWithoutFeedback, Keyboard, StatusBar, SafeAreaView } from "react-native";
import { useTask } from "../context/TaskContext";
import { useTimer } from "../context/TimerContext";
import TaskForm from "../components/tasks/TaskForm";
import TaskList from "../components/tasks/TaskList";

/**
 * TasksScreen displays the task management interface
 */
export default function HomeScreen() {
  const { tasks, addTask } = useTask();
  const { startTimer } = useTimer();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  // Handle task creation
  const handleAddTask = (taskName: string, startTimerAfterCreation: boolean) => {
    if (taskName.trim()) {
      const task = addTask(taskName.trim());
      
      // Automatically start timer if toggle is on
      if (startTimerAfterCreation && task) {
        handleStartTask(task.id);
      }
    }
  };

  // Handle starting a timer for a task
  const handleStartTask = (taskId: string) => {
    startTimer(taskId);
  };
  
  // Handle viewing task details
  const handleTaskPress = (taskId: string) => {
    console.log('View task details:', taskId);
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
          <View className="flex-1 px-4">
 
            
            {/* List of tasks */}
            <TaskList 
              tasks={tasks} 
              onTaskPress={handleTaskPress}
              onPlayPress={handleStartTask}
            />
          </View>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </>
  );
}
