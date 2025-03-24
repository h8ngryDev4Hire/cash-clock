import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useProject } from '../useProject';
import { useStorageContext } from '../../context/StorageContext';

// Mock the StorageContext
jest.mock('../../context/StorageContext', () => ({
  useStorageContext: jest.fn()
}));

describe('useProject', () => {
  const mockStorageContext = {
    tasks: [],
    timeEntries: [],
    projects: [],
    isLoading: false,
    error: null,
    lastUpdated: null,
    refreshData: jest.fn(),
    createEntity: jest.fn(),
    updateEntity: jest.fn(),
    deleteEntity: jest.fn(),
    findEntity: jest.fn(),
    findEntities: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useStorageContext as jest.Mock).mockReturnValue(mockStorageContext);
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useProject());

    expect(result.current.projects).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdated).toBeNull();
  });

  describe('createProject', () => {
    it('should create a new project', async () => {
      const { result } = renderHook(() => useProject());

      const newProject = {
        name: 'Test Project'
      };

      const mockCreatedProject = {
        itemId: 'test_id',
        ...newProject,
        created: 1000,
        lastUpdated: 1000
      };

      (mockStorageContext.createEntity as jest.Mock).mockResolvedValue(mockCreatedProject);

      await act(async () => {
        await result.current.createProject(newProject);
      });

      expect(mockStorageContext.createEntity).toHaveBeenCalledWith(
        'projects',
        expect.objectContaining({
          name: newProject.name
        }),
        expect.any(Function)
      );
    });
  });

  describe('updateProject', () => {
    it('should update an existing project', async () => {
      const { result } = renderHook(() => useProject());

      const itemId = 'test_id';
      const updates = {
        name: 'Updated Project'
      };

      await act(async () => {
        await result.current.updateProject(itemId, updates);
      });

      expect(mockStorageContext.updateEntity).toHaveBeenCalledWith(
        'projects',
        itemId,
        expect.objectContaining(updates)
      );
    });
  });

  describe('deleteProject', () => {
    it('should delete a project and update related tasks', async () => {
      const { result } = renderHook(() => useProject());

      const itemId = 'test_id';

      await act(async () => {
        await result.current.deleteProject(itemId);
      });

      expect(mockStorageContext.deleteEntity).toHaveBeenCalledWith(
        'projects',
        itemId,
        expect.objectContaining({
          cascade: [
            { table: 'tasks', foreignKey: 'project_id' }
          ]
        })
      );
    });
  });
}); 