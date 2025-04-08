import React, { useEffect } from 'react';
import { FlatList, useColorScheme, View } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  useAnimatedGestureHandler
} from 'react-native-reanimated';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import TaskItem from './TaskItem';
import { Task } from '../../types/core';
import { useError } from '@hooks/useError';
import { ErrorLevel } from '@def/error';
import { LocalErrorMessage } from '@components/ui/LocalErrorMessage';

// Define gesture context type
type GestureContext = {
  startY: number;
};

interface TaskListProps {
  tasks: Task[];
  onTaskPress?: (taskId: string) => void;
  onPlayPress: (taskId: string) => void;
  onDeletePress?: (taskId: string) => void;
  isLoading?: boolean;
}

/**
 * TaskList component displays tasks in a simple list
 */
const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onTaskPress,
  onPlayPress,
  onDeletePress,
  isLoading = false
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Initialize error handling with local errors
  const { error, handleError, clearError } = useError('TaskList');
  
  // Check for invalid task data
  useEffect(() => {
    try {
      if (tasks && !Array.isArray(tasks)) {
        throw new Error('Invalid tasks data format');
      }
      
      // Clear error if data is valid
      if (error) clearError();
    } catch (err) {
      handleError(err, ErrorLevel.ERROR, { operation: 'validateTasksData' });
    }
  }, [tasks]);
  
  // Handle safe play press
  const handleSafePlayPress = (taskId: string) => {
    try {
      if (!taskId) {
        throw new Error('Cannot start timer: Invalid task ID');
      }
      onPlayPress(taskId);
    } catch (err) {
      handleError(err, ErrorLevel.ERROR, { 
        operation: 'startTaskTimer',
        entityId: taskId 
      });
    }
  };
  
  // Render a draggable task item
  const renderItem = ({ item }: { item: Task }) => {
    return (
      <DraggableTaskItem
        key={item.id}
        task={item}
        onPress={onTaskPress}
        onPlayPress={handleSafePlayPress}
        onDeletePress={onDeletePress}
      />
    );
  };
  
  return (
    <>
      {error && (
        <View className="mb-3">
          <LocalErrorMessage 
            error={error} 
            onDismiss={clearError} 
          />
        </View>
      )}
      
      <FlatList
        className="flex-1"
        data={error ? [] : tasks}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          flexGrow: 1, 
          paddingBottom: 100 // Extra padding for bottom timer
        }}
      />
    </>
  );
};

// Draggable wrapper for TaskItem
interface DraggableTaskItemProps {
  task: Task;
  onPress?: (taskId: string) => void;
  onPlayPress: (taskId: string) => void;
  onDeletePress?: (taskId: string) => void;
}

const DraggableTaskItem: React.FC<DraggableTaskItemProps> = ({
  task,
  onPress,
  onPlayPress,
  onDeletePress
}) => {
  // Initialize error handling
  const { handleError } = useError('DraggableTaskItem');
  
  // Animation values
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  
  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));
  
  // Handle the pan gesture
  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    GestureContext
  >({
    onStart: (_, context) => {
      context.startY = translateY.value;
      scale.value = withTiming(1.05, { duration: 100 });
    },
    onActive: (event, context) => {
      // Update position based on the gesture
      translateY.value = context.startY + event.translationY;
    },
    onEnd: () => {
      // Reset position and scale when gesture ends
      translateY.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(1, { duration: 200 });
    },
    onCancel: () => {
      // Also reset on cancel
      translateY.value = withTiming(0, { duration: 300 });
      scale.value = withTiming(1, { duration: 200 });
    },
  });
  
  return (
    <PanGestureHandler
      onGestureEvent={gestureHandler}
      activeOffsetY={[-10, 10]}
    >
      <Animated.View style={animatedStyle}>
        <TaskItem 
          task={task}
          onPress={onPress}
          onPlayPress={onPlayPress}
          onDeletePress={onDeletePress}
        />
      </Animated.View>
    </PanGestureHandler>
  );
};

export default TaskList;