// Mock all problematic modules before any imports
jest.mock('react-native-css-interop/src/runtime/native/appearance-observables', () => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  getColorScheme: jest.fn(() => 'light'),
  resetAppearanceListeners: jest.fn(),
}), { virtual: true });

jest.mock('react-native-css-interop/src/runtime/native/api', () => ({
  cssInterop: jest.fn(),
  useColorScheme: jest.fn(() => 'light'),
  resetAppearanceListeners: jest.fn(),
}), { virtual: true });

jest.mock('react-native-css-interop/src/runtime/api.native', () => ({
  cssInterop: jest.fn(),
  useColorScheme: jest.fn(() => 'light'),
  resetAppearanceListeners: jest.fn(),
}), { virtual: true });

jest.mock('react-native-css-interop/src/runtime/wrap-jsx', () => ({
  cssInterop: jest.fn()
}), { virtual: true });

jest.mock('react-native-css-interop/src/runtime/jsx-runtime', () => ({
  cssInterop: jest.fn()
}), { virtual: true });

// Mock StorageService before importing modules that depend on it
jest.mock('../../services/storage/StorageService', () => ({
  storageService: {
    initialize: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  }
}), { virtual: true });

// Continue with imports after mocks are set up
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useTimeEntry } from '../useTimeEntry';
import { useStorageContext } from '../../context/StorageContext';
import { TimeEntrySchema } from '../../types/tasks';

// Mock the StorageContext
jest.mock('../../context/StorageContext');

// Mock react-native-css-interop
jest.mock('react-native-css-interop', () => ({
  cssInterop: jest.fn(),
  useColorScheme: jest.fn(() => 'light'),
  resetAppearanceListeners: jest.fn(),
  default: {
    cssInterop: jest.fn(),
    useColorScheme: jest.fn(() => 'light'),
    resetAppearanceListeners: jest.fn(),
  },
  __esModule: true,
}));

describe('useTimeEntry', () => {
  const mockStorageContext = {
    timeEntries: [] as TimeEntrySchema[],
    createEntity: jest.fn(),
    updateEntity: jest.fn(),
    deleteEntity: jest.fn(),
    isLoading: false,
    error: null,
    lastUpdated: new Date().getTime(),
    refreshData: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useStorageContext as jest.Mock).mockReturnValue(mockStorageContext);
    mockStorageContext.createEntity.mockImplementation(() => Promise.resolve());
    mockStorageContext.updateEntity.mockImplementation(() => Promise.resolve());
    mockStorageContext.deleteEntity.mockImplementation(() => Promise.resolve());
  });

  it('should create a time entry and update task running state', async () => {
    const { result } = renderHook(() => useTimeEntry());
    const now = new Date().getTime();
    const newEntry = {
      taskId: 'test_task_id',
      isRunning: true,
      timeSpent: 0,
      timeStarted: now,
      timeEnded: null,
    };

    await act(async () => {
      await result.current.createTimeEntry(newEntry);
    });

    // Check if createEntity was called with correct parameters
    expect(mockStorageContext.createEntity).toHaveBeenCalledWith(
      'time_entries',
      {
        taskId: newEntry.taskId,
        isRunning: newEntry.isRunning,
        timeSpent: newEntry.timeSpent,
        timeStarted: newEntry.timeStarted,
        timeEnded: newEntry.timeEnded,
      },
      expect.any(Function)
    );

    // Check if updateEntity was called to update task running state
    expect(mockStorageContext.updateEntity).toHaveBeenCalledWith(
      'tasks',
      'test_task_id',
      { isRunning: true }
    );
  });

  it('should update a time entry and handle task running state', async () => {
    const now = new Date().getTime();
    mockStorageContext.timeEntries = [
      {
        itemId: 'test_id',
        taskId: 'test_task_id',
        isRunning: true,
        timeSpent: 0,
        timeStarted: now,
        timeEnded: null,
        created: now,
        lastUpdated: now,
      },
    ];

    const { result } = renderHook(() => useTimeEntry());

    await act(async () => {
      await result.current.updateTimeEntry('test_id', { isRunning: false });
    });

    // Check if updateEntity was called for the time entry
    expect(mockStorageContext.updateEntity).toHaveBeenCalledWith(
      'time_entries',
      'test_id',
      { isRunning: false }
    );

    // Check if updateEntity was called to update task running state
    expect(mockStorageContext.updateEntity).toHaveBeenCalledWith(
      'tasks',
      'test_task_id',
      { isRunning: false }
    );
  });

  it('should delete a time entry and update task running state', async () => {
    const now = new Date().getTime();
    mockStorageContext.timeEntries = [
      {
        itemId: 'test_id',
        taskId: 'test_task_id',
        isRunning: true,
        timeSpent: 0,
        timeStarted: now,
        timeEnded: null,
        created: now,
        lastUpdated: now,
      },
    ];

    const { result } = renderHook(() => useTimeEntry());

    await act(async () => {
      await result.current.deleteTimeEntry('test_id');
    });

    // Check if deleteEntity was called
    expect(mockStorageContext.deleteEntity).toHaveBeenCalledWith(
      'time_entries',
      'test_id'
    );

    // Check if updateEntity was called to update task running state
    expect(mockStorageContext.updateEntity).toHaveBeenCalledWith(
      'tasks',
      'test_task_id',
      { isRunning: false }
    );
  });

  it('should get time entries for a task', () => {
    const now = new Date().getTime();
    const timeEntries = [
      {
        itemId: 'test_id_1',
        taskId: 'test_task_id',
        isRunning: false,
        timeSpent: 0,
        timeStarted: now,
        timeEnded: now + 3600000, // 1 hour later
        created: now,
        lastUpdated: now,
      },
      {
        itemId: 'test_id_2',
        taskId: 'different_task_id',
        isRunning: false,
        timeSpent: 0,
        timeStarted: now,
        timeEnded: now + 3600000,
        created: now,
        lastUpdated: now,
      },
    ];

    mockStorageContext.timeEntries = timeEntries;

    const { result } = renderHook(() => useTimeEntry());
    const filteredEntries = result.current.getTimeEntriesForTask('test_task_id');

    expect(filteredEntries).toHaveLength(1);
    expect(filteredEntries[0].itemId).toBe('test_id_1');
  });
}); 