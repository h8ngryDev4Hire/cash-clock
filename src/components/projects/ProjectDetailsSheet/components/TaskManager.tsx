import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTask } from '@hooks/useTask';

interface ProjectTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface TaskManagerProps {
  projectId: string;
  projectTasks: ProjectTask[];
  isDark: boolean;
  onTasksUpdated: () => void;
  onPendingTaskChanges: (hasPendingChanges: boolean) => void;
}

// Define interface for ref methods
export interface TaskManagerRef {
  hasChanges: boolean;
  applyChanges: () => Promise<boolean>;
  discardChanges: () => void;
}

/**
 * Component for managing tasks in a project
 */
const TaskManager = forwardRef<TaskManagerRef, TaskManagerProps>((props, ref) => {
  const {
    projectId,
    projectTasks,
    isDark,
    onTasksUpdated,
    onPendingTaskChanges
  } = props;
  
  const { 
    getAllTasksWithTime, 
    assignToProject, 
    removeFromProject,
    refreshData 
  } = useTask();
  
  // State for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<ProjectTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<ProjectTask[]>([]);
  
  // Local state for tracking changes (tasks to add/remove)
  const [localProjectTasks, setLocalProjectTasks] = useState<ProjectTask[]>([]);
  const [tasksToAdd, setTasksToAdd] = useState<string[]>([]);
  const [tasksToRemove, setTasksToRemove] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Initialize local state from props
  useEffect(() => {
    setLocalProjectTasks(projectTasks);
    setTasksToAdd([]);
    setTasksToRemove([]);
    setHasChanges(false);
  }, [projectTasks]);
  
  // Notify parent component about pending changes
  useEffect(() => {
    onPendingTaskChanges(hasChanges);
  }, [hasChanges, onPendingTaskChanges]);
  
  // Load available tasks that are not assigned to this project
  useEffect(() => {
    const loadAvailableTasks = async () => {
      setIsLoading(true);
      try {
        const allTasks = await getAllTasksWithTime();
        const filtered = allTasks
          .filter(task => {
            // Don't show tasks that are already in the project
            // and aren't marked for removal
            const inProject = projectTasks.some(pt => pt.id === task.id);
            const markedForRemoval = tasksToRemove.includes(task.id || '');
            
            // Include tasks not in project or marked for removal
            return (!task.projectId || task.projectId !== projectId || markedForRemoval) 
              && !task.isCompleted
              && !(inProject && !markedForRemoval)
              && !tasksToAdd.includes(task.id || '');
          })
          .map(task => ({
            id: task.id || '',
            title: task.name || '',
            isCompleted: Boolean(task.isCompleted)
          }));
          
        setAvailableTasks(filtered);
        applySearchFilter(filtered, searchQuery);
      } catch (error) {
        console.error('Error loading available tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isSearchFocused) {
      loadAvailableTasks();
    }
  }, [projectTasks, projectId, isSearchFocused, tasksToAdd, tasksToRemove, searchQuery]);
  
  // Apply search filter
  const applySearchFilter = useCallback((tasks: ProjectTask[], query: string) => {
    if (!query.trim()) {
      setFilteredTasks(tasks);
      return;
    }
    
    const lowerQuery = query.toLowerCase().trim();
    const filtered = tasks.filter(task => 
      task.title.toLowerCase().includes(lowerQuery)
    );
    setFilteredTasks(filtered);
  }, []);
  
  // Update filtered tasks when search query changes
  useEffect(() => {
    applySearchFilter(availableTasks, searchQuery);
  }, [searchQuery, availableTasks, applySearchFilter]);
  
  // Handle adding a task to the project (locally)
  const handleAddTask = (taskId: string) => {
    // Find the task from available tasks
    const taskToAdd = availableTasks.find(task => task.id === taskId);
    if (!taskToAdd) return;
    
    // Update local tasks list
    setLocalProjectTasks(prev => [...prev, taskToAdd]);
    
    // Update tracking arrays
    setTasksToAdd(prev => {
      // If it was previously marked for removal, just remove it from the removal list
      if (tasksToRemove.includes(taskId)) {
        setTasksToRemove(tasksToRemove.filter(id => id !== taskId));
        return prev;
      }
      // Otherwise add it to the add list
      return [...prev, taskId];
    });
    
    // Update available tasks list
    setAvailableTasks(prev => prev.filter(task => task.id !== taskId));
    setFilteredTasks(prev => prev.filter(task => task.id !== taskId));
    
    // Mark that we have unsaved changes
    setHasChanges(true);
    
    // Clear search
    setSearchQuery('');
    setIsSearchFocused(false);
  };
  
  // Handle removing a task from the project (locally)
  const handleRemoveTask = (taskId: string) => {
    // Update local tasks list
    setLocalProjectTasks(prev => prev.filter(task => task.id !== taskId));
    
    // Update tracking arrays
    setTasksToRemove(prev => {
      // If it was previously added, just remove it from the add list
      if (tasksToAdd.includes(taskId)) {
        setTasksToAdd(tasksToAdd.filter(id => id !== taskId));
        return prev;
      }
      // Otherwise add it to the remove list
      return [...prev, taskId];
    });
    
    // Mark that we have unsaved changes
    setHasChanges(true);
  };
  
  // Apply all changes when user saves the form
  const applyChanges = async () => {
    try {
      console.log(`Applying task changes: Adding ${tasksToAdd.length} tasks, removing ${tasksToRemove.length} tasks`);
      
      // Add tasks
      for (const taskId of tasksToAdd) {
        console.log(`Assigning task ${taskId} to project ${projectId}`);
        await assignToProject(taskId, projectId);
      }
      
      // Remove tasks
      for (const taskId of tasksToRemove) {
        console.log(`Removing task ${taskId} from project ${projectId}`);
        await removeFromProject(taskId);
      }
      
      // Reset tracking
      setTasksToAdd([]);
      setTasksToRemove([]);
      setHasChanges(false);
      
      // Refresh data
      await refreshData();
      
      // Notify parent
      onTasksUpdated();
      
      console.log('Task changes applied successfully');
      return true;
    } catch (error) {
      console.error('Error applying task changes:', error);
      return false;
    }
  };
  
  // Discard all changes
  const discardChanges = () => {
    setLocalProjectTasks(projectTasks);
    setTasksToAdd([]);
    setTasksToRemove([]);
    setHasChanges(false);
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    hasChanges,
    applyChanges,
    discardChanges
  }));
  
  return (
    <View className="mb-4">
      <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        Project Tasks
      </Text>
      
      {/* Current Project Tasks */}
      {localProjectTasks.length > 0 ? (
        <View className="mb-3">
          {localProjectTasks.map(task => (
            <View key={task.id} className={`flex-row items-center p-3 mb-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Text 
                className={`flex-1 ${task.isCompleted ? 'line-through ' : ''}${isDark ? 'text-white' : 'text-gray-800'}`}
                numberOfLines={2}
              >
                {task.title}
              </Text>
              <TouchableOpacity
                onPress={() => handleRemoveTask(task.id)}
                className="p-2"
              >
                <Ionicons name="close-circle-outline" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View className={`p-3 mb-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'} items-center justify-center`}>
          <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            No tasks assigned to this project yet.
          </Text>
        </View>
      )}
      
      {/* Search for tasks */}
      <View className="relative mb-1">
        <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Add Existing Tasks
        </Text>
        
        <View className={`flex-row items-center ${isDark ? 'border-gray-600' : 'border-gray-300'} border-b`}>
          <Ionicons 
            name="search" 
            size={18} 
            color={isDark ? '#9CA3AF' : '#6B7280'} 
            style={{ marginRight: 6 }}
          />
          <TextInput
            className={`flex-1 py-2 ${isDark ? 'text-white' : 'text-gray-800'}`}
            placeholder="Search for tasks..."
            placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
          />
          {searchQuery.trim() !== '' && (
            <TouchableOpacity 
              onPress={() => {
                setSearchQuery('');
                setIsSearchFocused(false);
              }}
              className="p-1"
            >
              <Ionicons name="close-circle" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Search Results Panel */}
        {isSearchFocused && (
          <View className={`absolute top-full left-0 right-0 mt-1 rounded-lg shadow-lg z-10 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            {isLoading ? (
              <View className="p-4 items-center">
                <ActivityIndicator size="small" color={isDark ? '#60A5FA' : '#3B82F6'} />
                <Text className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Searching tasks...
                </Text>
              </View>
            ) : filteredTasks.length === 0 ? (
              <View className="p-4 items-center">
                <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {searchQuery.trim() ? 'No matching tasks found' : 'No available tasks to add'}
                </Text>
              </View>
            ) : (
              <ScrollView className="max-h-48" keyboardShouldPersistTaps="handled">
                {filteredTasks.map(task => (
                  <TouchableOpacity
                    key={task.id}
                    className={`flex-row items-center p-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                    onPress={() => handleAddTask(task.id)}
                  >
                    <Text className={`flex-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {task.title}
                    </Text>
                    <Ionicons name="add-circle-outline" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            <TouchableOpacity
              className={`p-3 items-center border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
              onPress={() => setIsSearchFocused(false)}
            >
              <Text className={isDark ? 'text-blue-400' : 'text-blue-600'}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Backdrop for closing search results */}
        {isSearchFocused && (
          <Pressable
            style={{
              position: 'absolute',
              top: -500, // Position off-screen above
              left: -20,
              right: -20,
              height: 500,
              zIndex: 1
            }}
            onPress={() => setIsSearchFocused(false)}
          />
        )}
      </View>
      
      {hasChanges && (
        <Text className={`text-xs italic mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Task changes will be applied when you save the project
        </Text>
      )}
    </View>
  );
});

export default TaskManager; 