import { Slot, useRouter, usePathname } from "expo-router";
import { useColorScheme, View, TouchableOpacity, Text } from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { AppProvider } from "@context/AppContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import TimerPlayer from "@components/timer/TimerPlayer";
import "../../global.css"
import { GlobalErrorHandler } from "@components/ui/GlobalErrorHandler";
import { log } from "@lib/util/debugging/logging";
import GlobalCreateButton from "@components/shared/GlobalCreateButton";
import TaskFormSheet from "@components/tasks/TaskFormSheet";
import CreateProjectSheet from "@components/projects/CreateProjectSheet";
import { useCreateFeatures } from "@hooks/useCreateFeatures";
import { useTimerPlayer } from "@hooks/useTimerPlayer";

// Simplified timer player container using the new hook
const TimerPlayerContainer = () => {
  const {
    taskName,
    elapsedTimeInSeconds,
    isRunning,
    isPaused,
    shouldShowTimer,
    isTimerActive,
    handleStartNewTask,
    handleTaskPress,
    pauseTimer,
    resumeTimer,
    stopTimer
  } = useTimerPlayer();
  
  return (
    <TimerPlayer 
      isVisible={true}
      activeTimer={isTimerActive}
      taskName={taskName}
      elapsedTime={elapsedTimeInSeconds}
      isRunning={isRunning}
      onPause={pauseTimer}
      onResume={resumeTimer}
      onStop={stopTimer}
      onTaskPress={handleTaskPress}
      onStartNewTask={handleStartNewTask}
    />
  );
};

// Main content with all context-dependent components
const AppContent = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const pathname = usePathname();
  
  // Type for the navigation paths
  type NavPath = "/home" | "/projects" | "/calendar" | "/analytics";

  // Use the createFeatures hook to manage creation functionality
  const {
    isTaskFormVisible,
    isProjectFormVisible,
    showTaskForm,
    hideTaskForm,
    showProjectForm,
    hideProjectForm,
    handleAddTask,
    handleCreateProject
  } = useCreateFeatures();

  // Navigation items with properly typed icons
  const navItems = [
    {
      name: "home",
      path: "/home" as NavPath,
      title: "Home",
      icon: "home-outline" as const
    },
    {
      name: "projects",
      path: "/projects" as NavPath,
      title: "Projects",
      icon: "folder-outline" as const
    },
    {
      name: "calendar",
      path: "/calendar" as NavPath,
      title: "Calendar",
      icon: "calendar-outline" as const
    },
    {
      name: "analytics",
      path: "/analytics" as NavPath,
      title: "Analytics",
      icon: "bar-chart-outline" as const
    }
  ];

  return (
    <View className="flex-1">
      {/* Add GlobalErrorHandler here for app-wide error handling */}
      <GlobalErrorHandler />

      {/* Main content area */}
      <View className="flex-1">

        {/* Top Buffer */}
        <View className={`h-[4rem] bg-[#1F2937]`}/>

        <Slot />

        {/* Timer Player positioned above the custom nav bar */}
        <View className="">
          <TimerPlayerContainer />
        </View>
        
        {/* Global Create Button - adjusted bottom to account for TimerPlayer */}
        <GlobalCreateButton
          onCreateTask={showTaskForm}
          onCreateProject={showProjectForm}
        />
        
        {/* Task Creation Sheet */}
        <TaskFormSheet
          isVisible={isTaskFormVisible}
          onClose={hideTaskForm}
          onAddTask={handleAddTask}
        />
        
        {/* Project Creation Sheet */}
        <CreateProjectSheet
          isVisible={isProjectFormVisible}
          onClose={hideProjectForm}
          onCreateProject={handleCreateProject}
        />
      </View>
      
      {/* Custom Navigation Bar */}
      <View className={`flex-row justify-around items-center py-3 border-t ${
        isDark ? "bg-[#1F2937] border-gray-700" : "bg-white border-gray-200"
      }`}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.name}
            onPress={() => {
              log('Tab pressed: ' + item.title, 'Navigation', 'TabNavigation', 'INFO');
              router.replace(item.path);
            }}
            className="items-center px-3 py-1"
          >
            <Ionicons
              name={item.icon}
              size={24}
              color={
                pathname === item.path
                  ? (isDark ? "#ffffff" : "#6366F1") 
                  : (isDark ? "#888888" : "#9CA3AF")
              }
            />
            <Text
              className={`text-xs mt-1 ${
                pathname === item.path
                  ? (isDark ? "text-white" : "text-indigo-500")
                  : (isDark ? "text-gray-400" : "text-gray-500")
              }`}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Bottom Buffer */}
      <View className={`h-[1rem] bg-[#1F2937]`}/>
    </View>
  );
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView className="flex-1">
      <AppProvider>
        <AppContent />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
