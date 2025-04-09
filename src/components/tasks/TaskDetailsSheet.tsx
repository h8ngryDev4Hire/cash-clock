import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  useColorScheme,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '../shared/BottomSheet';
import useTask from '@hooks/useTask';
import { formatDuration } from '@lib/util/time/timeFormatters';
import { log } from '@lib/util/debugging/logging';

interface TaskDetailsSheetProps {
  isVisible: boolean;
  onClose: () => void;
  taskId: string | null;
  onTaskDeleted?: () => void;
}

/**
 * Bottom sheet for viewing and editing task details
 */
const TaskDetailsSheet: React.FC<TaskDetailsSheetProps> = ({
  isVisible,
  onClose,
  taskId,
  onTaskDeleted
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { getTaskWithTime, updateTask, deleteTask, isLoading, error } = useTask();
  
  const [taskName, setTaskName] = useState('');
  const [totalTime, setTotalTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Load task data
  useEffect(() => {
    const fetchTask = async () => {
      if (taskId && isVisible) {
        try {
          const taskData = await getTaskWithTime(taskId);
          if (taskData) {
            // Only update name if not currently editing
            if (!isEditing) {
              setTaskName(taskData.name);
            }
            setTotalTime(taskData.totalTime);
          }
        } catch (err) {
          log('Failed to fetch task: ' + err, 'TaskDetailsSheet', 'fetchTask', 'ERROR', { variableName: 'err', value: err });
          setLocalError(err instanceof Error ? err.message : String(err));
        }
      }
    };
    
    fetchTask();
  }, [taskId, getTaskWithTime, isEditing, isVisible]);
  
  // Handle closing sheet and resetting state
  const handleClose = () => {
    onClose();
    // Reset editing state
    setIsEditing(false);
    // Don't reset task name and time, they'll be refreshed on next open
  };
  
  // Save task name
  const handleSave = async () => {
    if (!taskId || taskName.trim() === '') return;
    
    try {
      setIsSaving(true);
      log('Saving task name: ' + taskName.trim() + ' for task ID: ' + taskId, 'TaskDetailsSheet', 'handleSave', 'INFO');
      
      // Update task with new name
      await updateTask(taskId, { name: taskName.trim() });
      setIsEditing(false);
      setLocalError(null);
    } catch (err) {
      log('Failed to update task: ' + err, 'TaskDetailsSheet', 'handleSave', 'ERROR', { variableName: 'err', value: err });
      setLocalError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };
  
  // Delete task
  const handleDeletePress = () => {
    if (!taskId) return;
    
    log('Delete button pressed for task: ' + taskId, 'TaskDetailsSheet', 'handleDeletePress', 'INFO');
    
    // Show delete confirmation
    Alert.alert(
      "Delete Task", 
      `Are you sure you want to delete "${taskName}"?`, 
      [
        { 
          text: "Cancel", 
          onPress: () => log('Delete cancelled for task: ' + taskId, 'TaskDetailsSheet', 'handleDeleteCancel', 'INFO'),
          style: "cancel" 
        },
        { 
          text: "Delete", 
          onPress: async () => {
            log('Delete confirmed for task: ' + taskId, 'TaskDetailsSheet', 'handleDeleteConfirm', 'INFO');
            
            try {
              await deleteTask(taskId);
              log('Task deleted successfully: ' + taskId, 'TaskDetailsSheet', 'handleDeleteConfirm', 'INFO');
              handleClose();
              if (onTaskDeleted) {
                onTaskDeleted();
              }
            } catch (err) {
              log('Error deleting task: ' + err, 'TaskDetailsSheet', 'handleDeleteConfirm', 'ERROR', { variableName: 'err', value: err });
              setLocalError(err instanceof Error ? err.message : String(err));
            }
          }, 
          style: "destructive" 
        }
      ]
    );
  };
  
  // Handle name text change
  const handleTextChange = (text: string) => {
    log('Task name edited: ' + text, 'TaskDetailsSheet', 'handleTextChange', 'INFO');
    setTaskName(text);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    log('Edit cancelled, reverting to original task name', 'TaskDetailsSheet', 'handleCancelEdit', 'INFO');
    // Reset to the current task name by re-fetching it
    if (taskId) {
      getTaskWithTime(taskId).then(taskData => {
        if (taskData) {
          setTaskName(taskData.name);
        }
      });
    }
    setIsEditing(false);
  };
  
  // Start editing
  const handleEditPress = () => {
    log('Edit button pressed for task name: ' + taskName, 'TaskDetailsSheet', 'handleEditPress', 'INFO');
    setIsEditing(true);
  };
  
  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={handleClose}
      height={550}
    >
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Task Details
          </Text>
          
          <View className="flex-row">
            <TouchableOpacity 
              onPress={handleDeletePress}
              className="p-2 mr-2"
              accessibilityLabel="Delete task"
              accessibilityHint="Permanently delete this task"
            >
              <Ionicons name="trash-outline" size={22} color={isDark ? '#ef4444' : '#dc2626'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleClose}
              className="p-2"
            >
              <Ionicons 
                name="close" 
                size={24} 
                color={isDark ? '#9CA3AF' : '#6B7280'} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView className="flex-1 pr-1" showsVerticalScrollIndicator={false}>
          {localError && (
            <View className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
              <Text className="text-red-800">{localError}</Text>
            </View>
          )}
          
          {isLoading && !taskName ? (
            <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#6366F1'} />
          ) : error ? (
            <View className="items-center p-4">
              <Text className={`text-red-500 mb-2`}>Error loading task</Text>
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
                      onChangeText={handleTextChange}
                      className={`p-2 border rounded-md ${isDark ? 'border-gray-700 bg-gray-900 text-white' : 'border-gray-300 bg-gray-50 text-gray-800'}`}
                      placeholder="Task name"
                      placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
                      autoFocus
                    />
                    
                    <View className="flex-row justify-end mt-2">
                      <TouchableOpacity 
                        onPress={handleCancelEdit}
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
                      onPress={handleEditPress}
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
        </ScrollView>
      </View>
    </BottomSheet>
  );
};

export default TaskDetailsSheet; 