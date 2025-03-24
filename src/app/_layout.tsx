import { Slot, useRouter, usePathname } from "expo-router";
import { useColorScheme, View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppProvider } from "../context/AppContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import TimerPlayer from "../components/timer/TimerPlayer";
import { TimerProvider } from "../context/TimerContext";
import { useTimer } from "../hooks/useTimer";
import { useStorage } from "../hooks/useStorage";
import { TaskSchema } from "../types/entities";
import "../../global.css"
import { millisecondsToSeconds } from "../services/timer/time";

// Wrapper component for the timer player to access the timer context
const TimerPlayerContainer = () => {
  const { isRunning, isPaused, elapsedTime, taskId, formattedTime, startTimer, pauseTimer, resumeTimer, stopTimer } = useTimer();
  const { tasks } = useStorage();
  const router = useRouter();
  
  // Get task name from storage using taskId
  const task = taskId ? tasks.getById(taskId) : undefined;
  const taskName = task?.name || "Unnamed Task";
  
  // Convert milliseconds to seconds for the TimerPlayer component
  const elapsedTimeInSeconds = millisecondsToSeconds(elapsedTime);
  
  // Handle starting a new task
  const handleStartNewTask = (taskName: string) => {
    if (taskName.trim()) {
      // Create a new task and start the timer for it
      tasks.create({ name: taskName.trim(), isRunning: true, isGrouped: false, isCompleted: false, projectId: null })
        .then((newTask: TaskSchema) => {
          startTimer(newTask.itemId);
        })
        .catch((error: Error) => {
          console.error("Failed to create task:", error);
        });
    }
  };
  
  // Handle task press to navigate to task details
  const handleTaskPress = () => {
    if (taskId) {
      // Navigate to the task details screen
      // TODO: Implement task details screen
      console.log("Navigate to task details:", taskId);
    }
  };
  
  return (
    <TimerPlayer 
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
        <TimerProvider>
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
        </TimerProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
