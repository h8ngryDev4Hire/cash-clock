import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { useProject } from '@hooks/useProject';
import { useTask } from '@hooks/useTask';
import { parseMilestones } from '@lib/util/project/projectDetailsHelpers';
import { ProjectTask } from '@components/projects/ProjectDetailsSheet/ProjectDetailsSheet';
import { Milestone } from '@lib/util/project/projectDetailsHelpers';
import { TaskManagerRef } from '../components/projects/ProjectDetailsSheet/components/TaskManager';
import { log } from '@lib/util/debugging/logging';

export const useProjectDetailsState = (
  projectId: string | null,
  isVisible: boolean,
  onClose: () => void,
  onProjectDeleted?: () => void
) => {
  const { getProjectById, updateProject, deleteProject, isLoading, refreshData } = useProject();
  const { tasks, refreshTasks: originalRefreshTasks } = useTask();
  
  // Create ref to track whether we're already refreshing to prevent duplicate calls
  const isRefreshing = useRef(false);
  
  // Create ref to task manager
  const taskManagerRef = useRef<TaskManagerRef>(null);
  
  // Create ref to store the previous projectId to detect real changes
  const prevProjectId = useRef<string | null>(null);
  const prevIsVisible = useRef<boolean>(false);
  
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
  const [hasPendingTaskChanges, setHasPendingTaskChanges] = useState(false);
  
  // Handle pending task changes notification
  const handlePendingTaskChanges = useCallback((hasPending: boolean) => {
    setHasPendingTaskChanges(hasPending);
  }, []);
  
  // Create a memoized version of refreshTasks to prevent infinite loops
  const refreshTasks = useCallback(async (): Promise<void> => {
    if (isRefreshing.current) {
      log('Skipping duplicate refreshTasks call - refresh already in progress', 'useProjectDetailsState', 'refreshTasks', 'DEBUG');
      return;
    }
    
    try {
      isRefreshing.current = true;
      log('Starting refreshTasks', 'useProjectDetailsState', 'refreshTasks', 'DEBUG');
      await originalRefreshTasks();
    } finally {
      isRefreshing.current = false;
    }
  }, [originalRefreshTasks]);
  
  // Function to fetch project tasks
  const fetchProjectTasks = useCallback(async () => {
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
  }, [projectId, isVisible, tasks]);
  
  // Check for unsaved changes
  const hasUnsavedChanges = useCallback((): boolean => {
    // Task changes
    const hasTaskChanges = hasPendingTaskChanges;
    
    // Project changes
    if (projectId) {
      const projectData = getProjectById(projectId);
      if (projectData) {
        return (
          hasTaskChanges ||
          projectName !== projectData.name ||
          projectDescription !== (projectData.description || '') ||
          projectColor !== (projectData.color || '') ||
          projectIcon !== (projectData.icon || '') ||
          projectGoals !== (projectData.goals || '')
        );
      }
    }
    
    return hasTaskChanges || false;
  }, [
    hasPendingTaskChanges, 
    projectId, 
    getProjectById, 
    projectName, 
    projectDescription, 
    projectColor, 
    projectIcon, 
    projectGoals
  ]);
  
  // First useEffect to handle refreshing data only when the sheet becomes visible
  // or when projectId changes (not just on every render)
  useEffect(() => {
    // Only refresh if there's a real change in visibility or projectId
    const projectIdChanged = projectId !== prevProjectId.current;
    const visibilityChanged = isVisible !== prevIsVisible.current;
    
    // Update our refs to track changes
    prevProjectId.current = projectId;
    prevIsVisible.current = isVisible;
    
    // Only perform refresh when needed
    if ((projectIdChanged || visibilityChanged) && isVisible && projectId) {
      log(`Refreshing data due to changes: projectId changed: ${projectIdChanged}, visibility changed: ${visibilityChanged}`, 
          'useProjectDetailsState', 'useEffect', 'DEBUG');
          
      // Prevent refresh spam by debouncing multiple calls
      const refreshAllData = async () => {
        if (isRefreshing.current) {
          return;
        }
        
        try {
          isRefreshing.current = true;
          await refreshData();
          await refreshTasks();
        } finally {
          isRefreshing.current = false;
        }
      };
      
      refreshAllData();
    }
  }, [isVisible, projectId, refreshData, refreshTasks]);
  
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
    fetchProjectTasks();
  }, [projectId, isVisible, tasks, fetchProjectTasks]);
  
  return {
    // State
    projectName,
    setProjectName,
    projectDescription,
    setProjectDescription,
    projectColor,
    setProjectColor,
    projectIcon,
    setProjectIcon,
    projectGoals,
    setProjectGoals,
    milestones,
    setMilestones,
    newMilestone,
    setNewMilestone,
    projectTasks,
    setProjectTasks,
    isLoadingTasks,
    taskCount,
    completedTaskCount,
    completionPercentage,
    totalTime,
    isEditing,
    setIsEditing,
    isSaving,
    setIsSaving,
    localError,
    setLocalError,
    hasPendingTaskChanges,
    
    // Refs
    taskManagerRef,
    
    // Functions
    hasUnsavedChanges,
    fetchProjectTasks,
    handlePendingTaskChanges,
    
    // Project operations
    getProjectById,
    updateProject,
    deleteProject,
    isLoading,
    refreshData,
    refreshTasks
  };
}; 