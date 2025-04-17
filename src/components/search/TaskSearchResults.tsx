import React from 'react';
import { View, Text, FlatList, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TaskItem {
  id: string;
  name: string;
  projectId?: string;
  projectName?: string;
  projectColor?: string;
}

interface TaskSearchResultsProps {
  searchText: string;
  results: TaskItem[];
  isLoading: boolean;
  onTaskSelect: (taskId: string) => void;
  onClose: () => void;
}

/**
 * Component to display task search results above the TimerPlayer
 */
const TaskSearchResults: React.FC<TaskSearchResultsProps> = ({
  searchText,
  results,
  isLoading,
  onTaskSelect,
  onClose
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Don't show anything for empty searches
  if (!searchText.trim()) return null;
  
  // Don't show anything if there are no results and not loading
  if (results.length === 0 && !isLoading) return null;

  return (
    <View 
      className={`absolute bottom-[54px] left-0 right-0 max-h-80 shadow-lg rounded-t-lg ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}
      style={{ 
        borderTopWidth: 1, 
        borderColor: isDark ? '#374151' : '#E5E7EB',
        zIndex: 100, // Higher than GlobalCreateButton's z-index of 51
        elevation: 10 // For Android
      }}
    >
      <View className="flex-row items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <Text className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Search Results
        </Text>
        <TouchableOpacity onPress={onClose} className="p-1">
          <Ionicons name="close" size={22} color={isDark ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="p-4 items-center">
          <ActivityIndicator size="small" color={isDark ? '#60A5FA' : '#3B82F6'} />
          <Text className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Searching tasks...
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity 
              className={`p-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
              onPress={() => {
                onTaskSelect(item.id);
                onClose(); // Close the search results when a task is selected
              }}
            >
              <Text className={`text-base ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {item.name}
              </Text>
              {item.projectName && (
                <View className="flex-row items-center mt-1">
                  {item.projectColor && (
                    <View 
                      className="w-2 h-2 rounded-full mr-1"
                      style={{ backgroundColor: item.projectColor }}
                    />
                  )}
                  <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {item.projectName}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          style={{ maxHeight: 300 }}
        />
      )}
    </View>
  );
};

export default TaskSearchResults; 