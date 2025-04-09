import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  useColorScheme,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '../shared/BottomSheet';
import { useProject } from '@hooks/useProject';
import { getColorValue, PROJECT_COLORS } from '@lib/util/project/projectColors';
import { formatDuration } from '@lib/util/time/timeFormatters';
import { log } from '@lib/util/debugging/logging';

interface ProjectDetailsSheetProps {
  isVisible: boolean;
  onClose: () => void;
  projectId: string | null;
  onProjectDeleted?: () => void;
}

/**
 * Bottom sheet for viewing and editing project details
 */
const ProjectDetailsSheet: React.FC<ProjectDetailsSheetProps> = ({
  isVisible,
  onClose,
  projectId,
  onProjectDeleted
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const { getProjectById, updateProject, deleteProject, getProjectTasks, isLoading, refreshData } = useProject();
  
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectColor, setProjectColor] = useState('');
  const [taskCount, setTaskCount] = useState(0);
  const [completedTaskCount, setCompletedTaskCount] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Get the project icon based on the project name
  const getProjectIcon = (): string => {
    if (!projectName) return 'folder-outline';
    
    const name = projectName.toLowerCase();
    if (name.includes('web') || name.includes('site')) return 'globe-outline';
    if (name.includes('app') || name.includes('mobile')) return 'phone-portrait-outline';
    if (name.includes('meeting') || name.includes('client')) return 'people-outline';
    if (name.includes('marketing') || name.includes('ads')) return 'megaphone-outline';
    if (name.includes('design') || name.includes('ui')) return 'color-palette-outline';
    if (name.includes('code') || name.includes('dev')) return 'code-slash-outline';
    return 'folder-outline';
  };
  
  // Split the useEffect hooks - one for visibility changes and one for data fetching
  // First useEffect to handle refreshing data only when the sheet becomes visible
  useEffect(() => {
    if (isVisible && projectId) {
      refreshData();
    }
  }, [isVisible, projectId]);
  
  // Second useEffect to fetch project data (without calling refreshData() every time)
  useEffect(() => {
    const fetchProject = async () => {
      if (projectId && isVisible) {
        try {
          const projectData = getProjectById(projectId);
          
          if (projectData) {
            // Only update data if not currently editing
            if (!isEditing) {
              setProjectName(projectData.name);
              setProjectDescription(projectData.description || '');
              setProjectColor(projectData.color || '');
            }
            
            // Always update stats
            setTaskCount(projectData.taskCount);
            setCompletedTaskCount(projectData.completedTaskCount);
            setCompletionPercentage(projectData.completionPercentage);
            setTotalTime(projectData.totalTime);
          }
        } catch (err) {
          log('Failed to fetch project: ' + err, 'ProjectDetailsSheet', 'fetchProject', 'ERROR', { variableName: 'err', value: err });
          setLocalError(err instanceof Error ? err.message : String(err));
        }
      }
    };
    
    fetchProject();
  }, [projectId, getProjectById, isEditing, isVisible]);
  
  // Handle closing sheet and resetting state
  const handleClose = () => {
    onClose();
    // Reset editing state
    setIsEditing(false);
    setLocalError(null);
    // Don't reset project data, it'll be refreshed on next open
  };
  
  // Save project data
  const handleSave = async () => {
    if (!projectId || projectName.trim() === '') return;
    
    try {
      setIsSaving(true);
      log('Saving project data for ID: ' + projectId, 'ProjectDetailsSheet', 'handleSave', 'INFO');
      
      // Update project with new data
      await updateProject(projectId, { 
        name: projectName.trim(),
        description: projectDescription.trim(),
        color: projectColor
      });
      
      setIsEditing(false);
      setLocalError(null);
      
      // Use a small timeout to avoid triggering a state update in the same cycle
      setTimeout(() => {
        refreshData();
      }, 50);
    } catch (err) {
      log('Failed to update project: ' + err, 'ProjectDetailsSheet', 'handleSave', 'ERROR', { variableName: 'err', value: err });
      setLocalError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };
  
  // Delete project
  const handleDeletePress = () => {
    if (!projectId) return;
    
    log('Delete button pressed for project: ' + projectId, 'ProjectDetailsSheet', 'handleDeletePress', 'INFO');
    
    // Show delete confirmation
    Alert.alert(
      "Delete Project", 
      `Are you sure you want to delete "${projectName}"?\n\nTasks will be preserved but will no longer be associated with this project.`, 
      [
        { 
          text: "Cancel", 
          onPress: () => log('Delete cancelled for project: ' + projectId, 'ProjectDetailsSheet', 'handleDeleteCancel', 'INFO'),
          style: "cancel" 
        },
        { 
          text: "Delete", 
          onPress: async () => {
            log('Delete confirmed for project: ' + projectId, 'ProjectDetailsSheet', 'handleDeleteConfirm', 'INFO');
            
            try {
              await deleteProject(projectId);
              log('Project deleted successfully: ' + projectId, 'ProjectDetailsSheet', 'handleDeleteConfirm', 'INFO');
              handleClose();
              if (onProjectDeleted) {
                onProjectDeleted();
              }
            } catch (err) {
              log('Error deleting project: ' + err, 'ProjectDetailsSheet', 'handleDeleteConfirm', 'ERROR', { variableName: 'err', value: err });
              setLocalError(err instanceof Error ? err.message : String(err));
            }
          }, 
          style: "destructive" 
        }
      ]
    );
  };
  
  // Handle text change for name
  const handleNameChange = (text: string) => {
    log('Project name edited: ' + text, 'ProjectDetailsSheet', 'handleNameChange', 'INFO');
    setProjectName(text);
  };
  
  // Handle text change for description
  const handleDescriptionChange = (text: string) => {
    setProjectDescription(text);
  };
  
  // Handle color selection
  const handleColorSelect = (colorId: string) => {
    setProjectColor(colorId);
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    log('Edit cancelled, reverting to original project data', 'ProjectDetailsSheet', 'handleCancelEdit', 'INFO');
    // Reset to the current project data by re-fetching it
    if (projectId) {
      const projectData = getProjectById(projectId);
      if (projectData) {
        setProjectName(projectData.name);
        setProjectDescription(projectData.description || '');
        setProjectColor(projectData.color || '');
      }
    }
    setIsEditing(false);
  };
  
  // Start editing
  const handleEditPress = () => {
    log('Edit button pressed for project name: ' + projectName, 'ProjectDetailsSheet', 'handleEditPress', 'INFO');
    setIsEditing(true);
  };
  
  // Render color selector
  const renderColorOptions = () => {
    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="mt-2"
      >
        {PROJECT_COLORS.map((color) => (
          <TouchableOpacity
            key={color.id}
            className="mr-3 mb-3 items-center"
            onPress={() => handleColorSelect(color.id)}
            accessibilityLabel={`Color ${color.name}`}
            accessibilityState={{ selected: projectColor === color.id }}
          >
            <View 
              className={`w-10 h-10 rounded-full items-center justify-center mb-1 border-2 ${projectColor === color.id ? 'border-blue-500' : 'border-transparent'}`}
              style={{ backgroundColor: color.value }}
            >
              {projectColor === color.id && (
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              )}
            </View>
            {projectColor === color.id && (
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {color.name}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };
  
  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={handleClose}
      height={550}
    >
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-4">
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Project Details
          </Text>
          
          <View className="flex-row">
            <TouchableOpacity 
              onPress={handleDeletePress}
              className="p-2 mr-2"
              accessibilityLabel="Delete project"
              accessibilityHint="Permanently delete this project"
            >
              <Ionicons name="trash-outline" size={22} color={isDark ? '#ef4444' : '#dc2626'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleClose}
              className="p-2"
            >
              <Ionicons 
                name="close" 
                size={24} 
                color={isDark ? '#9CA3AF' : '#6B7280'} 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <ScrollView className="flex-1 pr-1" showsVerticalScrollIndicator={false}>
          {localError && (
            <View className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
              <Text className="text-red-800">{localError}</Text>
            </View>
          )}
          
          {isLoading && !projectName ? (
            <ActivityIndicator size="large" color={isDark ? '#ffffff' : '#6366F1'} />
          ) : (
            <>
              {/* Project header with color and icon */}
              <View className={`flex-row items-center mb-5 ${isEditing ? 'opacity-50' : ''}`}>
                <View 
                  className="w-12 h-12 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: `${getColorValue(projectColor)}20` }}
                >
                  <Ionicons 
                    name={getProjectIcon() as any} 
                    size={24} 
                    color={getColorValue(projectColor)} 
                  />
                </View>
                
                {!isEditing && (
                  <View className="flex-1">
                    <Text className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {projectName}
                    </Text>
                    {projectDescription ? (
                      <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {projectDescription}
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>

              {isEditing ? (
                <View className="mb-5">
                  {/* Project name field */}
                  <View className="mb-3">
                    <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Project Name <Text className="text-red-500">*</Text>
                    </Text>
                    <TextInput
                      className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border`}
                      placeholder="Enter project name"
                      placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
                      value={projectName}
                      onChangeText={handleNameChange}
                      maxLength={50}
                      autoCapitalize="words"
                    />
                  </View>
                  
                  {/* Project description field */}
                  <View className="mb-3">
                    <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Description (Optional)
                    </Text>
                    <TextInput
                      className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border min-h-[80px]`}
                      placeholder="Enter project description"
                      placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
                      value={projectDescription}
                      onChangeText={handleDescriptionChange}
                      multiline
                      maxLength={200}
                      textAlignVertical="top"
                    />
                  </View>
                  
                  {/* Project color selection */}
                  <View className="mb-4">
                    <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Project Color
                    </Text>
                    {renderColorOptions()}
                  </View>
                  
                  {/* Action buttons */}
                  <View className="flex-row justify-end mt-2">
                    <TouchableOpacity 
                      onPress={handleCancelEdit}
                      className="px-4 py-2 mr-2 rounded-md"
                    >
                      <Text className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={handleSave}
                      className={`px-4 py-2 rounded-md ${isDark ? 'bg-indigo-600' : 'bg-indigo-500'}`}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text className="text-white">Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  {/* Edit button */}
                  <View className="flex-row justify-end mb-4">
                    <TouchableOpacity 
                      onPress={handleEditPress}
                      className={`px-3 py-1 rounded-md flex-row items-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}
                    >
                      <Ionicons 
                        name="pencil-outline" 
                        size={16} 
                        color={isDark ? '#9CA3AF' : '#6B7280'} 
                        style={{ marginRight: 4 }}
                      />
                      <Text className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        Edit
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Project stats */}
                  <View className={`p-4 rounded-lg mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                    <Text className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Project Statistics
                    </Text>
                    
                    {/* Task count */}
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        <View className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} items-center justify-center mr-3`}>
                          <Ionicons name="list-outline" size={16} color={isDark ? '#a5b4fc' : '#6366F1'} />
                        </View>
                        <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Tasks
                        </Text>
                      </View>
                      <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {taskCount} ({completedTaskCount} completed)
                      </Text>
                    </View>
                    
                    {/* Total time */}
                    <View className="flex-row items-center justify-between mb-3">
                      <View className="flex-row items-center">
                        <View className={`w-8 h-8 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} items-center justify-center mr-3`}>
                          <Ionicons name="time-outline" size={16} color={isDark ? '#a5b4fc' : '#6366F1'} />
                        </View>
                        <Text className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          Total Time
                        </Text>
                      </View>
                      <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {formatDuration(totalTime)}
                      </Text>
                    </View>
                    
                    {/* Completion bar */}
                    {taskCount > 0 && (
                      <View className="mt-3">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            Progress
                          </Text>
                          <Text className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {completionPercentage}%
                          </Text>
                        </View>
                        <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <View 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${completionPercentage}%`,
                              backgroundColor: getColorValue(projectColor)
                            }}
                          />
                        </View>
                      </View>
                    )}
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
};

export default ProjectDetailsSheet; 