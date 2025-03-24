import React, { useState } from 'react';
import { View, Text, TextInput, Switch, TouchableOpacity, useColorScheme, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TaskFormProps {
  onAddTask: (taskName: string, startTimer: boolean) => void;
}

/**
 * TaskForm component for creating new tasks with optional timer start
 */
const TaskForm: React.FC<TaskFormProps> = ({ onAddTask }) => {
  const [taskName, setTaskName] = useState('');
  const [startTimerAfterCreation, setStartTimerAfterCreation] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleSubmit = () => {
    if (taskName.trim()) {
      onAddTask(taskName.trim(), startTimerAfterCreation);
      setTaskName('');
      // Keep the form open for easy task creation
    }
  };
  
  const toggleExpanded = () => {
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
          size={18} 
          color={isDark ? "#9CA3AF" : "#6B7280"} 
        />
      </Pressable>
      
      {/* Expanded form */}
      {isExpanded && (
        <View className="px-4 pb-4">
          <TextInput
            className={`rounded-lg px-4 py-3 text-base mb-4 ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-50'}`}
            value={taskName}
            onChangeText={setTaskName}
            placeholder="What are you working on?"
            placeholderTextColor={isDark ? "#888888" : "#9CA3AF"}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            accessibilityLabel="Task name input"
            autoFocus={true}
          />
          
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Ionicons 
                name="timer-outline" 
                size={18} 
                color={isDark ? "#9CA3AF" : "#6B7280"} 
                style={{ marginRight: 8 }}
              />
              <Text className={`text-base ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Start timer immediately
              </Text>
            </View>
            
            <Switch
              value={startTimerAfterCreation}
              onValueChange={setStartTimerAfterCreation}
              trackColor={{ false: "#ccc", true: "#4F46E5" }}
              thumbColor={startTimerAfterCreation ? "#ffffff" : "#f4f3f4"}
              accessibilityLabel="Start timer after task creation"
              accessibilityHint="Toggles whether the timer will start automatically after creating a task"
            />
          </View>
          
          {/* Project selector would go here in a real app */}
          
          <TouchableOpacity 
            className={`py-3 rounded-lg justify-center items-center ${taskName.trim() ? 'bg-indigo-600' : 'bg-gray-400'}`}
            onPress={handleSubmit}
            disabled={!taskName.trim()}
            accessibilityLabel="Create task button"
            accessibilityHint={startTimerAfterCreation ? "Creates a new task and starts the timer" : "Creates a new task"}
          >
            <Text className="text-white text-base font-medium">
              {startTimerAfterCreation ? "Create & Start Timer" : "Create Task"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default TaskForm;