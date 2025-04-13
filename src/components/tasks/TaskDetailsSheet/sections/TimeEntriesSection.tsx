import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimeEntriesSectionProps } from '../TaskDetailsSheet';
import TimeEntryItem from '../components/TimeEntryItem';

/**
 * Component for displaying time entries section
 */
const TimeEntriesSection: React.FC<TimeEntriesSectionProps> = ({ 
  timeEntries, 
  isLoadingTimeEntries, 
  isRefreshing, 
  isDark, 
  onRefresh 
}) => {
  return (
    <View className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <View className="flex-row justify-between items-center mb-3">
        <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Time Entry History
        </Text>
        
        <View className="flex-row items-center">
          {isRefreshing && (
            <ActivityIndicator size="small" color={isDark ? '#a5b4fc' : '#6366F1'} style={{ marginRight: 8 }} />
          )}
          
          <TouchableOpacity 
            onPress={onRefresh}
            className="p-1"
            accessibilityLabel="Refresh time entries"
            disabled={isRefreshing}
          >
            <Ionicons name="refresh-outline" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        </View>
      </View>
      
      {isLoadingTimeEntries ? (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color={isDark ? '#a5b4fc' : '#6366F1'} />
          <Text className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Loading time entries...
          </Text>
        </View>
      ) : timeEntries.length === 0 ? (
        <View className="py-4 items-center">
          <Text className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            No time entries yet
          </Text>
          <TouchableOpacity 
            onPress={onRefresh}
            className={`mt-2 px-3 py-1 rounded-md ${isDark ? 'bg-indigo-700' : 'bg-indigo-100'}`}
          >
            <Text className={isDark ? 'text-white' : 'text-indigo-800'}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text className={`mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Found {timeEntries.length} time {timeEntries.length === 1 ? 'entry' : 'entries'}
          </Text>
          {timeEntries.map((entry, index) => (
            <TimeEntryItem 
              key={entry.itemId} 
              entry={entry}
              isDark={isDark}
              isLast={index === timeEntries.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default TimeEntriesSection; 