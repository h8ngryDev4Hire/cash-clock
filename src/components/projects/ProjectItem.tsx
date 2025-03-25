import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Project } from '../../types/core';

interface ProjectItemProps {
  project: Project & {
    taskCount?: number;
    totalTime?: number;
    icon?: string;
  };
  onPress?: (projectId: string) => void;
}

/**
 * ProjectItem displays a single project with its details
 */
const ProjectItem: React.FC<ProjectItemProps> = ({ 
  project, 
  onPress 
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Format total time
  const formatTotalTime = (seconds?: number): string => {
    if (!seconds) return '0h';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) {
      return `${minutes}m`;
    }
    
    if (minutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${minutes}m`;
  };
  
  // Get project color or fallback
  const projectColor = project.color || '#6366F1';
  // Get project icon or fallback
  const projectIcon = project.icon || 'folder';
  
  return (
    <TouchableOpacity
      className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm border border-gray-100'}`}
      onPress={() => onPress?.(project.id)}
      accessibilityLabel={`Project: ${project.name}`}
      accessibilityHint="View project details and tasks"
    >
      <View className="flex-row items-center">
        {/* Project color tag */}
        <View 
          className="w-2 h-12 rounded-full mr-3"
          style={{ backgroundColor: projectColor }}
        />
        
        {/* Project name */}
        <View className="flex-1 flex-row items-center">
          <Text className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {project.name}
          </Text>
        </View>
        
        {/* Project icon */}
        <View 
          className="w-8 h-8 rounded-lg items-center justify-center"
          style={{ backgroundColor: `${projectColor}20` }}
        >
          <Ionicons 
            name={projectIcon as any} 
            size={18} 
            color={projectColor} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default ProjectItem;