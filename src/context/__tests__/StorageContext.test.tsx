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
jest.mock('@lib/services/storage/StorageService', () => ({
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
import { StorageContext, StorageProvider } from '../StorageContext';
import { TaskSchema, TimeEntrySchema, ProjectSchema } from '../../types/tasks';

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

describe('StorageContext', () => {
  const mockStorageService = jest.requireMock('../../services/storage/StorageService').storageService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorageService.initialize.mockResolvedValue(undefined);
    mockStorageService.find.mockResolvedValue([]);
    mockStorageService.transaction.mockImplementation(async (callback) => {
      await callback({ executeSql: jest.fn() });
    });
  });

  it('should initialize and load data', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StorageProvider>{children}</StorageProvider>
    );

    const { result } = renderHook(() => React.useContext(StorageContext), { wrapper });

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.tasks).toEqual([]);
    expect(result.current.timeEntries).toEqual([]);
    expect(result.current.projects).toEqual([]);

    // Wait for initialization
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // After initialization
    expect(mockStorageService.initialize).toHaveBeenCalled();
    expect(mockStorageService.find).toHaveBeenCalledWith('projects');
    expect(mockStorageService.find).toHaveBeenCalledWith('tasks');
    expect(mockStorageService.find).toHaveBeenCalledWith('time_entries');
    expect(result.current.isLoading).toBe(false);
  });

  it('should create an entity', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StorageProvider>{children}</StorageProvider>
    );

    const { result } = renderHook(() => React.useContext(StorageContext), { wrapper });

    const mockData = {
      name: 'Test Task',
      isRunning: false,
      isGrouped: false,
      isCompleted: false,
      projectId: null,
      timeEntries: [] as TimeEntrySchema[],
      getTotalTimeSpent: () => 0,
    };

    mockStorageService.insert.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.createEntity<TaskSchema>('tasks', mockData);
    });

    expect(mockStorageService.insert).toHaveBeenCalledWith(
      'tasks',
      expect.objectContaining({
        ...mockData,
        created: expect.any(Number),
        last_updated: expect.any(Number),
      })
    );
  });

  it('should update an entity', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StorageProvider>{children}</StorageProvider>
    );

    const { result } = renderHook(() => React.useContext(StorageContext), { wrapper });

    const mockUpdates = {
      name: 'Updated Task',
      isCompleted: true,
    };

    mockStorageService.update.mockResolvedValue(undefined);

    await act(async () => {
      await result.current.updateEntity<TaskSchema>('tasks', 'test_id', mockUpdates);
    });

    expect(mockStorageService.update).toHaveBeenCalledWith(
      'tasks',
      expect.objectContaining({
        ...mockUpdates,
        last_updated: expect.any(Number),
      }),
      'item_id = ?',
      ['test_id']
    );
  });

  it('should delete an entity', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StorageProvider>{children}</StorageProvider>
    );

    const { result } = renderHook(() => React.useContext(StorageContext), { wrapper });

    await act(async () => {
      await result.current.deleteEntity('tasks', 'test_id');
    });

    expect(mockStorageService.transaction).toHaveBeenCalled();
  });

  it('should find an entity', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StorageProvider>{children}</StorageProvider>
    );

    const { result } = renderHook(() => React.useContext(StorageContext), { wrapper });

    const mockEntity = {
      item_id: 'test_id',
      name: 'Test Task',
      is_running: 0,
      is_grouped: 0,
      is_completed: 0,
      project_id: null,
      created: Date.now(),
      last_updated: Date.now(),
    };

    mockStorageService.findOne.mockResolvedValue(mockEntity);

    await act(async () => {
      const entity = await result.current.findEntity<TaskSchema>('tasks', 'test_id');
      expect(entity).toBeTruthy();
      if (entity) {
        expect(entity.itemId).toBe('test_id');
      }
    });

    expect(mockStorageService.findOne).toHaveBeenCalledWith(
      'tasks',
      '*',
      'item_id = ?',
      ['test_id']
    );
  });

  it('should find entities', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StorageProvider>{children}</StorageProvider>
    );

    const { result } = renderHook(() => React.useContext(StorageContext), { wrapper });

    const mockEntities = [
      {
        item_id: 'test_id_1',
        name: 'Test Task 1',
        is_running: 0,
        is_grouped: 0,
        is_completed: 0,
        project_id: null,
        created: Date.now(),
        last_updated: Date.now(),
      },
      {
        item_id: 'test_id_2',
        name: 'Test Task 2',
        is_running: 0,
        is_grouped: 0,
        is_completed: 0,
        project_id: null,
        created: Date.now(),
        last_updated: Date.now(),
      },
    ];

    mockStorageService.find.mockResolvedValue(mockEntities);

    await act(async () => {
      const entities = await result.current.findEntities<TaskSchema>('tasks', 'is_completed = ?', [0]);
      expect(entities).toHaveLength(2);
      expect(entities[0].itemId).toBe('test_id_1');
      expect(entities[1].itemId).toBe('test_id_2');
    });

    expect(mockStorageService.find).toHaveBeenCalledWith(
      'tasks',
      '*',
      'is_completed = ?',
      [0]
    );
  });
}); 