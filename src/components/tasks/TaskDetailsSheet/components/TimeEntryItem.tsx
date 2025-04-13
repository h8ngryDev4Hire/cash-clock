import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimeEntryItemProps } from '../TaskDetailsSheet';
import { formatDuration, formatRelativeTime, formatTimeStamp } from '@lib/util/time/timeFormatters';

/**
 * Component for displaying a single time entry
 */
const TimeEntryItem: React.FC<TimeEntryItemProps> = ({ 
  entry, 
  isDark, 
  isLast 
}) => {
  return (
    <View 
      className={`py-3 ${!isLast ? `border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}` : ''}`}
    >
      <View className="flex-row justify-between items-start mb-1">
        <View className="flex-row items-center">
          <Ionicons 
            name={entry.isRunning ? "play-circle-outline" : "checkmark-circle-outline"} 
            size={18} 
            color={entry.isRunning ? 
              (isDark ? '#10b981' : '#059669') : 
              (isDark ? '#9CA3AF' : '#6B7280')
            } 
            style={{marginRight: 6}}
          />
          <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {formatDuration(entry.timeSpent || 0)}
          </Text>
        </View>
        <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {entry.timeStarted ? formatRelativeTime(entry.timeStarted * 1000) : 'Unknown start time'}
        </Text>
      </View>
      
      <View className="ml-6">
        <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Started: {formatTimeStamp(entry.timeStarted)}
        </Text>
        {entry.timeEnded && (
          <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Ended: {formatTimeStamp(entry.timeEnded)}
          </Text>
        )}
      </View>
    </View>
  );
};

export default TimeEntryItem; 