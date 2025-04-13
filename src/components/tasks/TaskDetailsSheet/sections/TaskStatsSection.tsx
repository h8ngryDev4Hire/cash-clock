import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskStatsSectionProps } from '../TaskDetailsSheet';
import { formatDuration } from '@lib/util/time/timeFormatters';

/**
 * Component for displaying task statistics
 */
const TaskStatsSection: React.FC<TaskStatsSectionProps> = ({ totalTime, isDark }) => {
  return (
    <View className={`p-4 mb-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-3`}>
        Time Stats
      </Text>
      
      <View className="flex-row items-center mb-2">
        <View className={`w-10 h-10 rounded-full ${isDark ? 'bg-indigo-900' : 'bg-indigo-100'} items-center justify-center mr-3`}>
          <Ionicons name="time-outline" size={20} color={isDark ? '#a5b4fc' : '#6366F1'} />
        </View>
        
        <View>
          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Total Time
          </Text>
          <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {formatDuration(totalTime)}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default TaskStatsSection; 