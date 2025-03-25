import { Slot, useRouter, usePathname } from "expo-router";
import { useColorScheme, View, TouchableOpacity, Text } from "react-native";
import React, { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { AppProvider } from "@context/AppContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import TimerPlayer from "@components/timer/TimerPlayer";
import { useTimer } from "@hooks/useTimer";
import useTask from "@hooks/useTask";
import "../../global.css"
import { millisecondsToSeconds } from "@services/timer/time";

// Wrapper component for the timer player to access the timer context
const TimerPlayerContainer = () => {
  const { isRunning, isPaused, elapsedTime, taskId, formattedTime, startTimer, pauseTimer, resumeTimer, stopTimer } = useTimer();
  const { createTask, getTaskWithTime } = useTask();
  const router = useRouter();
  const pathname = usePathname();
  const [taskName, setTaskName] = useState("Unnamed Task");
  
  // Determine if timer should be visible
  const isTimerActive = isRunning || isPaused;
  const isHomeView = pathname === "/home" || pathname === "/";
  const shouldShowTimer = isTimerActive || isHomeView;
  
  // Get task name when taskId changes
  useEffect(() => {
    const fetchTaskName = async () => {
      if (taskId) {
        const taskData = await getTaskWithTime(taskId);
        if (taskData) {
          setTaskName(taskData.name);
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
        // Create a new task and start the timer for it
        const newTask = await createTask(name.trim());
        startTimer(newTask.id);
      } catch (error) {
        console.error("Failed to create task:", error);
      }
    }
  };
  
  // Handle task press to navigate to task details
  const handleTaskPress = () => {
    if (taskId) {
      // Navigate to the task details screen
      router.push(`/task/${taskId}`);
    }
  };
  
  return (
    <TimerPlayer 
      isVisible={shouldShowTimer}
      activeTimer={isRunning || isPaused}
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

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const pathname = usePathname();

  // Type for the navigation paths
  type NavPath = "/home" | "/projects" | "/calendar" | "/analytics";

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
    <GestureHandlerRootView className="flex-1">
      <AppProvider>
        <View className="flex-1">

          {/* Main content area */}
          <View className="flex-1">

            {/* Top Buffer */}
            <View className={`h-[4rem] bg-[#1F2937]`}/>

            <Slot />

            {/* Timer Player positioned above the custom nav bar */}
            <View className="">
              <TimerPlayerContainer />
            </View>
          </View>
          
          {/* Custom Navigation Bar */}
          <View className={`flex-row justify-around items-center py-3 border-t ${
            isDark ? "bg-[#1F2937] border-gray-700" : "bg-white border-gray-200"
          }`}>
            {navItems.map((item) => (
              <TouchableOpacity
                key={item.name}
                onPress={() => {
                  console.log('[Navigation] Tab pressed:', item.title);
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
      </AppProvider>
    </GestureHandlerRootView>
  );
}
