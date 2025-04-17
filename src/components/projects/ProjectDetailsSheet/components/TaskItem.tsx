import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TaskItemProps {
  id: string;
  title: string;
  isCompleted: boolean;
  isDark: boolean;
}

/**
 * Component for displaying a task item
 */
const TaskItem: React.FC<TaskItemProps> = ({
  id,
  title,
  isCompleted,
  isDark
}) => {
  return (
    <View className={`flex-row items-center p-3 mb-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
      <View className={`w-5 h-5 rounded-full mr-3 items-center justify-center border ${isDark ? 'border-gray-500' : 'border-gray-300'} ${
        isCompleted ? (isDark ? 'bg-green-600' : 'bg-green-500') : 'bg-transparent'
      }`}>
        {isCompleted && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
      </View>
      <Text 
        className={`flex-1 ${isCompleted ? 'line-through ' : ''}${isDark ? 'text-white' : 'text-gray-800'}`}
        numberOfLines={2}
      >
        {title}
      </Text>
    </View>
  );
};

export default TaskItem; 