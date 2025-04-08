import React from 'react';
import { FlatList, Text, View, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import ProjectItem from './ProjectItem';
import { ProjectWithStats } from '@lib/util/project/projectTransformers';
import { Ionicons } from '@expo/vector-icons';

interface ProjectListProps {
  projects: ProjectWithStats[];
  onProjectPress?: (projectId: string) => void;
  onAddPress?: () => void;
  isLoading?: boolean;
}

/**
 * ProjectList displays a list of projects with an option to add new ones
 */
const ProjectList: React.FC<ProjectListProps> = ({
  projects,
  onProjectPress,
  onAddPress,
  isLoading = false
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Render empty state when no projects exist
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View className="items-center justify-center py-12">
          <ActivityIndicator 
            size="large" 
            color={isDark ? '#60A5FA' : '#3B82F6'} 
          />
          <Text className={`text-base mt-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading projects...
          </Text>
        </View>
      );
    }
    
    return (
      <View className="items-center justify-center py-12">
        <View 
          className="w-16 h-16 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: isDark ? '#374151' : '#F3F4F6' }}
        >
          <Ionicons
            name="folder-open-outline"
            size={28}
            color={isDark ? '#9CA3AF' : '#6B7280'}
          />
        </View>
        <Text className={`text-lg font-medium mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          No projects yet
        </Text>
        <Text className={`text-center px-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Create your first project to organize your tasks and track time more effectively
        </Text>
        
        <TouchableOpacity
          className="mt-6 px-6 py-3 bg-blue-500 rounded-lg"
          onPress={onAddPress}
        >
          <Text className="text-white font-medium">
            Create Project
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render item separator
  const renderSeparator = () => (
    <View className="h-2" />
  );

  // Render header with title and add button
  const renderHeader = () => (
    <View className="flex-row justify-between items-center mb-4">
      <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
        Your Projects
      </Text>
      <TouchableOpacity
        onPress={onAddPress}
        className={`rounded-full p-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
        accessibilityLabel="Add new project"
        accessibilityHint="Creates a new project"
      >
        <Ionicons
          name="add"
          size={22}
          color={isDark ? '#E5E7EB' : '#4B5563'}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1">
      {renderHeader()}
      
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProjectItem 
            project={item} 
            onPress={onProjectPress}
          />
        )}
        ItemSeparatorComponent={renderSeparator}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingBottom: 120, // Allow space for bottom timer
          flexGrow: projects.length === 0 ? 1 : undefined 
        }}
      />
    </View>
  );
};

export default ProjectList;