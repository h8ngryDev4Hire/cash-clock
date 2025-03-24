import { useCallback } from 'react';
import { useStorageContext } from '../context/StorageContext';
import { ProjectSchema } from '../types/tasks';

export const useProject = () => {
  const storage = useStorageContext();

  const createProject = useCallback(async (project: Omit<ProjectSchema, 'itemId' | 'created' | 'lastUpdated'>) => {
    const dbData = {
      name: project.name
    };

    const transform = (dbData: any): ProjectSchema => ({
      ...dbData,
      itemId: dbData.item_id,
      created: dbData.created,
      lastUpdated: dbData.last_updated
    });

    return storage.createEntity<ProjectSchema>('projects', dbData, transform);
  }, [storage]);

  const updateProject = useCallback(async (itemId: string, updates: Partial<Omit<ProjectSchema, 'itemId' | 'created' | 'lastUpdated'>>) => {
    const dbUpdates: Partial<Omit<ProjectSchema, 'itemId' | 'created' | 'lastUpdated'>> = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;

    await storage.updateEntity<ProjectSchema>('projects', itemId, dbUpdates);
  }, [storage]);

  const deleteProject = useCallback(async (itemId: string) => {
    await storage.deleteEntity('projects', itemId, {
      cascade: [
        { table: 'tasks', foreignKey: 'project_id' }
      ]
    });
  }, [storage]);

  return {
    // Data
    projects: storage.projects,
    
    // Operations
    createProject,
    updateProject,
    deleteProject,
    
    // Loading and error states
    isLoading: storage.isLoading,
    error: storage.error,
    lastUpdated: storage.lastUpdated,
    
    // Refresh
    refreshData: storage.refreshData
  };
}; 