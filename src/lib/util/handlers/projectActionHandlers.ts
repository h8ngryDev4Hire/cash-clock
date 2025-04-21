import { Alert } from 'react-native';
import { log } from '../debugging/logging';
import { Milestone, parseMilestones } from '../project/projectDetailsHelpers';

// Using a more flexible type that accepts any properties while requiring specific ones
export interface ProjectActionHandlersState {
  projectId: string | null;
  projectName: string;
  projectGoals: string;
  projectDescription: string;
  projectColor: string;
  projectIcon: string;
  milestones: Milestone[];
  newMilestone: string;
  isEditing: boolean;
  hasPendingTaskChanges: boolean;
  
  setIsEditing: (isEditing: boolean) => void;
  setLocalError: (error: string | null) => void;
  setProjectName: (name: string) => void;
  setProjectDescription: (description: string) => void;
  setProjectGoals: (goals: string) => void;
  setProjectColor: (color: string) => void;
  setProjectIcon: (icon: string) => void;
  setMilestones: (milestones: Milestone[]) => void;
  setNewMilestone: (milestone: string) => void;
  setIsSaving: (isSaving: boolean) => void;
  
  hasUnsavedChanges: () => boolean;
  fetchProjectTasks: () => Promise<void>;
  refreshData: () => void;
  refreshTasks: () => Promise<void>;
  
  taskManagerRef: any;
  getProjectById: (id: string) => any;
  updateProject: (id: string, data: any) => Promise<any>;
  deleteProject: (id: string) => Promise<void>;
  
  onClose: () => void;
  onProjectDeleted?: () => void;
  
  [key: string]: any; // Allow additional properties
}

export const createProjectActionHandlers = (state: ProjectActionHandlersState) => {
  const {
    projectId,
    projectName,
    projectGoals,
    projectDescription,
    projectColor,
    projectIcon,
    milestones,
    setIsEditing,
    setLocalError,
    setProjectName,
    setProjectDescription,
    setProjectGoals,
    setProjectColor,
    setProjectIcon,
    hasUnsavedChanges,
    taskManagerRef,
    setMilestones,
    setNewMilestone,
    newMilestone,
    getProjectById,
    updateProject,
    deleteProject,
    setIsSaving,
    refreshData,
    refreshTasks,
    fetchProjectTasks,
    onClose,
    onProjectDeleted
  } = state;

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
        ? JSON.stringify(milestones.map((m: Milestone) => m.text))
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
      
      // Apply task changes
      if (taskManagerRef.current && state.hasPendingTaskChanges) {
        log('Applying task changes', 'ProjectDetailsSheet', 'handleSave', 'INFO');
        const success = await taskManagerRef.current.applyChanges();
        if (!success) {
          log('Failed to apply task changes', 'ProjectDetailsSheet', 'handleSave', 'ERROR');
          setLocalError('Failed to apply task changes. Please try again.');
          clearTimeout(saveTimeout);
          setIsSaving(false);
          return;
        }
      }
      
      setIsEditing(false);
      
      // Use a small timeout to avoid triggering a state update in the same cycle
      // Execute data refresh in a controlled sequence - one at a time
      setTimeout(async () => {
        try {
          log('Refreshing data after save', 'ProjectDetailsSheet', 'handleSave', 'DEBUG');
          // Always refresh project data first
          await refreshData();
          
          // Then refresh tasks if needed (just once)
          // This will trigger the useEffect in the hook to handle UI updates
          await refreshTasks();
          
          // Don't need to manually call fetchProjectTasks() here, as it should
          // be automatically triggered by the tasks dependency in the hook's useEffect
        } catch (refreshErr) {
          log('Error refreshing data after project save: ' + refreshErr, 'ProjectDetailsSheet', 'handleSave.refreshData', 'WARNING', { variableName: 'refreshErr', value: refreshErr });
        }
      }, 100);
      
      log('Project saved successfully', 'ProjectDetailsSheet', 'handleSave', 'INFO');
    } catch (err) {
      log('Error saving project: ' + err, 'ProjectDetailsSheet', 'handleSave', 'ERROR', { variableName: 'err', value: err });
      setLocalError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
      clearTimeout(saveTimeout);
    }
  };
  
  const handleDeletePress = () => {
    if (!projectId) return;
    
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProject(projectId);
              
              if (onProjectDeleted) {
                onProjectDeleted();
              }
              
              onClose();
            } catch (err) {
              log('Error deleting project: ' + err, 'ProjectDetailsSheet', 'handleDeletePress', 'ERROR', { variableName: 'err', value: err });
              setLocalError(err instanceof Error ? err.message : String(err));
            }
          }
        }
      ]
    );
  };
  
  const handleNameChange = (text: string) => {
    setProjectName(text);
    setLocalError(null);
  };
  
  const handleDescriptionChange = (text: string) => {
    setProjectDescription(text);
  };
  
  const handleGoalsChange = (text: string) => {
    setProjectGoals(text);
    setLocalError(null);
  };
  
  const handleColorSelect = (colorId: string) => {
    setProjectColor(colorId);
  };
  
  const handleIconSelect = (iconId: string) => {
    setProjectIcon(iconId);
  };
  
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

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter((milestone: Milestone) => milestone.id !== id));
  };
  
  const handleCancelEdit = () => {
    // Check for unsaved changes
    if (hasUnsavedChanges()) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              // Discard task changes
              if (taskManagerRef.current) {
                taskManagerRef.current.discardChanges();
              }
              
              // Revert back to original data
              if (projectId) {
                const projectData = getProjectById(projectId);
                
                if (projectData) {
                  setProjectName(projectData.name);
                  setProjectDescription(projectData.description || '');
                  setProjectColor(projectData.color || '');
                  setProjectIcon(projectData.icon || '');
                  setProjectGoals(projectData.goals || '');
                  setMilestones(parseMilestones(projectData.milestones));
                }
              }
              
              setIsEditing(false);
              setLocalError(null);
            }
          }
        ]
      );
      return;
    }
    
    // No changes, just cancel edit mode
    if (projectId) {
      const projectData = getProjectById(projectId);
      
      if (projectData) {
        setProjectName(projectData.name);
        setProjectDescription(projectData.description || '');
        setProjectColor(projectData.color || '');
        setProjectIcon(projectData.icon || '');
        setProjectGoals(projectData.goals || '');
        setMilestones(parseMilestones(projectData.milestones));
      }
    }
    
    setIsEditing(false);
    setLocalError(null);
  };
  
  const handleEditPress = () => {
    setIsEditing(true);
  };
  
  // Handle closing sheet and resetting state
  const handleClose = () => {
    // Check for unsaved changes
    if (state.isEditing && hasUnsavedChanges()) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              // Discard task changes
              if (taskManagerRef.current) {
                taskManagerRef.current.discardChanges();
              }
              
              // Close and reset state
              setIsEditing(false);
              setLocalError(null);
              onClose();
            }
          }
        ]
      );
      return;
    }
    
    // No changes, just close
    setIsEditing(false);
    setLocalError(null);
    onClose();
  };
  
  // Safely refresh task data with a small delay to prevent race conditions
  const handleTasksUpdated = async () => {
    log('Tasks updated, refreshing data', 'ProjectDetailsSheet', 'handleTasksUpdated', 'DEBUG');
    // First refresh the tasks data
    await refreshTasks();
    
    // Then update local state without triggering a full refresh again
    if (projectId) {
      log('Fetching updated project tasks', 'ProjectDetailsSheet', 'handleTasksUpdated', 'DEBUG');
      await fetchProjectTasks();
    }
  };
  
  return {
    handleSave,
    handleDeletePress,
    handleNameChange,
    handleDescriptionChange,
    handleGoalsChange,
    handleColorSelect,
    handleIconSelect,
    handleAddMilestone,
    handleRemoveMilestone,
    handleCancelEdit,
    handleEditPress,
    handleClose,
    handleTasksUpdated
  };
}; 