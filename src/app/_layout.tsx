import { Slot, useRouter, usePathname } from "expo-router";
import { useColorScheme, View, TouchableOpacity, Text } from "react-native";
import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { AppProvider } from "@context/AppContext";
import { UIProvider } from "@context/UIContext";
import { DragProvider } from "@context/DragContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import TimerPlayer from "@components/timer/TimerPlayer";
import "../../global.css"
import { GlobalErrorHandler } from "@components/ui/GlobalErrorHandler";
import DragOverlay from "@components/ui/DragOverlay";
import { log } from "@lib/util/debugging/logging";
import GlobalCreateButton from "@components/shared/GlobalCreateButton";
import TaskFormSheet from "@components/tasks/TaskFormSheet";
import CreateProjectSheet from "@components/projects/CreateProjectSheet/CreateProjectSheet";
import { useCreateFeatures } from "@hooks/useCreateFeatures";
import { useTimerPlayer } from "@hooks/useTimerPlayer";
import BottomNavBar from "@components/shared/BottomNavBar";

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
    handleSelectExistingTask,
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
      onSelectExistingTask={handleSelectExistingTask}
    />
  );
};

// Main content with all context-dependent components
const AppContent = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const pathname = usePathname();
  
  // Redirect from root path to home screen
  useEffect(() => {
    if (pathname === '/') {
      log('Redirecting from root to home screen', 'AppContent', 'useEffect', 'INFO');

      // The reason for this approach is that the user will be sitting 
      // on a not-found page for 50ms before the redirect is triggered.
      router.replace ('/home')
      // Using setTimeout to ensure navigation completes properly before component mounting
      // This helps prevent issues with data loading after programmatic navigation
      setTimeout(() => {
        router.replace('/home');
      }, 50);
    } 
  }, [pathname, router]);
  
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
      
      {/* Bottom Navigation Bar */}
      <BottomNavBar />
      
      {/* Bottom Buffer */}
      <View className={`h-[1rem] bg-[#1F2937]`}/>
    </View>
  );
};

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <UIProvider>
          <DragProvider>
            <AppContent />
            <DragOverlay showDebugInfo={__DEV__} />
          </DragProvider>
        </UIProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
