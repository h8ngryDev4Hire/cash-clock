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

// Define milestone interface
interface Milestone {
  id: string;
  text: string;
}

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
  const [projectGoals, setProjectGoals] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState('');
  const [taskCount, setTaskCount] = useState(0);
  const [completedTaskCount, setCompletedTaskCount] = useState(0);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Parse milestones from JSON string
  const parseMilestones = (milestonesStr?: string): Milestone[] => {
    if (!milestonesStr) return [];
    
    try {
      const milestonesArr = JSON.parse(milestonesStr);
      if (Array.isArray(milestonesArr)) {
        return milestonesArr.map((text, index) => ({
          id: `milestone_${index}_${Date.now()}`,
          text
        }));
      }
      return [];
    } catch (err) {
      // If the string is not in JSON format (old format), create a single milestone
      return milestonesStr.trim() ? [{ id: `milestone_0_${Date.now()}`, text: milestonesStr }] : [];
    }
  };
  
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
  
  // Handle adding a new milestone
  const handleAddMilestone = () => {
    if (!newMilestone.trim()) {
      return;
    }
    
    const milestone: Milestone = {
      id: Date.now().toString(),
      text: newMilestone.trim()
    };
    
    setMilestones([...milestones, milestone]);
    setNewMilestone('');
  };

  // Handle removing a milestone
  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter(milestone => milestone.id !== id));
  };
  
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
              setProjectGoals(projectData.goals || '');
              setMilestones(parseMilestones(projectData.milestones));
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
    
    // Validate required fields
    if (!projectGoals.trim()) {
      setLocalError('Project goals are required');
      return;
    }
    
    try {
      setIsSaving(true);
      log('Saving project data for ID: ' + projectId, 'ProjectDetailsSheet', 'handleSave', 'INFO');
      
      // Convert milestones array to JSON string
      const milestonesString = milestones.length > 0 
        ? JSON.stringify(milestones.map(m => m.text))
        : '';
      
      // Update project with new data
      await updateProject(projectId, { 
        name: projectName.trim(),
        description: projectDescription.trim(),
        color: projectColor,
        goals: projectGoals.trim(),
        milestones: milestonesString
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
  
  // Handle text change for goals
  const handleGoalsChange = (text: string) => {
    setProjectGoals(text);
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
        setProjectGoals(projectData.goals || '');
        setMilestones(parseMilestones(projectData.milestones));
        setNewMilestone('');
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
  
  // Render milestone item
  const renderMilestoneItem = (item: Milestone, showDelete = true) => {
    return (
      <View key={item.id} className={`flex-row items-center p-2 mb-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <Text className={`flex-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {item.text}
        </Text>
        {showDelete && isEditing && (
          <TouchableOpacity
            onPress={() => handleRemoveMilestone(item.id)}
            className="p-1"
          >
            <Ionicons name="close-circle" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={handleClose}
      height={600}
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
              {/* View mode */}
              {!isEditing ? (
                <View className="mb-4">
                  <View className="flex-row items-center gap-3 mb-3">
                    <View 
                      className="w-10 h-10 rounded-full items-center justify-center"
                      style={{ backgroundColor: getColorValue(projectColor) }}
                    >
                      <Ionicons name={getProjectIcon() as any} size={20} color="#FFFFFF" />
                    </View>
                    <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {projectName}
                    </Text>
                    <TouchableOpacity 
                      onPress={handleEditPress}
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
                  
                  {milestones.length > 0 ? (
                    <View className="mb-4">
                      <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Milestones
                      </Text>
                      {milestones.map(milestone => renderMilestoneItem(milestone, false))}
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
              ) : (
                <View className="mb-4">
                  {/* Edit mode */}
                  <View>
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
                    
                    {/* Project color field */}
                    <View className="mb-3">
                      <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Project Color
                      </Text>
                      {renderColorOptions()}
                    </View>
                    
                    {/* Project goals field */}
                    <View className="mb-3">
                      <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Project Goals <Text className="text-red-500">*</Text>
                      </Text>
                      <TextInput
                        className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border min-h-[80px]`}
                        placeholder="Enter project goals"
                        placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
                        value={projectGoals}
                        onChangeText={handleGoalsChange}
                        multiline
                        maxLength={200}
                        textAlignVertical="top"
                      />
                    </View>
                    
                    {/* Project milestones field */}
                    <View className="mb-4">
                      <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        Project Milestones (Optional)
                      </Text>
                      
                      {/* Milestone list */}
                      {milestones.length > 0 && (
                        <View className="mb-2">
                          {milestones.map(milestone => renderMilestoneItem(milestone))}
                        </View>
                      )}
                      
                      {/* Add milestone form */}
                      <View className="flex-row mb-2">
                        <TextInput
                          className={`flex-1 p-3 rounded-l-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border-r-0 border`}
                          placeholder="Add a milestone"
                          placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
                          value={newMilestone}
                          onChangeText={setNewMilestone}
                          editable={!isSaving}
                        />
                        <TouchableOpacity
                          className={`px-3 rounded-r-lg items-center justify-center ${isDark ? 'bg-gray-700 border-gray-700' : 'bg-gray-200 border-gray-200'} border`}
                          onPress={handleAddMilestone}
                          disabled={!newMilestone.trim() || isSaving}
                        >
                          <Ionicons name="add" size={24} color={isDark ? '#FFFFFF' : '#374151'} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Action buttons */}
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        className={`flex-1 p-3 rounded-lg items-center justify-center bg-gray-300 dark:bg-gray-700`}
                        onPress={handleCancelEdit}
                        disabled={isSaving}
                      >
                        <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        className={`flex-1 p-3 rounded-lg items-center justify-center ${
                          isSaving ? 'bg-blue-400' : !projectGoals.trim() ? 'bg-blue-300' : 'bg-blue-500'
                        }`}
                        onPress={handleSave}
                        disabled={isSaving || !projectName.trim() || !projectGoals.trim()}
                      >
                        {isSaving ? (
                          <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                          <Text className="text-white font-medium">
                            Save Changes
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
};

export default ProjectDetailsSheet; 