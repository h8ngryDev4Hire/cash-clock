import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Step3Props } from '@def/components';
import TaskItem from '../components/TaskItem';

/**
 * Step 3 of project creation - Add existing tasks to the project
 */
const Step3Tasks: React.FC<Step3Props> = ({
  availableTasks,
  selectedTaskIds,
  isLoadingTasks,
  isSubmitting,
  onSelectTask,
  onBack,
  onSubmit,
  isDark
}) => {
  return (
    <>
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Add Tasks (Optional)
        </Text>
        <Text className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Select tasks to add to this project. You can also add tasks later.
        </Text>
        
        {isLoadingTasks ? (
          <View className="py-6 items-center">
            <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#6366F1'} />
            <Text className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading tasks...</Text>
          </View>
        ) : availableTasks.length === 0 ? (
          <View className={`p-4 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border items-center justify-center`}>
            <Ionicons name="checkbox-outline" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text className={`mt-2 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No unassigned tasks available. Create tasks first, then assign them to projects.
            </Text>
          </View>
        ) : (
          <View className="max-h-[300px]">
            <FlatList
              data={availableTasks}
              keyExtractor={(item) => item.id || `task-${Math.random().toString(36).substring(2)}`}
              renderItem={({ item }) => (
                <TaskItem
                  task={item}
                  isSelected={selectedTaskIds.includes(item.id)}
                  onSelect={onSelectTask}
                  isDark={isDark}
                />
              )}
              style={{ maxHeight: 300 }}
              extraData={selectedTaskIds}
            />
            
            <View className="mt-2">
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {selectedTaskIds.length} task{selectedTaskIds.length !== 1 ? 's' : ''} selected
              </Text>
            </View>
          </View>
        )}
      </View>
      
      {/* Navigation buttons */}
      <View className="flex-row space-x-3 mt-auto">
        <TouchableOpacity
          className="flex-1 py-3 rounded-lg items-center justify-center bg-gray-200 dark:bg-gray-700"
          onPress={onBack}
          disabled={isSubmitting}
        >
          <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className={`flex-1 py-3 rounded-lg items-center justify-center ${isSubmitting ? 'bg-blue-400' : 'bg-blue-500'}`}
          onPress={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text className="text-white font-medium">Create Project</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
};

export default Step3Tasks; 