import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppProvider } from "../context/AppContext";
import "../global.css"

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <AppProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: isDark ? "#ffffff" : "#6366F1",
          tabBarInactiveTintColor: isDark ? "#888888" : "#9CA3AF",
          tabBarStyle: {
            backgroundColor: isDark ? "#1F2937" : "#ffffff",
          },
          headerStyle: {
            backgroundColor: isDark ? "#1F2937" : "#ffffff",
          },
          headerTintColor: isDark ? "#ffffff" : "#000000",
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Timer",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="timer-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: "Tasks",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="analytics"
          options={{
            title: "Analytics",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bar-chart-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </AppProvider>
  );
}
