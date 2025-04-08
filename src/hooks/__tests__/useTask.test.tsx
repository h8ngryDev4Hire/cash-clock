import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useTask } from '../useTask';
import { StorageContext } from '../../context/StorageContext';
import { TaskContext } from '../../context/TaskContext';

// Mock React.useContext
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useContext: jest.fn()
  };
});

describe('useTask', () => {
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

  const mockTaskContext = {
    createTask: jest.fn(),
    updateTask: jest.fn(),
    deleteTask: jest.fn(),
    getTaskById: jest.fn(),
    getTimeEntriesForTask: jest.fn(),
    getTaskTotalTime: jest.fn(),
    completeTask: jest.fn(),
    reopenTask: jest.fn(),
    assignTaskToProject: jest.fn(),
    unassignTaskFromProject: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (React.useContext as jest.Mock).mockImplementation((context) => {
      if (context === StorageContext) {
        return mockStorageContext;
      }
      if (context === TaskContext) {
        return mockTaskContext;
      }
      return undefined;
    });
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useTask());

    expect(result.current.tasks).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      mockTaskContext.createTask.mockResolvedValue({
        itemId: 'test_id',
        name: 'Test Task',
        isRunning: false,
        isGrouped: false,
        isCompleted: false,
        projectId: null,
        created: 1000,
        lastUpdated: 1000
      });

      const { result } = renderHook(() => useTask());

      await act(async () => {
        await result.current.createTask('Test Task');
      });

      expect(mockTaskContext.createTask).toHaveBeenCalledWith('Test Task', undefined);
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', async () => {
      const { result } = renderHook(() => useTask());

      const itemId = 'test_id';
      const updates = {
        name: 'Updated Task',
        isCompleted: true
      };

      await act(async () => {
        await result.current.updateTask(itemId, updates);
      });

      expect(mockTaskContext.updateTask).toHaveBeenCalledWith(itemId, updates);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      const { result } = renderHook(() => useTask());

      const itemId = 'test_id';

      await act(async () => {
        await result.current.deleteTask(itemId);
      });

      expect(mockTaskContext.deleteTask).toHaveBeenCalledWith(itemId);
    });
  });

  describe('getTaskWithTime', () => {
    it('should return a task with its total time', async () => {
      const mockTask = {
        itemId: 'test_id',
        name: 'Test Task',
        isRunning: false,
        isGrouped: false,
        isCompleted: false,
        projectId: null,
        created: 1000,
        lastUpdated: 1000
      };
      
      mockTaskContext.getTaskById.mockResolvedValue(mockTask);
      mockTaskContext.getTaskTotalTime.mockResolvedValue(3600); // 1 hour in seconds
      
      const { result } = renderHook(() => useTask());

      let task;
      await act(async () => {
        task = await result.current.getTaskWithTime('test_id');
      });
      
      expect(mockTaskContext.getTaskById).toHaveBeenCalledWith('test_id');
      expect(mockTaskContext.getTaskTotalTime).toHaveBeenCalledWith('test_id');
      expect(task).toHaveProperty('totalTime', 3600);
    });

    it('should return null for non-existent task', async () => {
      mockTaskContext.getTaskById.mockResolvedValue(null);
      
      const { result } = renderHook(() => useTask());

      let task;
      await act(async () => {
        task = await result.current.getTaskWithTime('non_existent');
      });
      
      expect(task).toBeNull();
    });
  });
}); 