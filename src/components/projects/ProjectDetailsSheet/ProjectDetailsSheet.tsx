import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  useColorScheme,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '../../shared/BottomSheet';
import { useProject } from '@hooks/useProject';
import { useTask } from '@hooks/useTask';
import { formatDuration } from '@lib/util/time/timeFormatters';
import { log } from '@lib/util/debugging/logging';
import { getColorValue } from '@lib/util/project/projectColors';
import { getIconValue, suggestIconFromName } from '@lib/util/project/projectIcons';
import { TaskItem } from '@def/core';

// Import our modularized components
import ViewMode from './tabs/ViewMode';
import EditMode from './tabs/EditMode';

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
  
  const { getProjectById, updateProject, deleteProject, isLoading, refreshData } = useProject();
  const { tasks } = useTask();
  
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectColor, setProjectColor] = useState('');
  const [projectIcon, setProjectIcon] = useState('');
  const [projectGoals, setProjectGoals] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState('');
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
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
  
  // Get the project icon from either stored value or suggested based on name
  const getProjectIconValue = (): string => {
    if (projectIcon) {
      return getIconValue(projectIcon);
    }
    // If no icon set but we have a name, suggest one
    if (projectName) {
      return getIconValue(suggestIconFromName(projectName));
    }
    return getIconValue();
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
              setProjectIcon(projectData.icon || '');
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
  
  // Third useEffect to fetch tasks linked to the project
  useEffect(() => {
    const fetchProjectTasks = async () => {
      if (projectId && isVisible) {
        try {
          setIsLoadingTasks(true);
          
          // Filter tasks by projectId and map to the correct interface
          const projectTasks = tasks
            .filter(task => task.projectId === projectId)
            .map(task => ({
              id: String(task.itemId || ''),
              title: String(task.name || ''),
              isCompleted: Boolean(task.isCompleted)
            }));
          
          setProjectTasks(projectTasks);
        } catch (err) {
          log('Failed to fetch project tasks: ' + err, 'ProjectDetailsSheet', 'fetchProjectTasks', 'ERROR', { variableName: 'err', value: err });
          // Don't show task loading errors to the user
        } finally {
          setIsLoadingTasks(false);
        }
      }
    };
    
    fetchProjectTasks();
  }, [projectId, isVisible, tasks]);
  
  // Handle closing sheet and resetting state
  const handleClose = () => {
    onClose();
    // Reset editing state
    setIsEditing(false);
    setLocalError(null);
  };
  
  // Save project data
  const handleSave = async () => {
    if (!projectId || projectName.trim() === '') return;
    
    // Validate required fields
    if (!projectGoals.trim()) {
      setLocalError('Project goals are required');
      return;
    }
    
    // Set a safety timeout to ensure isSaving is reset
    const saveTimeout = setTimeout(() => {
      log('Save operation timed out', 'ProjectDetailsSheet', 'handleSave', 'WARNING');
      setIsSaving(false);
      setLocalError('Save operation timed out. Please try again.');
    }, 10000); // 10 second timeout
    
    try {
      setIsSaving(true);
      setLocalError(null);
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
        icon: projectIcon,
        goals: projectGoals.trim(),
        milestones: milestonesString
      });
      
      setIsEditing(false);
      
      // Use a small timeout to avoid triggering a state update in the same cycle
      setTimeout(() => {
        try {
          refreshData();
        } catch (refreshErr) {
          log('Error refreshing data after project save: ' + refreshErr, 'ProjectDetailsSheet', 'handleSave.refreshData', 'WARNING', { variableName: 'refreshErr', value: refreshErr });
          // Don't show this error to the user as the save was successful
        }
      }, 50);
      
      clearTimeout(saveTimeout); // Clear the safety timeout
    } catch (err) {
      log('Failed to update project: ' + err, 'ProjectDetailsSheet', 'handleSave', 'ERROR', { variableName: 'err', value: err });
      setLocalError(err instanceof Error ? err.message : String(err));
      clearTimeout(saveTimeout); // Clear the safety timeout
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
              // Set loading state immediately
              setIsSaving(true);
              setLocalError(null);
              
              // Delete the project
              await deleteProject(projectId);
              
              log('Project deleted successfully: ' + projectId, 'ProjectDetailsSheet', 'handleDeleteConfirm', 'INFO');
              
              // Close the sheet immediately
              handleClose();
              
              // Then notify parent of deletion with a delay to ensure correct state handling
              setTimeout(() => {
                if (onProjectDeleted) {
                  onProjectDeleted();
                }
              }, 300);
            } catch (err) {
              log('Error deleting project: ' + err, 'ProjectDetailsSheet', 'handleDeleteConfirm', 'ERROR', { variableName: 'err', value: err });
              setLocalError(err instanceof Error ? err.message : String(err));
              setIsSaving(false);
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
  
  // Handle icon selection
  const handleIconSelect = (iconId: string) => {
    setProjectIcon(iconId);
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
        setProjectIcon(projectData.icon || '');
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
              {!isEditing ? (
                <ViewMode 
                  projectName={projectName}
                  projectDescription={projectDescription}
                  projectGoals={projectGoals}
                  projectColor={projectColor}
                  projectIcon={projectIcon}
                  projectTasks={projectTasks}
                  isLoadingTasks={isLoadingTasks}
                  milestones={milestones}
                  taskCount={taskCount}
                  completedTaskCount={completedTaskCount}
                  completionPercentage={completionPercentage}
                  totalTime={totalTime}
                  getProjectIconValue={getProjectIconValue}
                  onEditPress={handleEditPress}
                  isDark={isDark}
                />
              ) : (
                <EditMode
                  projectName={projectName}
                  projectDescription={projectDescription}
                  projectGoals={projectGoals}
                  projectColor={projectColor}
                  projectIcon={projectIcon}
                  milestones={milestones}
                  newMilestone={newMilestone}
                  isSaving={isSaving}
                  onNameChange={handleNameChange}
                  onDescriptionChange={handleDescriptionChange}
                  onGoalsChange={handleGoalsChange}
                  onColorSelect={handleColorSelect}
                  onIconSelect={handleIconSelect}
                  onSetNewMilestone={setNewMilestone}
                  onAddMilestone={handleAddMilestone}
                  onRemoveMilestone={handleRemoveMilestone}
                  onSave={handleSave}
                  onCancel={handleCancelEdit}
                  isDark={isDark}
                />
              )}
            </>
          )}
        </ScrollView>
      </View>
    </BottomSheet>
  );
};

export default ProjectDetailsSheet; 