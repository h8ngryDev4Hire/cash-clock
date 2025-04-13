import React, { useState, useEffect, useReducer, useRef } from 'react';
import { View, Text, Alert, ActivityIndicator, ScrollView, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import BottomSheet from '../../shared/BottomSheet';
import { TimeEntrySchema } from '@def/entities';
import useTask from '@hooks/useTask';
import { useTimeEntry } from '@hooks/useTimeEntry';
import TaskNameSection from './sections/TaskNameSection';
import TaskStatsSection from './sections/TaskStatsSection';
import TimeEntriesSection from './sections/TimeEntriesSection';
import { log } from '@lib/util/debugging/logging';

/**
 * Props for the main TaskDetailsSheet component
 */
export interface TaskDetailsSheetProps {
  isVisible: boolean;
  onClose: () => void;
  taskId: string | null;
  onTaskDeleted?: () => void;
}

/**
 * State type for the task details reducer
 */
export type TaskDetailsState = {
  taskName: string;
  totalTime: number;
  timeEntries: TimeEntrySchema[];
  isEditing: boolean;
  isSaving: boolean;
  isRefreshing: boolean;
  localError: string | null;
  dataLoaded: boolean;
  isLoadingTimeEntries: boolean;
}

/**
 * Action types for the task details reducer
 */
export type TaskDetailsAction = 
  | { type: 'SET_TASK_DATA'; payload: { name: string; totalTime: number } }
  | { type: 'SET_TIME_ENTRIES'; payload: TimeEntrySchema[] }
  | { type: 'SET_EDITING'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TASK_NAME'; payload: string }
  | { type: 'RESET_EDITING' }
  | { type: 'SET_DATA_LOADED'; payload: boolean }
  | { type: 'SET_LOADING_TIME_ENTRIES'; payload: boolean };

/**
 * Props for the TaskNameSection component
 */
export interface TaskNameSectionProps {
  taskName: string;
  isEditing: boolean;
  isSaving: boolean;
  isDark: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onTextChange: (text: string) => void;
}

/**
 * Props for the TaskStatsSection component
 */
export interface TaskStatsSectionProps {
  totalTime: number;
  isDark: boolean;
}

/**
 * Props for the TimeEntriesSection component
 */
export interface TimeEntriesSectionProps {
  timeEntries: TimeEntrySchema[];
  isLoadingTimeEntries: boolean;
  isRefreshing: boolean;
  isDark: boolean;
  onRefresh: () => void;
}

/**
 * Props for the TimeEntryItem component
 */
export interface TimeEntryItemProps {
  entry: TimeEntrySchema;
  isDark: boolean;
  isLast: boolean;
}

// Initial state for reducer
const initialState: TaskDetailsState = {
  taskName: '',
  totalTime: 0,
  timeEntries: [],
  isEditing: false,
  isSaving: false,
  isRefreshing: false,
  localError: null,
  dataLoaded: false,
  isLoadingTimeEntries: false
};

// Reducer function
function reducer(state: TaskDetailsState, action: TaskDetailsAction): TaskDetailsState {
  switch (action.type) {
    case 'SET_TASK_DATA':
      return { 
        ...state, 
        taskName: state.isEditing ? state.taskName : action.payload.name,
        totalTime: action.payload.totalTime 
      };
    case 'SET_TIME_ENTRIES':
      return { ...state, timeEntries: action.payload };
    case 'SET_EDITING':
      return { ...state, isEditing: action.payload };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.payload };
    case 'SET_ERROR':
      return { ...state, localError: action.payload };
    case 'SET_TASK_NAME':
      return { ...state, taskName: action.payload };
    case 'RESET_EDITING':
      return { ...state, isEditing: false };
    case 'SET_DATA_LOADED':
      return { ...state, dataLoaded: action.payload };
    case 'SET_LOADING_TIME_ENTRIES':
      return { ...state, isLoadingTimeEntries: action.payload };
    default:
      return state;
  }
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
  
  // Hooks for task and time entry operations
  const { 
    loadTaskDetails, 
    updateTask, 
    deleteTask, 
    isLoading,
    error 
  } = useTask();
  
  const { 
    loadTimeEntriesForTask,
    isLoading: timeEntriesLoading 
  } = useTimeEntry();
  
  // UI state management
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // Track if component is mounted
  const isMounted = useRef(true);
  // Track currently loaded task ID
  const currentTaskId = useRef<string | null>(null);
  
  // Component lifecycle
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Load data when task or visibility changes
  useEffect(() => {
    // Update current task ID
    currentTaskId.current = taskId;
    
    // Load data when the sheet becomes visible with a valid taskId
    if (isVisible && taskId) {
      loadTaskData();
    }
  }, [isVisible, taskId]);
  
  // Load task data and time entries
  const loadTaskData = async () => {
    if (!taskId || !isVisible) return;
    
    dispatch({ type: 'SET_REFRESHING', payload: true });
    dispatch({ type: 'SET_LOADING_TIME_ENTRIES', payload: true });
    dispatch({ type: 'SET_DATA_LOADED', payload: true });
    
    try {
      // Load task details
      const taskData = await loadTaskDetails(taskId);
      
      if (taskData && isMounted.current) {
        dispatch({
          type: 'SET_TASK_DATA',
          payload: { 
            name: taskData.name, 
            totalTime: taskData.totalTime 
          }
        });
      }
      
      // Load time entries for this task
      const timeEntries = await loadTimeEntriesForTask(taskId);
      
      if (isMounted.current) {
        dispatch({ type: 'SET_TIME_ENTRIES', payload: timeEntries });
        dispatch({ type: 'SET_ERROR', payload: null });
      }
    } catch (err) {
      if (isMounted.current) {
        dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : String(err) });
      }
    } finally {
      if (isMounted.current) {
        dispatch({ type: 'SET_REFRESHING', payload: false });
        dispatch({ type: 'SET_LOADING_TIME_ENTRIES', payload: false });
      }
    }
  };
  
  // Handle closing sheet
  const handleClose = () => {
    onClose();
    dispatch({ type: 'RESET_EDITING' });
    dispatch({ type: 'SET_DATA_LOADED', payload: false });
  };
  
  // Manual refresh handler
  const handleRefresh = () => {
    loadTaskData();
  };
  
  // Save task name
  const handleSave = async () => {
    if (!currentTaskId.current || state.taskName.trim() === '') return;
    
    dispatch({ type: 'SET_SAVING', payload: true });
    
    try {
      await updateTask(currentTaskId.current, { name: state.taskName.trim() });
      dispatch({ type: 'RESET_EDITING' });
      handleRefresh();
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : String(err) });
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false });
    }
  };
  
  // Handle name text change
  const handleTextChange = (text: string) => {
    dispatch({ type: 'SET_TASK_NAME', payload: text });
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    dispatch({ type: 'RESET_EDITING' });
    handleRefresh();
  };
  
  // Start editing
  const handleEditPress = () => {
    dispatch({ type: 'SET_EDITING', payload: true });
  };
  
  // Delete task with confirmation
  const handleDeletePress = () => {
    if (!currentTaskId.current) return;
    
    Alert.alert(
      "Delete Task", 
      `Are you sure you want to delete "${state.taskName}"?`, 
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          onPress: async () => {
            try {
              const success = await deleteTask(currentTaskId.current!);
              
              if (success) {
                handleClose();
                if (onTaskDeleted) {
                  onTaskDeleted();
                }
              } else {
                dispatch({ type: 'SET_ERROR', payload: 'Failed to delete task' });
              }
            } catch (err) {
              dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : String(err) });
            }
          }, 
          style: "destructive" 
        }
      ]
    );
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
          {state.localError && (
            <View className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
              <Text className="text-red-800">{state.localError}</Text>
            </View>
          )}
          
          {isLoading && !state.dataLoaded ? (
            <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#6366F1'} />
          ) : error ? (
            <View className="items-center p-4">
              <Text className={`text-red-500 mb-2`}>Error loading task</Text>
              <Text className={`text-red-500`}>{String(error)}</Text>
            </View>
          ) : (
            <>
              {/* Task name section */}
              <TaskNameSection 
                taskName={state.taskName}
                isEditing={state.isEditing}
                isSaving={state.isSaving}
                isDark={isDark}
                onEdit={handleEditPress}
                onSave={handleSave}
                onCancel={handleCancelEdit}
                onTextChange={handleTextChange}
              />
              
              {/* Task stats section */}
              <TaskStatsSection
                totalTime={state.totalTime}
                isDark={isDark}
              />
              
              {/* Time Entries History Section */}
              <TimeEntriesSection
                timeEntries={state.timeEntries}
                isLoadingTimeEntries={state.isLoadingTimeEntries}
                isRefreshing={state.isRefreshing}
                isDark={isDark}
                onRefresh={handleRefresh}
              />
            </>
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
};

export default TaskDetailsSheet; 