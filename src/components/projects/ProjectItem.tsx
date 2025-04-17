import React from 'react';
import { View, Text, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProjectWithStats } from '@lib/util/project/projectTransformers';
import { getColorValue } from '@lib/util/project/projectColors';
import { getIconValue, suggestIconFromName } from '@lib/util/project/projectIcons';

interface ProjectItemProps {
  project: ProjectWithStats;
  onPress?: (projectId: string) => void;
}

/**
 * ProjectItem displays a single project with its details and statistics
 */
const ProjectItem: React.FC<ProjectItemProps> = ({ 
  project, 
  onPress 
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Format total time
  const formatTotalTime = (seconds: number): string => {
    if (seconds === 0) return '0h';
    
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
  
  // Get project color from the color ID
  const projectColor = getColorValue(project.color);
  
  // Get the project icon (either from stored value or based on name)
  const getProjectIconValue = (): string => {
    if (project.icon) {
      return getIconValue(project.icon);
    }
    // If no icon set but we have a name, suggest one
    return getIconValue(suggestIconFromName(project.name));
  };
  
  const projectIconValue = getProjectIconValue();
  
  return (
    <TouchableOpacity
      className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm border border-gray-100'}`}
      onPress={() => onPress?.(project.id)}
      accessibilityLabel={`Project: ${project.name}`}
      accessibilityHint="View project details and tasks"
    >
      <View className="flex-row items-center mb-3">
        {/* Project color tag */}
        <View 
          className="w-2 h-12 rounded-full mr-3"
          style={{ backgroundColor: projectColor }}
        />
        
        {/* Project name */}
        <View className="flex-1">
          <Text className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {project.name}
          </Text>
          {project.description && (
            <Text 
              className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {project.description}
            </Text>
          )}
        </View>
        
        {/* Project icon */}
        <View 
          className="w-10 h-10 rounded-lg items-center justify-center"
          style={{ backgroundColor: `${projectColor}20` }}
        >
          <Ionicons 
            name={projectIconValue as any} 
            size={22} 
            color={projectColor} 
          />
        </View>
      </View>
      
      {/* Project statistics */}
      <View className="flex-row justify-between items-center mt-1">
        {/* Task count */}
        <View className="flex-row items-center">
          <Ionicons 
            name="list-outline" 
            size={16} 
            color={isDark ? '#9CA3AF' : '#6B7280'} 
          />
          <Text className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {project.taskCount} tasks
            {project.completedTaskCount > 0 && ` (${project.completedTaskCount} completed)`}
          </Text>
        </View>
        
        {/* Total time */}
        <View className="flex-row items-center">
          <Ionicons 
            name="time-outline" 
            size={16} 
            color={isDark ? '#9CA3AF' : '#6B7280'} 
          />
          <Text className={`ml-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {formatTotalTime(project.totalTime)}
          </Text>
        </View>
      </View>
      
      {/* Progress bar for completed tasks (if there are tasks) */}
      {project.taskCount > 0 && (
        <View className="mt-3">
          <View className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <View 
              className="h-full rounded-full"
              style={{ 
                width: `${project.completionPercentage}%`,
                backgroundColor: projectColor
              }}
            />
          </View>
          <Text className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {project.completionPercentage}% complete
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default ProjectItem;