import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskItemProps } from '@def/components';
import { log } from '@lib/util/debugging/logging';

/**
 * Component to display a selectable task item
 */
const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  isSelected, 
  onSelect, 
  isDark 
}) => {
  return (
    <TouchableOpacity
      className={`flex-row items-center p-3 mb-2 rounded-lg border ${
        isSelected 
          ? isDark ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200' 
          : isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}
      onPress={() => {
        log(`Selecting task: ${task.id} - ${task.title}`, 'TaskItem', 'onPress', 'INFO');
        onSelect(task.id);
      }}
    >
      <View className={`w-5 h-5 rounded-full border items-center justify-center mr-3 ${
        isSelected 
          ? isDark ? 'bg-blue-600 border-blue-500' : 'bg-blue-500 border-blue-400' 
          : isDark ? 'border-gray-600' : 'border-gray-400'
      }`}>
        {isSelected && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
      </View>
      <Text 
        className={`flex-1 ${task.isCompleted ? 'line-through ' : ''}${isDark ? 'text-white' : 'text-gray-800'}`}
        numberOfLines={2}
      >
        {task.title}
      </Text>
      {task.isCompleted && (
        <View className="ml-2 px-2 py-1 rounded-full bg-green-100">
          <Text className="text-xs text-green-800">Completed</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default TaskItem; 