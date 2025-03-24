import React from 'react';
import { FlatList, View, Text, useColorScheme } from 'react-native';
import { TaskSchema } from '../../types/entities';
import TaskItem from './TaskItem';
import { Ionicons } from '@expo/vector-icons';

interface TaskListProps {
  tasks: TaskSchema[];
  onTaskPress?: (taskId: string) => void;
  onPlayPress: (taskId: string) => void;
}

/**
 * TaskList component displays tasks in a simple list
 */
const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onTaskPress,
  onPlayPress 
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Convert TaskSchema to Task for compatibility with TaskItem
  const convertedTasks = tasks.map(task => ({
    id: task.itemId,
    name: task.name,
    totalTime: task.getTotalTimeSpent ? task.getTotalTimeSpent() : 0,
    isRunning: task.isRunning,
    isCompleted: task.isCompleted,
    projectId: task.projectId || undefined,
    createdAt: task.created,
    updatedAt: task.lastUpdated
  }));

  return (
    <FlatList
      className="flex-1"
      data={convertedTasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TaskItem 
          task={item} 
          onPress={onTaskPress}
          onPlayPress={onPlayPress} 
        />
      )}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ 
        flexGrow: 1, 
        paddingBottom: 100 // Extra padding for bottom timer
      }}
    />
  );
};

export default TaskList;