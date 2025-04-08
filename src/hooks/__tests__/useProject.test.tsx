import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useProject } from '../useProject';
import { StorageContext } from '@context/StorageContext';
import { ProjectSchema, TaskSchema, TimeEntrySchema } from '@def/entities';

// Mock the utility functions
jest.mock('@lib/util/project/projectTransformers', () => ({
  transformProjectSchemaToModel: jest.fn((schema) => ({
    id: schema.itemId,
    name: schema.name,
    description: schema.description,
    color: schema.color,
    createdAt: schema.created,
    updatedAt: schema.lastUpdated
  })),
  enhanceProjectWithStats: jest.fn((project) => ({
    ...project,
    taskCount: 0,
    completedTaskCount: 0,
    completionPercentage: 0,
    totalTime: 0
  })),
}));

jest.mock('@lib/util/project/projectColors', () => ({
  getDefaultColor: jest.fn(() => ({ id: 'blue', name: 'Blue', value: '#3B82F6' })),
}));

// Mock React.useContext
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useContext: jest.fn()
  };
});

describe('useProject', () => {
  const mockProjects: ProjectSchema[] = [
    {
      itemId: 'project_1',
      name: 'Project 1',
      description: 'Description 1',
      color: 'blue',
      created: 1000,
      lastUpdated: 1000
    },
    {
      itemId: 'project_2',
      name: 'Project 2',
      color: 'red',
      created: 2000,
      lastUpdated: 2000
    }
  ];

  const mockTasks: TaskSchema[] = [
    {
      itemId: 'task_1',
      name: 'Task 1',
      isRunning: false,
      isGrouped: false,
      isCompleted: false,
      projectId: 'project_1',
      created: 1000,
      lastUpdated: 1000,
      timeEntries: []
    },
    {
      itemId: 'task_2',
      name: 'Task 2',
      isRunning: false,
      isGrouped: false,
      isCompleted: true,
      projectId: 'project_1',
      created: 2000,
      lastUpdated: 2000,
      timeEntries: []
    },
    {
      itemId: 'task_3',
      name: 'Task 3',
      isRunning: false,
      isGrouped: false,
      isCompleted: false,
      projectId: 'project_2',
      created: 3000,
      lastUpdated: 3000,
      timeEntries: []
    }
  ];

  const mockTimeEntries: TimeEntrySchema[] = [];

  const mockStorageContext = {
    projects: mockProjects,
    tasks: mockTasks,
    timeEntries: mockTimeEntries,
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
    (React.useContext as jest.Mock).mockImplementation((context) => {
      if (context === StorageContext) {
        return mockStorageContext;
      }
      return undefined;
    });
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useProject());

    expect(result.current.projects).toEqual(mockProjects);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdated).toBeNull();
  });

  describe('getAllProjects', () => {
    it('should return all projects with stats', () => {
      const { result } = renderHook(() => useProject());

      const projects = result.current.getAllProjects();
      expect(projects).toHaveLength(mockProjects.length);
      expect(projects[0]).toHaveProperty('taskCount');
      expect(projects[0]).toHaveProperty('totalTime');
    });
  });

  describe('getProjectById', () => {
    it('should return a project by ID', () => {
      const { result } = renderHook(() => useProject());

      const project = result.current.getProjectById('project_1');
      expect(project).toBeDefined();
      expect(project?.id).toBe('project_1');
    });

    it('should return undefined for non-existent project', () => {
      const { result } = renderHook(() => useProject());

      const project = result.current.getProjectById('non_existent');
      expect(project).toBeUndefined();
    });
  });

  describe('createProject', () => {
    it('should create a new project with default color', async () => {
      const { result } = renderHook(() => useProject());

      const newProject = {
        name: 'Test Project',
        description: 'Test Description'
      };

      const mockCreatedProject = {
        itemId: 'new_project_id',
        name: newProject.name,
        description: newProject.description,
        color: 'blue',
        created: 3000,
        lastUpdated: 3000
      };

      (mockStorageContext.createEntity as jest.Mock).mockResolvedValue(mockCreatedProject);

      await act(async () => {
        await result.current.createProject(newProject);
      });

      expect(mockStorageContext.createEntity).toHaveBeenCalledWith(
        'projects',
        expect.objectContaining({
          name: newProject.name,
          description: newProject.description,
          color: 'blue'
        }),
        expect.any(Function)
      );
    });

    it('should create a new project with specified color', async () => {
      const { result } = renderHook(() => useProject());

      const newProject = {
        name: 'Test Project',
        color: 'red'
      };

      await act(async () => {
        await result.current.createProject(newProject);
      });

      expect(mockStorageContext.createEntity).toHaveBeenCalledWith(
        'projects',
        expect.objectContaining({
          name: newProject.name,
          color: 'red'
        }),
        expect.any(Function)
      );
    });
  });

  describe('updateProject', () => {
    it('should update an existing project', async () => {
      const { result } = renderHook(() => useProject());

      const projectId = 'project_1';
      const updates = {
        name: 'Updated Project',
        description: 'Updated Description',
        color: 'green'
      };

      await act(async () => {
        await result.current.updateProject(projectId, updates);
      });

      expect(mockStorageContext.updateEntity).toHaveBeenCalledWith(
        'projects',
        projectId,
        expect.objectContaining(updates)
      );
    });

    it('should update only specified fields', async () => {
      const { result } = renderHook(() => useProject());

      const projectId = 'project_1';
      const updates = {
        name: 'Updated Project'
      };

      await act(async () => {
        await result.current.updateProject(projectId, updates);
      });

      expect(mockStorageContext.updateEntity).toHaveBeenCalledWith(
        'projects',
        projectId,
        expect.objectContaining({ name: 'Updated Project' })
      );
      expect(mockStorageContext.updateEntity).not.toHaveBeenCalledWith(
        'projects',
        projectId,
        expect.objectContaining({ description: expect.anything() })
      );
    });
  });

  describe('deleteProject', () => {
    it('should unlink tasks and delete the project', async () => {
      mockStorageContext.tasks = [
        {
          itemId: 'task_1',
          name: 'Task 1',
          isRunning: false,
          isGrouped: false,
          isCompleted: false,
          projectId: 'project_1',
          created: 1000,
          lastUpdated: 1000
        }
      ];

      const { result } = renderHook(() => useProject());

      const projectId = 'project_1';

      await act(async () => {
        await result.current.deleteProject(projectId);
      });

      // First, should unlink tasks
      expect(mockStorageContext.updateEntity).toHaveBeenCalledWith(
        'tasks', 
        'task_1',
        { projectId: null }
      );

      // Then, should delete the project
      expect(mockStorageContext.deleteEntity).toHaveBeenCalledWith(
        'projects',
        projectId
      );
    });
  });

  describe('getProjectTasks', () => {
    it('should return tasks for a specific project', () => {
      const { result } = renderHook(() => useProject());

      const tasks = result.current.getProjectTasks('project_1');
      expect(tasks).toHaveLength(2);
      expect(tasks[0].id).toBe('task_1');
      expect(tasks[1].id).toBe('task_2');
    });
  });

  describe('task-project relationship', () => {
    it('should assign a task to a project', async () => {
      const { result } = renderHook(() => useProject());

      await act(async () => {
        await result.current.assignTaskToProject('task_3', 'project_1');
      });

      expect(mockStorageContext.updateEntity).toHaveBeenCalledWith(
        'tasks',
        'task_3',
        { projectId: 'project_1' }
      );
    });

    it('should remove a task from a project', async () => {
      const { result } = renderHook(() => useProject());

      await act(async () => {
        await result.current.removeTaskFromProject('task_1');
      });

      expect(mockStorageContext.updateEntity).toHaveBeenCalledWith(
        'tasks',
        'task_1',
        { projectId: null }
      );
    });

    it('should move multiple tasks between projects', async () => {
      const { result } = renderHook(() => useProject());

      await act(async () => {
        await result.current.moveTasksBetweenProjects(['task_1', 'task_2'], 'project_2');
      });

      expect(mockStorageContext.updateEntity).toHaveBeenCalledTimes(2);
      expect(mockStorageContext.updateEntity).toHaveBeenCalledWith(
        'tasks',
        'task_1',
        { projectId: 'project_2' }
      );
      expect(mockStorageContext.updateEntity).toHaveBeenCalledWith(
        'tasks',
        'task_2',
        { projectId: 'project_2' }
      );
    });
  });
}); 