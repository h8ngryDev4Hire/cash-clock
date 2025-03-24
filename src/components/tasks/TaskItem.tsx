import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../../types/definitions';

interface TaskItemProps {
  task: Task;
  onPress?: (taskId: string) => void;
  onPlayPress: (taskId: string) => void;
}

/**
 * TaskItem component displays an individual task with enhanced UI
 */
const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onPress,
  onPlayPress 
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Format duration as hours and minutes
  const formatTime = (seconds: number): string => {
    if (seconds === 0) return 'Not started';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0 && minutes === 0) {
      return 'Just started';
    }
    
    if (hours === 0) {
      return `${minutes}m`;
    }
    
    if (minutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };
  
  // Format timestamp as relative time
  const formatRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    // Less than a minute
    if (diff < 60000) {
      return 'Just now';
    }
    
    // Less than an hour
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m ago`;
    }
    
    // Less than a day
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}h ago`;
    }
    
    // Less than a week
    if (diff < 604800000) {
      const days = Math.floor(diff / 86400000);
      return `${days}d ago`;
    }
    
    // Format as date
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  // Generate a color based on task name (for demo purposes)
  const getTaskColor = (name: string): string => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
      'bg-lime-500', 'bg-fuchsia-500', 'bg-emerald-500'
    ];
    
    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash + name.charCodeAt(i)) % colors.length;
    }
    
    return colors[hash];
  };

  return (
    <TouchableOpacity 
      className={`p-3 rounded-xl mb-3 mx-1 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm border border-gray-100'}`}
      onPress={() => onPress?.(task.id)}
      accessibilityLabel={`Task: ${task.name}`}
      accessibilityHint="Tap to view task details"
    >
      <View className="flex-row items-center mb-2">
        {/* Task color indicator */}
        <View className={`w-3 h-3 rounded-full mr-2 ${getTaskColor(task.name)}`} />
        
        <Text className={`text-base font-medium flex-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {task.name}
        </Text>
        
        {/* Last updated timestamp */}
        <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {formatRelativeTime(task.updatedAt)}
        </Text>
      </View>
      
      <View className="flex-row items-center justify-between">
        {/* Total time */}
        <View className="flex-row items-center">
          <Ionicons 
            name="time-outline" 
            size={14} 
            color={isDark ? "#9CA3AF" : "#6B7280"} 
            style={{ marginRight: 4 }}
          />
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {formatTime(task.totalTime)}
          </Text>
        </View>
        
        {/* Project indicator - would be dynamic in a real app */}
        {task.projectId && (
          <View className="flex-row items-center">
            <Ionicons 
              name="folder-outline" 
              size={14} 
              color={isDark ? "#9CA3AF" : "#6B7280"} 
              style={{ marginRight: 4 }}
            />
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Project
            </Text>
          </View>
        )}
        
        {/* Play button */}
        <TouchableOpacity 
          className={`h-8 px-3 rounded-full flex-row items-center ${isDark ? 'bg-indigo-900' : 'bg-indigo-50'}`}
          onPress={() => onPlayPress(task.id)}
          accessibilityLabel={`Start ${task.name}`}
          accessibilityHint="Start timer for this task"
        >
          <Ionicons 
            name="play" 
            size={14} 
            color={isDark ? "#A5B4FC" : "#4F46E5"} 
            style={{ marginRight: 4 }}
          />
          <Text className={`text-sm font-medium ${isDark ? 'text-indigo-200' : 'text-indigo-700'}`}>
            Start
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default TaskItem;