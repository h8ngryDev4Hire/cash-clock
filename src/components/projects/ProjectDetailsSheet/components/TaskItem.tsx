import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useDrag } from '@hooks/useDrag';
import { Point } from '@def/drag';
import { log } from '@lib/util/debugging/logging';

interface TaskItemProps {
  id: string;
  title: string;
  isCompleted: boolean;
  isDark: boolean;
  onDragStart?: (id: string) => void;
  onDragEnd?: (id: string, distance: number) => void;
  dragEnabled?: boolean;
}

/**
 * Component for displaying a task item
 */
const TaskItem: React.FC<TaskItemProps> = ({
  id,
  title,
  isCompleted,
  isDark,
  onDragStart,
  onDragEnd,
  dragEnabled = true
}) => {
  // Use the global drag hook
  const { 
    isDragging,
    gestureHandler,
    animatedStyle,
    enabled
  } = useDrag({
    id,
    type: 'task',
    enabled: dragEnabled,
    onDragStart: () => {
      log(`Task drag started: ${id}`, 'TaskItem', 'onDragStart', 'INFO');
      if (onDragStart) {
        onDragStart(id);
      }
    },
    onDragEnd: (distance: Point) => {
      log(`Task drag ended: ${id}, distance: ${JSON.stringify(distance)}`, 'TaskItem', 'onDragEnd', 'INFO');
      if (onDragEnd) {
        // Calculate vertical distance for consistent behavior with the original component
        onDragEnd(id, distance.y);
      }
    }
  });
  
  // Component to show task content
  const TaskContent = () => (
    <View className={`flex-row items-center p-3 mb-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
      <View className={`w-5 h-5 rounded-full mr-3 items-center justify-center border ${isDark ? 'border-gray-500' : 'border-gray-300'} ${
        isCompleted ? (isDark ? 'bg-green-600' : 'bg-green-500') : 'bg-transparent'
      }`}>
        {isCompleted && <Ionicons name="checkmark" size={12} color="#FFFFFF" />}
      </View>
      <Text 
        className={`flex-1 ${isCompleted ? 'line-through ' : ''}${isDark ? 'text-white' : 'text-gray-800'}`}
        numberOfLines={2}
      >
        {title}
      </Text>
      {dragEnabled && (
        <View className="p-2">
          <Ionicons 
            name="reorder-two" 
            size={20} 
            color={isDark ? '#9CA3AF' : '#6B7280'} 
          />
        </View>
      )}
    </View>
  );
  
  // If drag is not enabled, just render the content
  if (!dragEnabled) {
    return <TaskContent />;
  }
  
  // Wrap in PanGestureHandler if dragging is enabled
  return (
    <PanGestureHandler onGestureEvent={gestureHandler} activeOffsetY={[-5, 5]}>
      <Animated.View style={animatedStyle}>
        <TaskContent />
      </Animated.View>
    </PanGestureHandler>
  );
};

export default TaskItem; 