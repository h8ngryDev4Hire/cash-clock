import React, { useState, useCallback } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColorValue } from '@lib/util/project/projectColors';
import { formatDuration } from '@lib/util/time/timeFormatters';
import TaskItem from '../components/TaskItem';
import MilestoneItem from '../components/MilestoneItem';
import { GestureHandlerRootView, TouchableOpacity } from 'react-native-gesture-handler';
import { useDragContext } from '@context/DragContext';
import { log } from '@lib/util/debugging/logging';

// Define milestone interface
interface Milestone {
  id: string;
  text: string;
}

// Define task interface
interface ProjectTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface ViewModeProps {
  projectName: string;
  projectDescription: string;
  projectGoals: string;
  projectColor: string;
  projectIcon: string;
  projectTasks: ProjectTask[];
  isLoadingTasks: boolean;
  milestones: Milestone[];
  taskCount: number;
  completedTaskCount: number;
  completionPercentage: number;
  totalTime: number;
  getProjectIconValue: () => string;
  onEditPress: () => void;
  isDark: boolean;
}

/**
 * View mode tab for Project Details
 */
const ViewMode: React.FC<ViewModeProps> = ({
  projectName,
  projectDescription,
  projectGoals,
  projectColor,
  projectIcon,
  projectTasks,
  isLoadingTasks,
  milestones,
  taskCount,
  completedTaskCount,
  completionPercentage,
  totalTime,
  getProjectIconValue,
  onEditPress,
  isDark
}) => {
  // State for task reordering
  const [orderedTasks, setOrderedTasks] = useState<ProjectTask[]>(projectTasks);
  const [dragEnabled, setDragEnabled] = useState(false);
  
  // Get the drag context to know when any task is being dragged
  const { isDragging: isAnyTaskDragging } = useDragContext();
  
  // Update ordered tasks when projectTasks changes from props
  React.useEffect(() => {
    setOrderedTasks(projectTasks);
  }, [projectTasks]);
  
  // Toggle drag mode
  const toggleDragMode = useCallback(() => {
    setDragEnabled(!dragEnabled);
    log(`Drag mode ${!dragEnabled ? 'enabled' : 'disabled'}`, 'ViewMode', 'toggleDragMode', 'INFO');
  }, [dragEnabled]);
  
  // Handle drag start
  const handleDragStart = useCallback((taskId: string) => {
    log(`Task drag started: ${taskId}`, 'ViewMode', 'handleDragStart', 'INFO');
  }, []);
  
  // Handle drag end and reordering
  const handleDragEnd = useCallback((taskId: string, distance: number) => {
    log(`Task drag ended: ${taskId}, distance: ${distance}`, 'ViewMode', 'handleDragEnd', 'INFO');
    
    // If the distance moved is too small, don't reorder
    if (Math.abs(distance) < 20) {
      return;
    }
    
    // Find the task's current index
    const currentIndex = orderedTasks.findIndex(task => task.id === taskId);
    if (currentIndex < 0) return;
    
    // Calculate new index based on distance and direction
    const direction = Math.sign(distance);
    // Approximate pixels per item height
    const pixelsPerItem = 56; // Adjusted for typical task item height
    const positionsToMove = Math.round(Math.abs(distance) / pixelsPerItem);
    
    if (positionsToMove === 0) return;
    
    // Determine new index with bounds check
    let newIndex = currentIndex + (direction * positionsToMove);
    newIndex = Math.max(0, Math.min(orderedTasks.length - 1, newIndex));
    
    if (newIndex === currentIndex) return;
    
    // Create new array with reordered tasks
    const newOrderedTasks = [...orderedTasks];
    const [movedTask] = newOrderedTasks.splice(currentIndex, 1);
    newOrderedTasks.splice(newIndex, 0, movedTask);
    
    setOrderedTasks(newOrderedTasks);
    
    // Here you could save the new order to your backend/database
    // saveTaskOrder(newOrderedTasks);
  }, [orderedTasks]);
  
  return (
    <View className="mb-4">
      <View className="flex-row items-center gap-3 mb-3">
        <View 
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: getColorValue(projectColor) }}
        >
          <Ionicons name={getProjectIconValue() as any} size={20} color="#FFFFFF" />
        </View>
        <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {projectName}
        </Text>
        <TouchableOpacity 
          onPress={onEditPress}
          className="ml-auto p-2"
        >
          <Ionicons 
            name="pencil-outline" 
            size={18} 
            color={isDark ? '#9CA3AF' : '#6B7280'} 
          />
        </TouchableOpacity>
      </View>
      
      {projectDescription ? (
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Description
          </Text>
          <Text className={isDark ? 'text-white' : 'text-gray-800'}>
            {projectDescription}
          </Text>
        </View>
      ) : null}
      
      {projectGoals ? (
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Goals
          </Text>
          <Text className={isDark ? 'text-white' : 'text-gray-800'}>
            {projectGoals}
          </Text>
        </View>
      ) : null}
      
      {/* Project Tasks */}
      <GestureHandlerRootView>
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-1">
          <Text className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Tasks
          </Text>
          {orderedTasks.length > 1 && (
            <TouchableOpacity 
              onPress={toggleDragMode} 
              className={`px-2 py-1 rounded-md ${dragEnabled ? (isDark ? 'bg-indigo-600' : 'bg-indigo-500') : 'bg-transparent'}`}
              disabled={isAnyTaskDragging}
            >
              <Text className={`text-xs ${dragEnabled ? 'text-white' : (isDark ? 'text-gray-300' : 'text-gray-600')}`}>
                {dragEnabled ? 'Done' : 'Reorder'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {isLoadingTasks ? (
          <View className="py-3 items-center">
            <ActivityIndicator size="small" color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading tasks...
            </Text>
          </View>
        ) : orderedTasks.length === 0 ? (
          <View className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} items-center justify-center`}>
            <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No tasks assigned to this project yet.
            </Text>
          </View>
        ) : (
          <View>
            <GestureHandlerRootView>
              {orderedTasks.map(task => (
                <TaskItem
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  isCompleted={task.isCompleted}
                  isDark={isDark}
                  dragEnabled={dragEnabled}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </GestureHandlerRootView>
          </View>
        )}
      </View>
      
      {milestones.length > 0 ? (
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Milestones
          </Text>
          {milestones.map(milestone => (
            <MilestoneItem 
              key={milestone.id}
              milestone={milestone}
              isDark={isDark}
              showDelete={false}
            />
          ))}
        </View>
      ) : null}
      
      <View className="flex-row flex-wrap mt-1 gap-2">
        <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
          </Text>
        </View>
        
        {taskCount > 0 && (
          <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {completionPercentage}% complete
            </Text>
          </View>
        )}
        
        {totalTime > 0 && (
          <View className={`px-3 py-1 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {formatDuration(totalTime)}
            </Text>
          </View>
        )}
      </View>
      </GestureHandlerRootView>
    </View>
  );
};

export default ViewMode; 