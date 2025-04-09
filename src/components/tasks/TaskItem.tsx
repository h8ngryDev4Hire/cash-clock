import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, useColorScheme, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RectButton } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { formatTaskDuration, formatRelativeTime } from '@lib/util/time/timeFormatters';
import { log } from '@lib/util/debugging/logging';

// Interface for the task object passed to TaskItem
interface Task {
  id: string;
  name: string;
  totalTime: number; // in seconds
  projectId?: string | null;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  isRunning?: boolean;
  isCompleted?: boolean;
}

interface TaskItemProps {
  task: Task;
  onPress?: (taskId: string) => void;
  onPlayPress: (taskId: string) => void;
  onDeletePress?: (taskId: string) => void;
}

/**
 * TaskItem component displays an individual task with enhanced UI
 */
const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onPress,
  onPlayPress,
  onDeletePress
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const swipeableRef = useRef<Swipeable>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Generate a color based on task name (for demo purposes)
  const getTaskColor = (name: string): string => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
      'bg-amber-500', 'bg-rose-500', 'bg-cyan-500',
      'bg-lime-500', 'bg-fuchsia-500', 'bg-emerald-500'
    ];
    
    // Simple hash function to get consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash + name.charCodeAt(i)) % colors.length;
    }
    
    return colors[hash];
  };

  // Render right actions (delete button)
  const renderRightActions = () => {
    return (
      <View className="flex-row mb-4 bg-[#991b1b] p-[1rem] rounded-xl">
        <RectButton 
          style={{ 
            justifyContent: 'center', 
            paddingHorizontal: 16,
            backgroundColor: '#991b1b' 
          }}
          onPress={() => {
            log('Confirming delete for task: ' + task.name + ', ' + task.id, 'TaskItem', 'confirmDelete', 'INFO');
            
            // Show delete confirmation Alert
            Alert.alert(
              "Delete Task",
              `Are you sure you want to delete "${task.name}"?`,
              [
                {
                  text: "Cancel",
                  onPress: () => {
                    log('Delete cancelled for task: ' + task.id, 'TaskItem', 'cancelDelete', 'INFO');
                    if (swipeableRef.current) {
                      swipeableRef.current.close();
                    }
                  },
                  style: "cancel"
                },
                {
                  text: "Delete",
                  onPress: () => {
                    log('Delete confirmed for task: ' + task.id, 'TaskItem', 'handleDelete', 'INFO');
                    setIsDeleting(true);
                    
                    if (onDeletePress) {
                      onDeletePress(task.id);
                    }
                  },
                  style: "destructive"
                }
              ]
            );
          }}
        >
          <Ionicons
            name="trash-outline"
            size={24}
            color="#ffffff"
          />
        </RectButton>
      </View>
    );
  };

  // Handle task press (view details)
  const handlePress = () => {
    log('Task pressed: ' + task.name + ', ' + task.id, 'TaskItem', 'handlePress', 'INFO');
    if (onPress) {
      onPress(task.id);
    }
  };

  // Handle play button press
  const handlePlayPress = () => {
    log('Play button pressed for task: ' + task.name + ', ' + task.id, 'TaskItem', 'handlePlayPress', 'INFO');
    if (onPlayPress) {
      onPlayPress(task.id);
    }
  };

  // Don't render if task is being deleted
  if (isDeleting) return null;

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      <TouchableOpacity 
        className={`p-3 rounded-xl mb-3 mx-1 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm border border-gray-100'}`}
        onPress={handlePress}
        accessibilityLabel={`Task: ${task.name}`}
        accessibilityHint="Tap to view task details. Swipe left to delete."
      >
        <View className="flex-row items-center mb-2">
          {/* Task color indicator */}
          <View className={`w-3 h-3 rounded-full mr-2 ${getTaskColor(task.name)}`} />
          
          <Text className={`text-base font-medium flex-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {task.name}
          </Text>
          
          {/* Last updated timestamp */}
          <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {formatRelativeTime(task.updatedAt)}
          </Text>
        </View>
        
        <View className="flex-row items-center justify-between">
          {/* Total time */}
          <View className="flex-row items-center">
            <Ionicons 
              name="time-outline" 
              size={14} 
              color={isDark ? "#9CA3AF" : "#6B7280"} 
              style={{ marginRight: 4 }}
            />
            <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {formatTaskDuration(task.totalTime)}
            </Text>
          </View>
          
          {/* Project indicator - would be dynamic in a real app */}
          {task.projectId && (
            <View className="flex-row items-center">
              <Ionicons 
                name="folder-outline" 
                size={14} 
                color={isDark ? "#9CA3AF" : "#6B7280"} 
                style={{ marginRight: 4 }}
              />
              <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Project
              </Text>
            </View>
          )}
          
          {/* Play button */}
          <TouchableOpacity 
            className={`h-8 px-3 rounded-full flex-row items-center ${isDark ? 'bg-indigo-900' : 'bg-indigo-50'}`}
            onPress={handlePlayPress}
            accessibilityLabel={`Start ${task.name}`}
            accessibilityHint="Start timer for this task"
          >
            <Ionicons 
              name="play" 
              size={14} 
              color={isDark ? "#A5B4FC" : "#4F46E5"} 
              style={{ marginRight: 4 }}
            />
            <Text className={`text-sm font-medium ${isDark ? 'text-indigo-200' : 'text-indigo-700'}`}>
              Start
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

export default TaskItem;