import React from 'react';
import { SectionList, View, Text, useColorScheme } from 'react-native';
import { Task } from '../../types/definitions';
import TaskItem from './TaskItem';
import { Ionicons } from '@expo/vector-icons';

interface TaskListProps {
  tasks: Task[];
  onTaskPress?: (taskId: string) => void;
  onPlayPress: (taskId: string) => void;
}

/**
 * TaskList component displays tasks organized by recency and usage
 */
const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onTaskPress,
  onPlayPress 
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Sort tasks by recent and most used (in a real app, this would be more sophisticated)
  const recentTasks = [...tasks].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3);
  const mostUsedTasks = [...tasks].sort((a, b) => b.totalTime - a.totalTime).slice(0, 3);
  
  // Create sections for our list
  const sections = [
    { 
      title: 'Recent Tasks', 
      data: recentTasks,
      icon: 'time-outline'
    },
    { 
      title: 'Most Used', 
      data: mostUsedTasks,
      icon: 'stats-chart-outline'
    }
  ];
  
  // Empty state component when no tasks exist
  const EmptyState = () => (
    <View className="items-center justify-center py-16">
      <View className="bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 items-center justify-center mb-4">
        <Ionicons 
          name="list" 
          size={30} 
          color={isDark ? "#9CA3AF" : "#6B7280"} 
        />
      </View>
      <Text className={`text-base font-medium text-center ${isDark ? 'text-gray-300' : 'text-gray-500'} mb-2`}>
        No tasks yet
      </Text>
      <Text className={`text-sm text-center ${isDark ? 'text-gray-400' : 'text-gray-500'} max-w-xs`}>
        Create your first task to begin tracking your productivity
      </Text>
    </View>
  );
  
  // Section header component
  const SectionHeader = ({ title, icon }: { title: string, icon: string }) => (
    <View className={`flex-row items-center px-2 py-3 mt-2 ${isDark ? '' : ''}`}>
      <Ionicons 
        name={icon as any} 
        size={18} 
        color={isDark ? "#BFDBFE" : "#3B82F6"} 
        style={{ marginRight: 8 }}
      />
      <Text className={`font-semibold text-base ${isDark ? 'text-blue-200' : 'text-blue-500'}`}>
        {title}
      </Text>
    </View>
  );

  // If no tasks exist, show the empty state
  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <SectionList
      className="flex-1"
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TaskItem 
          task={item} 
          onPress={onTaskPress}
          onPlayPress={onPlayPress} 
        />
      )}
      renderSectionHeader={({ section: { title, icon } }) => (
        <SectionHeader title={title} icon={icon} />
      )}
      stickySectionHeadersEnabled={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ 
        flexGrow: 1, 
        paddingBottom: 100 // Extra padding for bottom timer
      }}
    />
  );
};

export default TaskList;