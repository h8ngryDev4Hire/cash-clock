import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useTask } from '../useTask';
import { useStorageContext } from '../../context/StorageContext';

// Mock the StorageContext
jest.mock('../../context/StorageContext', () => ({
  useStorageContext: jest.fn()
}));

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

  beforeEach(() => {
    jest.clearAllMocks();
    (useStorageContext as jest.Mock).mockReturnValue(mockStorageContext);
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useTask());

    expect(result.current.tasks).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdated).toBeNull();
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const { result } = renderHook(() => useTask());

      const newTask = {
        name: 'Test Task',
        isRunning: false,
        isGrouped: false,
        isCompleted: false,
        projectId: null
      };

      const mockCreatedTask = {
        itemId: 'test_id',
        ...newTask,
        created: 1000,
        lastUpdated: 1000,
        timeEntries: [],
        getTotalTimeSpent: expect.any(Function)
      };

      (mockStorageContext.createEntity as jest.Mock).mockResolvedValue(mockCreatedTask);

      await act(async () => {
        await result.current.createTask(newTask);
      });

      expect(mockStorageContext.createEntity).toHaveBeenCalledWith(
        'tasks',
        expect.objectContaining({
          name: newTask.name,
          isRunning: newTask.isRunning,
          isGrouped: newTask.isGrouped,
          isCompleted: newTask.isCompleted,
          projectId: newTask.projectId
        }),
        expect.any(Function)
      );
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

      expect(mockStorageContext.updateEntity).toHaveBeenCalledWith(
        'tasks',
        itemId,
        expect.objectContaining(updates)
      );
    });
  });

  describe('deleteTask', () => {
    it('should delete a task and its time entries', async () => {
      const { result } = renderHook(() => useTask());

      const itemId = 'test_id';

      await act(async () => {
        await result.current.deleteTask(itemId);
      });

      expect(mockStorageContext.deleteEntity).toHaveBeenCalledWith(
        'tasks',
        itemId,
        expect.objectContaining({
          cascade: [
            { table: 'time_entries', foreignKey: 'task_id' }
          ]
        })
      );
    });
  });

  describe('getTaskById', () => {
    it('should return a task by id', () => {
      const mockTask = {
        itemId: 'test_id',
        name: 'Test Task',
        isRunning: false,
        isGrouped: false,
        isCompleted: false,
        projectId: null,
        created: 1000,
        lastUpdated: 1000,
        timeEntries: [],
        getTotalTimeSpent: () => 0
      };

      (useStorageContext as jest.Mock).mockReturnValue({
        ...mockStorageContext,
        tasks: [mockTask]
      });

      const { result } = renderHook(() => useTask());

      const task = result.current.getTaskById('test_id');
      expect(task).toEqual(mockTask);
    });

    it('should return undefined for non-existent task', () => {
      const { result } = renderHook(() => useTask());

      const task = result.current.getTaskById('non_existent');
      expect(task).toBeUndefined();
    });
  });
}); 