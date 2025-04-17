import React from "react";
import { View, TouchableOpacity, Text, useColorScheme } from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { log } from "@lib/util/debugging/logging";

type NavPath = "/home" | "/projects" | "/calendar" | "/analytics";

type NavItem = {
  name: string;
  path: NavPath;
  title: string;
  icon: "home-outline" | "folder-outline" | "calendar-outline" | "bar-chart-outline";
};

const navItems: NavItem[] = [
  {
    name: "home",
    path: "/home",
    title: "Home",
    icon: "home-outline"
  },
  {
    name: "projects",
    path: "/projects",
    title: "Projects",
    icon: "folder-outline"
  },
  {
    name: "calendar",
    path: "/calendar",
    title: "Calendar",
    icon: "calendar-outline"
  },
  {
    name: "analytics",
    path: "/analytics",
    title: "Analytics",
    icon: "bar-chart-outline"
  }
];

/**
 * BottomNavBar component provides the main navigation for the app
 */
export const BottomNavBar: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const router = useRouter();
  const pathname = usePathname();

  return (
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
  );
};

export default BottomNavBar; 