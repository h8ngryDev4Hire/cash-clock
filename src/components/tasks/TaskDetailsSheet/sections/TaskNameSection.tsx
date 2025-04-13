import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TaskNameSectionProps } from '../TaskDetailsSheet';

/**
 * Component for displaying and editing task name
 */
const TaskNameSection: React.FC<TaskNameSectionProps> = ({
  taskName,
  isEditing,
  isSaving,
  isDark,
  onEdit,
  onSave,
  onCancel,
  onTextChange
}) => {
  return (
    <View className={`p-4 mb-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
        Task Name
      </Text>
      
      {isEditing ? (
        <View className="mb-2">
          <TextInput
            value={taskName}
            onChangeText={onTextChange}
            className={`p-2 border rounded-md ${isDark ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-300 bg-gray-50 text-gray-800'}`}
            placeholder="Task name"
            placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
            autoFocus
          />
          
          <View className="flex-row justify-end mt-2">
            <TouchableOpacity 
              onPress={onCancel}
              className="px-3 py-1 mr-2 rounded-md"
            >
              <Text className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={onSave}
              className={`px-3 py-1 rounded-md ${isDark ? 'bg-indigo-600' : 'bg-indigo-500'}`}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text className="text-white">Save</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View className="flex-row justify-between items-center">
          <Text className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {taskName}
          </Text>
          
          <TouchableOpacity 
            onPress={onEdit}
            className="p-2"
            accessibilityLabel="Edit task name"
            accessibilityHint="Allows you to edit the task name"
          >
            <Ionicons name="pencil-outline" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default TaskNameSection; 