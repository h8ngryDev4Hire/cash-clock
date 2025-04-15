import { useState } from 'react';
import useTask from './useTask';
import { useProject } from './useProject';
import { useTimer } from './useTimer';
import { useError } from './useError';
import { ErrorLevel } from '@def/error';
import { log } from '@lib/util/debugging/logging';

/**
 * Type for project creation data
 */
export type ProjectCreationData = { 
  name: string; 
  description?: string; 
  color: string;
  goals: string;
  milestones?: string;
};

/**
 * Hook to manage creation of tasks and projects
 * This hook centralizes all the functionality related to the GlobalCreateButton component
 */
export function useCreateFeatures() {
  // Form visibility states
  const [isTaskFormVisible, setIsTaskFormVisible] = useState(false);
  const [isProjectFormVisible, setIsProjectFormVisible] = useState(false);
  
  // Required hooks
  const { createTask } = useTask();
  const { createProject } = useProject();
  const { startTimer } = useTimer();
  const { handleError } = useError('CreateFeatures', true);

  // Toggle form visibility
  const showTaskForm = () => setIsTaskFormVisible(true);
  const hideTaskForm = () => setIsTaskFormVisible(false);
  const showProjectForm = () => setIsProjectFormVisible(true);
  const hideProjectForm = () => setIsProjectFormVisible(false);

  /**
   * Handle task creation
   * @param taskName Name of the task to create
   * @param startTimerAfterCreation Whether to start the timer after task creation
   */
  const handleAddTask = async (taskName: string, startTimerAfterCreation: boolean): Promise<void> => {
    try {
      log('Creating new task: ' + taskName, 'useCreateFeatures', 'handleAddTask', 'INFO');
      const newTask = await createTask(taskName);
      
      if (startTimerAfterCreation) {
        startTimer(newTask.id);
      }
      
      hideTaskForm();
    } catch (error) {
      handleError(error, ErrorLevel.ERROR, { operation: 'createTask' });
      throw error;
    }
  };
  
  /**
   * Handle project creation
   * @param projectData Project data including name, color, goals, etc.
   */
  const handleCreateProject = async (projectData: ProjectCreationData): Promise<void> => {
    try {
      log('Creating new project: ' + projectData.name, 'useCreateFeatures', 'handleCreateProject', 'INFO');
      await createProject(projectData);
      hideProjectForm();
    } catch (error) {
      handleError(error, ErrorLevel.ERROR, { operation: 'createProject' });
      throw error;
    }
  };

  return {
    // Visibility states
    isTaskFormVisible,
    isProjectFormVisible,
    
    // Form visibility handlers
    showTaskForm,
    hideTaskForm,
    showProjectForm,
    hideProjectForm,
    
    // Creation handlers
    handleAddTask,
    handleCreateProject
  };
} 