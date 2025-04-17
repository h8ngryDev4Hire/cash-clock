import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, useColorScheme, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import ProjectList from '@components/projects/ProjectList';
import CreateProjectSheet from '@components/projects/CreateProjectSheet/CreateProjectSheet';
import ProjectDetailsSheet from '@components/projects/ProjectDetailsSheet/ProjectDetailsSheet';
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
  
  // State for managing the bottom sheets
  const [isCreateSheetVisible, setCreateSheetVisible] = useState<boolean>(false);
  const [isDetailsSheetVisible, setDetailsSheetVisible] = useState<boolean>(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
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
  
  // Load all projects
  const loadProjects = async () => {
    try {
      setIsLoading(true);
      clearError();
      log('Loading projects', 'ProjectsScreen', 'loadProjects', 'INFO');
      
      await refreshData();
      
      setIsLoading(false);
    } catch (err) {
      handleError(err, ErrorLevel.ERROR, { operation: 'loadProjects' });
    }
  };
  
  // Project list item press handler - open details sheet
  const handleProjectPress = (projectId: string) => {
    log('Project pressed: ' + projectId, 'ProjectsScreen', 'handleProjectPress', 'INFO');
    setSelectedProjectId(projectId);
    setDetailsSheetVisible(true);
  };
  
  // Handle closing the details sheet
  const handleCloseDetails = () => {
    setDetailsSheetVisible(false);
  };
  
  // Handle project deleted from the details sheet
  const handleProjectDeleted = () => {
    log('Project deleted from details sheet', 'ProjectsScreen', 'handleProjectDeleted', 'INFO');
    
    // Reset selected project ID
    setSelectedProjectId(null);
    
    // Force immediate refresh of projects
    loadProjects();
  };
  
  // Handle add project button press
  const handleAddPress = () => {
    setCreateSheetVisible(true);
  };
  
  // Handle project creation
  const handleCreateProject = async (data: { 
    name: string; 
    description?: string; 
    color: string;
    goals?: string;
    milestones?: string; 
  }) => {
    try {
      setIsLoading(true);
      clearError();
      log('Creating project: ' + data.name, 'ProjectsScreen', 'handleCreateProject', 'INFO');
      
      await createProject(data);
      await loadProjects();
      log('Project created successfully', 'ProjectsScreen', 'handleCreateProject', 'INFO');
      
      // Close sheet after successful creation
      setCreateSheetVisible(false);
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
        
        {/* Create project sheet */}
        <CreateProjectSheet 
          isVisible={isCreateSheetVisible}
          onClose={() => setCreateSheetVisible(false)}
          onCreateProject={handleCreateProject}
        />
        
        {/* Project details sheet */}
        <ProjectDetailsSheet
          isVisible={isDetailsSheetVisible}
          onClose={handleCloseDetails}
          projectId={selectedProjectId}
          onProjectDeleted={handleProjectDeleted}
        />
      </View>
    </SafeAreaView>
  );
};

export default Projects;