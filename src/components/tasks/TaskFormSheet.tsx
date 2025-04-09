import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Switch,
  TouchableOpacity, 
  ScrollView,
  useColorScheme,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '../shared/BottomSheet';
import { useError } from '@hooks/useError';
import { ErrorLevel } from '@def/error';
import { LocalErrorMessage } from '@components/ui/LocalErrorMessage';
import { log } from '@lib/util/debugging/logging';

interface TaskFormSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onAddTask: (taskName: string, startTimer: boolean) => Promise<void>;
}

/**
 * Bottom sheet for creating a new task
 */
const TaskFormSheet: React.FC<TaskFormSheetProps> = ({
  isVisible,
  onClose,
  onAddTask
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Form state  
  const [taskName, setTaskName] = useState('');
  const [startTimerAfterCreation, setStartTimerAfterCreation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize error handling for form validation
  const { error, handleError, clearError } = useError('TaskFormSheet');

  // Reset form when sheet is closed
  const handleClose = () => {
    if (isSubmitting) return;
    
    onClose();
    // Reset form after animation completes
    setTimeout(() => {
      setTaskName('');
      setStartTimerAfterCreation(false);
      clearError();
    }, 300);
  };

  // Validate task name
  const validateTaskName = () => {
    // Clear any previous errors first
    clearError();
    
    // Validate task name
    if (!taskName.trim()) {
      throw new Error('Task name cannot be empty');
    }
    
    if (taskName.trim().length < 3) {
      throw new Error('Task name must be at least 3 characters long');
    }
    
    if (taskName.trim().length > 50) {
      throw new Error('Task name cannot exceed 50 characters');
    }
    
    return true;
  }

  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate the task name
      validateTaskName();
      
      setIsSubmitting(true);
      log('Create task button pressed: ' + taskName.trim() + ', startTimer: ' + startTimerAfterCreation, 'TaskFormSheet', 'handleSubmit', 'INFO');
      
      await onAddTask(taskName.trim(), startTimerAfterCreation);
      
      // Close sheet on success instead of keeping it open
      handleClose();
    } catch (err) {
      // Handle validation errors
      handleError(err, ErrorLevel.WARNING, { operation: 'validateTaskForm' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleTextChange = (text: string) => {
    setTaskName(text);
    // Clear error when user starts typing
    if (error) clearError();
  };

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={handleClose}
      height={450}
    >
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Create New Task
          </Text>
          <TouchableOpacity 
            onPress={handleClose}
            disabled={isSubmitting}
            className="p-2"
          >
            <Ionicons 
              name="close" 
              size={24} 
              color={isDark ? '#9CA3AF' : '#6B7280'} 
            />
          </TouchableOpacity>
        </View>
        
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Display validation error if any */}
          {error && (
            <View className="mb-4">
              <LocalErrorMessage
                error={error}
                onDismiss={() => {
                  log('Clearing validation error', 'TaskFormSheet', 'onDismiss', 'INFO');
                  clearError();
                }}
                autoDismissTimeout={7000} // Give users more time to read validation errors
              />
            </View>
          )}
          
          {/* Task name */}
          <View className="mb-4">
            <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Task Name <Text className="text-red-500">*</Text>
            </Text>
            <View className={`mb-2 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border`}>
              <TextInput
                className={`p-3 ${isDark ? 'text-white' : 'text-gray-800'}`}
                placeholder="What would you like to work on?"
                placeholderTextColor={isDark ? "#9CA3AF" : "#9CA3AF"}
                value={taskName}
                onChangeText={handleTextChange}
                returnKeyType="done"
                editable={!isSubmitting}
                maxLength={50}
                autoCapitalize="sentences"
              />
            </View>
            
            {/* Character count indicator */}
            <View className="flex-row justify-end mb-2">
              <Text className={`text-xs ${
                taskName.length < 3 ? 'text-red-400' : 
                taskName.length > 40 ? 'text-yellow-500' : 
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {taskName.length}/50 characters (min 3)
              </Text>
            </View>
          </View>
          
          {/* Start timer option */}
          <View className="mb-6">
            <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Options
            </Text>
            <View className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border`}>
              <View className="flex-row items-center justify-between">
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
                  disabled={isSubmitting}
                  accessibilityLabel="Start timer toggle"
                  accessibilityHint="Toggle to start the timer immediately after task creation"
                />
              </View>
            </View>
          </View>
        </ScrollView>
        
        {/* Create button */}
        <TouchableOpacity
          className={`py-3 rounded-lg items-center justify-center ${!taskName.trim() || isSubmitting ? 'bg-indigo-400' : 'bg-indigo-600'}`}
          onPress={handleSubmit}
          disabled={!taskName.trim() || isSubmitting}
          accessibilityLabel="Create task button"
          accessibilityHint="Press to create a new task"
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text className="text-white font-medium">Create Task</Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

export default TaskFormSheet; 