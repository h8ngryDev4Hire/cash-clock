import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColorValue } from '@lib/util/project/projectColors';
import { formatDuration } from '@lib/util/time/timeFormatters';
import TaskItem from '../components/TaskItem';
import MilestoneItem from '../components/MilestoneItem';

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
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Tasks
        </Text>
        
        {isLoadingTasks ? (
          <View className="py-3 items-center">
            <ActivityIndicator size="small" color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading tasks...
            </Text>
          </View>
        ) : projectTasks.length === 0 ? (
          <View className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'} items-center justify-center`}>
            <Text className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              No tasks assigned to this project yet.
            </Text>
          </View>
        ) : (
          <View>
            {projectTasks.map(task => (
              <TaskItem
                key={task.id}
                id={task.id}
                title={task.title}
                isCompleted={task.isCompleted}
                isDark={isDark}
              />
            ))}
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
    </View>
  );
};

export default ViewMode; 