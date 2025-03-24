import React from "react";
import {
  View,
  Text,
  useColorScheme,
  ScrollView,
  Dimensions,
} from "react-native";

// Mock data for visualization
const taskData = [
  { name: "Design UI Mockups", timeSpent: 7200, color: "#6366F1" }, // 2 hours
  { name: "Code Timer Functionality", timeSpent: 10800, color: "#F59E0B" }, // 3 hours
  { name: "Fix Navigation Issue", timeSpent: 3600, color: "#10B981" }, // 1 hour
  { name: "Research SQLite", timeSpent: 5400, color: "#EF4444" }, // 1.5 hours
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dailyHours = [2.5, 4, 3.5, 5, 6, 2, 0];

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  
  const totalSeconds = taskData.reduce((sum, task) => sum + task.timeSpent, 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);
  
  // Calculate bar heights for daily chart
  const maxHours = Math.max(...dailyHours);
  const getBarHeight = (hours: number) => (hours / maxHours) * 150;

  return (
    <ScrollView className={`flex-1 p-5 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <View className={`mb-6`}>
        <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Weekly Summary
        </Text>
        <View className={`bg-indigo-500 rounded-xl p-4 items-center`}>
          <Text className={`text-3xl font-bold text-white mb-1`}>
            {totalHours}h
          </Text>
          <Text className={`text-sm text-indigo-100`}>
            Total time tracked
          </Text>
        </View>
      </View>

      {/* Time allocation by task */}
      <View className={`mb-6`}>
        <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Time Allocation
        </Text>
        <View className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 shadow-sm`}>
          {taskData.map((task, index) => {
            const percentage = Math.round((task.timeSpent / totalSeconds) * 100);
            return (
              <View key={index} className={`flex-row justify-between items-center py-2 border-b border-gray-200`}>
                <View className={`flex-row items-center`}>
                  <View 
                    className={`w-3 h-3 rounded-full mr-2`}
                    style={{ backgroundColor: task.color }} 
                  />
                  <Text className={`text-sm ${isDark ? 'text-gray-100' : 'text-gray-700'}`}>
                    {task.name}
                  </Text>
                </View>
                <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {percentage}%
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Daily activity chart */}
      <View className={`mb-6`}>
        <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Daily Activity
        </Text>
        <View className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 shadow-sm`}>
          <View className={`flex-row justify-between items-end h-[200px]`}>
            {weekDays.map((day, index) => (
              <View key={index} className={`items-center flex-1`}>
                <View 
                  className={`w-5 rounded-full ${dailyHours[index] > 0 ? 'bg-indigo-500' : 'bg-gray-200'}`}
                  style={{ height: getBarHeight(dailyHours[index]) }} 
                />
                <Text className={`mt-2 text-xs ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                  {day}
                </Text>
                <Text className={`text-[10px] mt-1 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                  {dailyHours[index]}h
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
