import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, useColorScheme, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useTask from '@hooks/useTask';
import { formatDuration } from '@services/timer/time';

/**
 * TaskEditor component for viewing and editing task details
 */
export default function TaskEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { getTaskWithTime, updateTask, deleteTask, isLoading, error } = useTask();
  
  const [taskName, setTaskName] = useState('');
  const [totalTime, setTotalTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Load task data
  useEffect(() => {
    const fetchTask = async () => {
      if (id) {
        const taskData = await getTaskWithTime(id);
        if (taskData) {
          // Only update name if not currently editing
          if (!isEditing) {
            setTaskName(taskData.name);
          }
          setTotalTime(taskData.totalTime);
        }
      }
    };
    
    fetchTask();
  }, [id, getTaskWithTime, isEditing]);
  
  // Handle saving task name
  const handleSave = async () => {
    if (!id || taskName.trim() === '') return;
    
    console.log('[TaskEditor] Saving task name:', taskName.trim(), 'for task ID:', id);
    setIsSaving(true);
    try {
      await updateTask(id, { name: taskName.trim() });
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle delete task
  const handleDeleteTask = () => {
    console.log('[TaskEditor] Delete button pressed for task:', id);
    Alert.alert(
      "Delete Task",
      `Are you sure you want to delete "${taskName}"?`,
      [
        {
          text: "Cancel",
          onPress: () => console.log('[TaskEditor] Delete cancelled for task:', id),
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            console.log('[TaskEditor] Delete confirmed for task:', id);
            try {
              await deleteTask(id);
              console.log('[TaskEditor] Task deleted successfully:', id);
              router.back();
            } catch (error) {
              console.error('[TaskEditor] Error deleting task:', error);
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
  return (
    <ScrollView 
      className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {/* Header with back button */}
      <View className={`flex-row items-center justify-between p-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <TouchableOpacity 
          onPress={() => {
            console.log('[TaskEditor] Back button pressed, returning to previous screen');
            router.back();
          }}
          className="p-2"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the previous screen"
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? '#ffffff' : '#000000'} />
        </TouchableOpacity>
        
        <Text className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          Task Details
        </Text>
        
        <TouchableOpacity 
          onPress={handleDeleteTask}
          className="p-2"
          accessibilityLabel="Delete task"
          accessibilityHint="Permanently delete this task"
        >
          <Ionicons name="trash-outline" size={22} color={isDark ? '#ef4444' : '#dc2626'} />
        </TouchableOpacity>
      </View>
      
      {/* Main content */}
      <View className="p-4">
        {isLoading ? (
          <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#6366F1'} />
        ) : error ? (
          <View className="items-center p-4">
            <Text className={`text-red-500 mb-2`}>Error loading task</Text>
            <TouchableOpacity 
              onPress={() => {
                console.log('[TaskEditor] Error view back button pressed');
                router.back();
              }}
              className="p-2 bg-red-500 rounded-md"
            >
              <Text className="text-white">Go Back</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Task name section */}
            <View className={`p-4 mb-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                Task Name
              </Text>
              
              {isEditing ? (
                <View className="mb-2">
                  <TextInput
                    value={taskName}
                    onChangeText={(text) => {
                      console.log('[TaskEditor] Task name edited:', text);
                      setTaskName(text);
                    }}
                    className={`p-2 border rounded-md ${isDark ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-300 bg-gray-50 text-gray-800'}`}
                    placeholder="Task name"
                    placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
                    autoFocus
                  />
                  
                  <View className="flex-row justify-end mt-2">
                    <TouchableOpacity 
                      onPress={() => {
                        console.log('[TaskEditor] Edit cancelled, reverting to original task name');
                        setIsEditing(false);
                      }}
                      className="px-3 py-1 mr-2 rounded-md"
                    >
                      <Text className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={handleSave}
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
                    onPress={() => {
                      console.log('[TaskEditor] Edit button pressed for task name:', taskName);
                      setIsEditing(true);
                    }}
                    className="p-2"
                    accessibilityLabel="Edit task name"
                    accessibilityHint="Allows you to edit the task name"
                  >
                    <Ionicons name="pencil-outline" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            {/* Task stats section */}
            <View className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
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
          </>
        )}
      </View>
    </ScrollView>
  );
} 