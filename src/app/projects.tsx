import React, { useState } from 'react';
import { View, SafeAreaView, useColorScheme } from 'react-native';
import ProjectList from '../components/projects/ProjectList';
import { Project } from '../types/core';

// Mock data for projects (will be replaced with actual data later)
const MOCK_PROJECTS: (Project & { taskCount?: number; totalTime?: number; icon?: string })[] = [
  {
    id: '1',
    name: 'Website Redesign',
    color: '#F97316', // Orange
    icon: 'globe-outline',
    taskCount: 5,
    totalTime: 12600, // 3.5 hours
    createdAt: Date.now() - 1000000,
    updatedAt: Date.now() - 10000
  },
  {
    id: '2',
    name: 'Mobile App',
    color: '#8B5CF6', // Purple
    icon: 'phone-portrait-outline',
    taskCount: 8,
    totalTime: 32400, // 9 hours
    createdAt: Date.now() - 2000000,
    updatedAt: Date.now() - 50000
  },
  {
    id: '3',
    name: 'Client Meetings',
    color: '#10B981', // Green
    icon: 'people-outline',
    taskCount: 3,
    totalTime: 5400, // 1.5 hours
    createdAt: Date.now() - 3000000,
    updatedAt: Date.now() - 100000
  },
  {
    id: '4',
    name: 'Marketing',
    color: '#EF4444', // Red
    icon: 'megaphone-outline',
    taskCount: 2,
    totalTime: 7200, // 2 hours
    createdAt: Date.now() - 4000000,
    updatedAt: Date.now() - 200000
  }
];

/**
 * Projects screen to view and manage projects
 */
const Projects = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // State for projects (using mock data for now)
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  
  // Handle project press - Will navigate to project details in the future
  const handleProjectPress = (projectId: string) => {
    console.log(`Project pressed: ${projectId}`);
    // Will be implemented: navigation.navigate('ProjectDetails', { projectId });
  };
  
  // Handle add project press
  const handleAddPress = () => {
    console.log('Add project pressed');
    // Will be implemented: show modal or navigate to add project screen
  };
  
  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <View className="flex-1 px-4 pt-2">
        <ProjectList
          projects={projects}
          onProjectPress={handleProjectPress}
          onAddPress={handleAddPress}
        />
      </View>
    </SafeAreaView>
  );
};

export default Projects;