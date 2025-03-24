import { Slot, useRouter, usePathname } from "expo-router";
import { useColorScheme, View, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppProvider } from "../context/AppContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import TimerPlayer from "../components/timer/TimerPlayer";
import { TimerProvider, useTimer } from "../context/TimerContext";
import "../../global.css"
import { millisecondsToSeconds } from "../services/timer/time";

// Wrapper component for the timer player to access the timer context
const TimerPlayerContainer = () => {
  const { isRunning, isPaused, elapsedTime, taskId, pauseTimer, resumeTimer, stopTimer } = useTimer();
  
  // TODO: Get task name from task service using taskId
  const taskName = taskId ? "Current Task" : "No Active Task";
  
  // Convert milliseconds to seconds for the TimerPlayer component
  const elapsedTimeInSeconds = millisecondsToSeconds(elapsedTime);
  
  return (
    <TimerPlayer 
      activeTimer={isRunning || isPaused}
      taskName={taskName}
      elapsedTime={elapsedTimeInSeconds}
      isRunning={isRunning}
      onPause={pauseTimer}
      onResume={resumeTimer}
      onStop={stopTimer}
      onStartNewTask={(taskName) => console.log('Start new task:', taskName)}
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
                  onPress={() => router.replace(item.path)}
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
