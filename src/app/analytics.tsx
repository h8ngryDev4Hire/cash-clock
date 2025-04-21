import React from "react";
import {
  View,
  Text,
  useColorScheme,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';

// Mock data for visualization
const taskData = [
  { name: "Design UI Mockups", timeSpent: 7200, color: "#6366F1" }, // 2 hours
  { name: "Code Timer Functionality", timeSpent: 10800, color: "#F59E0B" }, // 3 hours
  { name: "Fix Navigation Issue", timeSpent: 3600, color: "#10B981" }, // 1 hour
  { name: "Research SQLite", timeSpent: 5400, color: "#EF4444" }, // 1.5 hours
];

// Mock data for smart grouping
const taskGroups = [
  { 
    name: "Development", 
    tasks: ["Code Timer Functionality", "Fix Navigation Issue"], 
    totalTime: 14400, // 4 hours
    color: "#6366F1" 
  },
  { 
    name: "Design", 
    tasks: ["Design UI Mockups"], 
    totalTime: 7200, // 2 hours
    color: "#F59E0B" 
  },
  { 
    name: "Research", 
    tasks: ["Research SQLite"], 
    totalTime: 5400, // 1.5 hours
    color: "#EF4444" 
  },
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dailyHours = [2.5, 4, 3.5, 5, 6, 2, 0];

// Mock data for heatmap
const heatmapData = [
  [0, 1, 2, 3, 2, 1, 0], // 9am
  [1, 2, 3, 2, 3, 0, 0], // 10am
  [2, 3, 1, 2, 1, 0, 0], // 11am
  [3, 2, 2, 1, 2, 1, 0], // 12pm
  [1, 1, 3, 3, 2, 0, 0], // 1pm
  [2, 1, 2, 2, 1, 0, 0], // 2pm
];

const timeSlots = ["9am", "10am", "11am", "12pm", "1pm", "2pm"];

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const windowWidth = Dimensions.get('window').width;
  const blockPadding = 8;
  const gridGap = 12;
  
  // Calculate sizes for different block types
  const fullWidth = windowWidth - 32; // Full width minus container padding
  const halfWidth = (fullWidth - gridGap) / 2;
  const thirdWidth = (fullWidth - gridGap * 2) / 3;
  
  const totalSeconds = taskData.reduce((sum, task) => sum + task.timeSpent, 0);
  const totalHours = (totalSeconds / 3600).toFixed(1);
  
  // Calculate bar heights for daily chart
  const maxHours = Math.max(...dailyHours);
  const getBarHeight = (hours: number) => (hours / maxHours) * 150;

  // Get color intensity for heatmap
  const getHeatmapColor = (value: number) => {
    switch(value) {
      case 0: return isDark ? '#374151' : '#F3F4F6';
      case 1: return '#93C5FD';
      case 2: return '#60A5FA';
      case 3: return '#3B82F6';
      default: return '#F3F4F6';
    }
  };

  const blockStyle = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderRadius: 16,
    overflow: 'hidden',
  };

  return (
    <ScrollView className={`flex-1 px-4 pt-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      {/* Top action bar with date filter */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Analytics
        </Text>
        <TouchableOpacity 
          className={`flex-row items-center py-2 px-3 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
        >
          <Text className={`mr-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Last 7 days</Text>
          <Ionicons name="chevron-down" size={16} color={isDark ? '#9CA3AF' : '#4B5563'} />
        </TouchableOpacity>
      </View>

      {/* Grid layout */}
      <View className="flex-row flex-wrap" style={{ gap: gridGap }}>
        {/* Weekly Summary - Small square */}
        <View 
          style={{ width: halfWidth, ...blockStyle } as any} 
          className={`${isDark ? 'bg-indigo-500' : 'bg-indigo-500'} p-4 items-center justify-center mb-3 aspect-square`}
        >
          <Text className={`text-sm text-indigo-100 mb-1`}>
            Weekly Total
          </Text>
          <Text className={`text-4xl font-bold text-white`}>
            {totalHours}h
          </Text>
        </View>

        {/* Productivity Insights - Small square */}
        <View 
          style={{ width: halfWidth, ...blockStyle } as any} 
          className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 mb-3 aspect-square`}
        >
          <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Productivity
          </Text>
          <View className="flex-1 items-center justify-center">
            <View className="items-center mb-3">
              <Text className="text-xs text-blue-600 mb-1">Most Productive</Text>
              <Text className="text-2xl font-bold text-blue-800">Wed</Text>
              <Text className="text-xs text-blue-600">5.5h tracked</Text>
            </View>
            <View className="items-center">
              <Text className="text-xs text-amber-600 mb-1">Peak Hours</Text>
              <Text className="text-2xl font-bold text-amber-800">10-12am</Text>
            </View>
          </View>
        </View>

        {/* Time allocation - Horizontal rectangle */}
        <View 
          style={{ width: fullWidth, ...blockStyle } as any} 
          className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 mb-3`}
        >
          <View className="flex-row justify-between items-center mb-3">
            <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Time Allocation
            </Text>
            <TouchableOpacity>
              <Text className={`text-xs ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>View Report</Text>
            </TouchableOpacity>
          </View>
          {taskData.map((task, index) => {
            const percentage = Math.round((task.timeSpent / totalSeconds) * 100);
            return (
              <View key={index} className={`mb-3 ${index !== taskData.length - 1 ? 'border-b border-gray-200 pb-2' : ''}`}>
                <View className="flex-row justify-between items-center">
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
                {/* Progress bar */}
                <View className="h-2 bg-gray-200 rounded-full mt-2 overflow-hidden">
                  <View 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: task.color 
                    }} 
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Daily activity chart - Horizontal rectangle */}
        <View 
          style={{ width: fullWidth, ...blockStyle, height: 250 } as any} 
          className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 mb-3`}
        >
          <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Daily Activity
          </Text>
          <View className={`flex-row justify-between items-end flex-1`}>
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

        {/* Time Heatmap - Large square */}
        <View 
          style={{ width: halfWidth, ...blockStyle, aspectRatio: 1 } as any} 
          className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 mb-3`}
        >
          <Text className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Time Heatmap
          </Text>
          <View className="flex-1">
            <View className="flex-1">
              {heatmapData.map((row, rowIndex) => (
                <View key={rowIndex} className="flex-row mb-1 flex-1">
                  <Text className={`w-8 text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {timeSlots[rowIndex]}
                  </Text>
                  <View className="flex-row flex-1">
                    {row.map((value, colIndex) => (
                      <View 
                        key={colIndex} 
                        className="flex-1 aspect-square rounded-sm mx-0.5"
                        style={{ backgroundColor: getHeatmapColor(value) }}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
            <View className="flex-row justify-center mt-1">
              {weekDays.map((day, index) => (
                <Text key={index} className={`text-[8px] flex-1 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {day.charAt(0)}
                </Text>
              ))}
            </View>
          </View>
        </View>

        {/* Smart Grouping - Large square */}
        <View 
          style={{ width: halfWidth, ...blockStyle, aspectRatio: 1 } as any} 
          className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 mb-3`}
        >
          <View className="flex-row justify-between items-center mb-3">
            <Text className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Smart Groups
            </Text>
            <View className="bg-indigo-100 rounded-full px-2">
              <Text className="text-[8px] text-indigo-700">AI</Text>
            </View>
          </View>
          <View className="flex-1">
            {taskGroups.map((group, index) => (
              <View key={index} className={`mb-2 ${index !== taskGroups.length - 1 ? 'border-b border-gray-200 pb-2' : ''}`}>
                <View className="flex-row justify-between items-center mb-1">
                  <View className="flex-row items-center">
                    <View 
                      className="w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: group.color }} 
                    />
                    <Text className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {group.name}
                    </Text>
                  </View>
                  <Text className={`text-[10px] ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {(group.totalTime / 3600).toFixed(1)}h
                  </Text>
                </View>
                <View className="ml-3">
                  {group.tasks.map((task, taskIndex) => (
                    <Text key={taskIndex} className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      • {task}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Weekly Insight - Small rectangle */}
        <View 
          style={{ width: fullWidth, ...blockStyle } as any} 
          className={`${isDark ? 'bg-gray-700' : 'bg-indigo-50'} p-4 mb-3`}
        >
          <Text className={`text-sm ${isDark ? 'text-white' : 'text-indigo-900'} font-medium mb-1`}>Weekly Insight</Text>
          <Text className={`text-xs ${isDark ? 'text-gray-300' : 'text-indigo-700'}`}>
            You spent 40% more time on Development tasks compared to last week. Consider balancing with more Design tasks.
          </Text>
        </View>

        {/* Task Timeline - Vertical rectangle */}
        <View 
          style={{ width: fullWidth, ...blockStyle } as any} 
          className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 mb-3`}
        >
          <Text className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Task Timeline
          </Text>
          {/* Timeline with dots */}
          <View className="relative">
            <View className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300" />
            
            {taskData.map((task, index) => (
              <View key={index} className="flex-row mb-4 items-start">
                <View className="w-9 h-9 rounded-full bg-indigo-100 items-center justify-center z-10">
                  <View className="w-3 h-3 rounded-full" style={{ backgroundColor: task.color }} />
                </View>
                <View className="ml-3 flex-1">
                  <View className="flex-row justify-between">
                    <Text className={`text-xs font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{task.name}</Text>
                    <Text className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-[10px]`}>
                      {(task.timeSpent / 3600).toFixed(1)}h
                    </Text>
                  </View>
                  <Text className={`text-[10px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Today • 09:30 - {index % 2 === 0 ? '11:30' : '13:00'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Reports preview - Two small squares */}
        <View 
          style={{ width: halfWidth, ...blockStyle } as any} 
          className={`${isDark ? 'bg-gray-700' : 'bg-white'} p-4 mb-3 border border-gray-200`}
        >
          <View className="w-9 h-9 rounded-full bg-green-100 items-center justify-center mb-2">
            <Ionicons name="pie-chart-outline" size={18} color="#10B981" />
          </View>
          <Text className={`font-medium mb-1 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Weekly Summary
          </Text>
          <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Last generated yesterday
          </Text>
        </View>

        <View 
          style={{ width: halfWidth, ...blockStyle } as any} 
          className={`${isDark ? 'bg-gray-700' : 'bg-white'} p-4 mb-3 border border-gray-200`}
        >
          <View className="w-9 h-9 rounded-full bg-blue-100 items-center justify-center mb-2">
            <Ionicons name="bar-chart-outline" size={18} color="#3B82F6" />
          </View>
          <Text className={`font-medium mb-1 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Monthly Report
          </Text>
          <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            April 2025
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
