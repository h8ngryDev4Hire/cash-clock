import { useCallback, useContext, useMemo } from 'react';
import { ProjectSchema, TaskSchema } from '@def/entities';
import { StorageContext } from '@context/StorageContext';
import { transformProjectSchemaToModel, enhanceProjectWithStats, ProjectWithStats } from '@lib/util/project/projectTransformers';
import { getDefaultColor } from '@lib/util/project/projectColors';
import { Project } from '@def/core';

export const useProject = () => {
  const storage = useContext(StorageContext);
  
  if (!storage) {
    throw new Error('useProject must be used within a StorageProvider');
  }

  /**
   * Transform all projects with stats
   */
  const projectsWithStats = useMemo<ProjectWithStats[]>(() => {
    return storage.projects.map(project => {
      const model = transformProjectSchemaToModel(project);
      return enhanceProjectWithStats(model, storage.tasks, storage.timeEntries);
    });
  }, [storage.projects, storage.tasks, storage.timeEntries]);

  /**
   * Get all projects
   */
  const getAllProjects = useCallback(() => {
    return projectsWithStats;
  }, [projectsWithStats]);

  /**
   * Get a project by ID
   */
  const getProjectById = useCallback((projectId: string) => {
    return projectsWithStats.find(project => project.id === projectId);
  }, [projectsWithStats]);

  /**
   * Move multiple tasks to a different project
   */
  const moveTasksBetweenProjects = useCallback(async (taskIds: string[], newProjectId: string | null) => {
    for (const taskId of taskIds) {
      await storage.updateEntity<TaskSchema>('tasks', taskId, { 
        projectId: newProjectId,
        isGrouped: !!newProjectId 
      });
    }
  }, [storage]);

  /**
   * Create a new project
   */
  const createProject = useCallback(async (
    data: {
      name: string;
      description?: string;
      color?: string;
      icon?: string;
      goals?: string;
      milestones?: string;
      taskIds?: string[];
    }
  ) => {
    // Set default color if not provided
    const projectColor = data.color || getDefaultColor().id;
    
    const dbData = {
      name: data.name,
      description: data.description || '',
      color: projectColor,
      icon: data.icon || '',
      goals: data.goals || '',
      milestones: data.milestones || '',
    };

    const transform = (dbData: any): ProjectSchema => ({
      ...dbData,
      itemId: dbData.item_id,
      created: dbData.created,
      lastUpdated: dbData.last_updated
    });

    // Create the project
    const newProject = await storage.createEntity<ProjectSchema>('projects', dbData, transform);
    
    // If task IDs were provided, associate them with the new project
    if (data.taskIds && data.taskIds.length > 0) {
      await moveTasksBetweenProjects(data.taskIds, newProject.itemId);
    }
    
    return newProject;
  }, [storage, moveTasksBetweenProjects]);

  /**
   * Update a project
   */
  const updateProject = useCallback(async (
    projectId: string, 
    updates: {
      name?: string;
      description?: string;
      color?: string;
      icon?: string;
      goals?: string;
      milestones?: string;
    }
  ) => {
    const dbUpdates: Record<string, any> = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.color !== undefined) dbUpdates.color = updates.color;
    if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
    if (updates.goals !== undefined) dbUpdates.goals = updates.goals;
    if (updates.milestones !== undefined) dbUpdates.milestones = updates.milestones;

    await storage.updateEntity<ProjectSchema>('projects', projectId, dbUpdates);
  }, [storage]);

  /**
   * Delete a project (tasks will be unlinked)
   */
  const deleteProject = useCallback(async (projectId: string) => {
    // Get all tasks for this project
    const projectTasks = storage.tasks.filter(task => task.projectId === projectId);
    
    // Unlink tasks from project before deleting
    for (const task of projectTasks) {
      await storage.updateEntity<TaskSchema>(
        'tasks', 
        task.itemId, 
        { projectId: null }
      );
    }

    // Now delete the project
    await storage.deleteEntity('projects', projectId);
  }, [storage]);

  /**
   * Get all tasks for a project
   */
  const getProjectTasks = useCallback((projectId: string) => {
    return storage.tasks
      .filter(task => task.projectId === projectId)
      .map(task => ({
        id: task.itemId,
        name: task.name,
        isCompleted: task.isCompleted,
        isRunning: task.isRunning,
        createdAt: task.created,
        updatedAt: task.lastUpdated,
        // Calculate total time
        totalTime: task.timeEntries?.reduce((total, entry) => {
          if (entry.isRunning) {
            const now = Math.floor(Date.now() / 1000);
            return total + (now - entry.timeStarted);
          }
          return total + entry.timeSpent;
        }, 0) || 0
      }));
  }, [storage.tasks]);

  /**
   * Assign a task to a project
   */
  const assignTaskToProject = useCallback(async (taskId: string, projectId: string) => {
    await storage.updateEntity<TaskSchema>('tasks', taskId, { projectId });
  }, [storage]);

  /**
   * Remove a task from a project
   */
  const removeTaskFromProject = useCallback(async (taskId: string) => {
    await storage.updateEntity<TaskSchema>('tasks', taskId, { projectId: null });
  }, [storage]);

  return {
    // Data
    projects: storage.projects,
    projectsWithStats,
    
    // Basic CRUD operations
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    
    // Task relationship operations
    getProjectTasks,
    assignTaskToProject,
    removeTaskFromProject,
    moveTasksBetweenProjects,
    
    // Loading and error states
    isLoading: storage.isLoading,
    error: storage.error,
    lastUpdated: storage.lastUpdated,
    
    // Refresh
    refreshData: storage.refreshData
  };
}; 