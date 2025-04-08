import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, useColorScheme, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import ProjectList from '@components/projects/ProjectList';
import CreateProjectSheet from '@components/projects/CreateProjectSheet';
import { useProject } from '@hooks/useProject';
import { useError } from '@hooks/useError';
import { ErrorLevel } from '@def/error';
import { LocalErrorMessage } from '@components/ui/LocalErrorMessage';
import { log } from '@lib/util/debugging/logging';

/**
 * Projects screen to view and manage projects
 */
const Projects = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  
  // State for managing the create project sheet
  const [isCreateSheetVisible, setCreateSheetVisible] = useState<boolean>(false);
  
  // Initialize project hooks
  const { 
    projectsWithStats, 
    createProject, 
    refreshData, 
    isLoading: projectLoading 
  } = useProject();
  
  // Initialize error handling
  const { 
    error, 
    isLoading: errorLoading, 
    handleError, 
    clearError,
    setIsLoading
  } = useError('ProjectsScreen');
  
  // Combined loading state
  const isLoading = projectLoading || errorLoading;
  
  // Load projects when component mounts
  useEffect(() => {
    loadProjects();
  }, []);
  
  // Refresh projects
  const loadProjects = async () => {
    try {
      setIsLoading(true);
      clearError();
      log('Loading projects', 'ProjectsScreen', 'INFO');
      
      await refreshData();
      
      setIsLoading(false);
    } catch (err) {
      handleError(err, ErrorLevel.ERROR, { operation: 'loadProjects' });
    }
  };
  
  // Handle project press - Navigate to project details
  const handleProjectPress = (projectId: string) => {
    log('Project pressed: ' + projectId, 'ProjectsScreen', 'INFO');
    // Will be implemented in the future:
    // router.push(`/project/${projectId}`);
  };
  
  // Handle add project button press
  const handleAddPress = () => {
    setCreateSheetVisible(true);
  };
  
  // Handle project creation
  const handleCreateProject = async (data: { 
    name: string; 
    description?: string; 
    color: string 
  }) => {
    try {
      setIsLoading(true);
      clearError();
      log('Creating project: ' + data.name, 'ProjectsScreen', 'INFO');
      
      await createProject(data);
      log('Project created successfully', 'ProjectsScreen', 'INFO');
      
      // Refresh the project list
      await refreshData();
      
      setIsLoading(false);
    } catch (err) {
      handleError(err, ErrorLevel.ERROR, { 
        operation: 'createProject',
        input: data
      });
      throw err; // Re-throw so the create sheet can handle it
    }
  };
  
  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View className="flex-1 px-4 pt-2">
        {/* Display local error message if there's an error */}
        {error && (
          <View className="mb-2">
            <LocalErrorMessage 
              error={error} 
              onDismiss={clearError} 
            />
          </View>
        )}
        
        <ProjectList
          projects={projectsWithStats}
          onProjectPress={handleProjectPress}
          onAddPress={handleAddPress}
          isLoading={isLoading}
        />
        
        <CreateProjectSheet 
          isVisible={isCreateSheetVisible}
          onClose={() => setCreateSheetVisible(false)}
          onCreateProject={handleCreateProject}
        />
      </View>
    </SafeAreaView>
  );
};

export default Projects;