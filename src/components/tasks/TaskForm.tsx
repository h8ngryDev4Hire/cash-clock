import React, { useState } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, useColorScheme, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface TaskFormProps {
  onAddTask: (taskName: string, startTimer: boolean) => void;
  isSubmitting?: boolean;
}

/**
 * TaskForm component for creating new tasks with optional timer start
 */
const TaskForm: React.FC<TaskFormProps> = ({ 
  onAddTask, 
  isSubmitting = false 
}) => {
  const [taskName, setTaskName] = useState('');
  const [startTimerAfterCreation, setStartTimerAfterCreation] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleSubmit = () => {
    if (taskName.trim() && !isSubmitting) {
      console.log('[TaskForm] Create task button pressed:', taskName.trim(), 'startTimer:', startTimerAfterCreation);
      onAddTask(taskName.trim(), startTimerAfterCreation);
      setTaskName('');
      // Keep the form open for easy task creation
    }
  };
  
  const toggleExpanded = () => {
    console.log('[TaskForm] Toggle form expanded:', !isExpanded);
    setIsExpanded(!isExpanded);
  };

  return (
    <View className={`rounded-xl overflow-hidden mb-5 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
      {/* Form header - always visible */}
      <Pressable
        className="flex-row items-center justify-between p-4"
        onPress={toggleExpanded}
        accessibilityLabel="Toggle task form"
        accessibilityHint="Expands or collapses the task creation form"
      >
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 items-center justify-center mr-3">
            <Ionicons 
              name="add" 
              size={20} 
              color={isDark ? "#A5B4FC" : "#4F46E5"} 
            />
          </View>
          <Text className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {isExpanded ? "New Task" : "Add a task"}
          </Text>
        </View>
        <Ionicons 
          name={isExpanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={isDark ? "#D1D5DB" : "#6B7280"} 
        />
      </Pressable>

      {/* Form body - only visible when expanded */}
      {isExpanded && (
        <View className="p-4 pt-0">
          <View className={`border rounded-lg overflow-hidden mb-3 ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
            <TextInput
              className={`p-3 ${isDark ? 'text-white bg-gray-700' : 'text-gray-800 bg-gray-50'}`}
              placeholder="What would you like to work on?"
              placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
              value={taskName}
              onChangeText={setTaskName}
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
              accessibilityLabel="Task name input"
              accessibilityHint="Enter the name of your new task"
            />
          </View>

          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Ionicons 
                name="timer-outline" 
                size={20} 
                color={isDark ? "#D1D5DB" : "#6B7280"} 
                style={{ marginRight: 8 }} 
              />
              <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Start timer after creating
              </Text>
            </View>
            <Switch
              value={startTimerAfterCreation}
              onValueChange={setStartTimerAfterCreation}
              trackColor={{ false: '#d1d5db', true: '#818cf8' }}
              thumbColor={startTimerAfterCreation ? '#6366f1' : '#f4f4f5'}
              ios_backgroundColor="#d1d5db"
              accessibilityLabel="Start timer toggle"
              accessibilityHint="Toggle to start the timer immediately after task creation"
            />
          </View>

          <TouchableOpacity
            className={`rounded-lg py-3 px-4 items-center justify-center ${!taskName.trim() || isSubmitting ? 'bg-gray-400 dark:bg-gray-700' : 'bg-indigo-600'}`}
            onPress={handleSubmit}
            disabled={!taskName.trim() || isSubmitting}
            accessibilityLabel="Create task button"
            accessibilityHint="Press to create a new task"
          >
            <Text className="text-white font-medium">
              {isSubmitting ? "Creating..." : "Create Task"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default TaskForm;