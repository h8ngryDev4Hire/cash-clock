import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Task {
  id: string;
  name: string;
  totalTime: number; // in seconds
  projectId?: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface TimeEntry {
  id: string;
  taskId: string;
  startTime: number; // timestamp
  endTime: number | null; // timestamp
  duration: number; // in seconds
}

interface TaskContextType {
  tasks: Task[];
  timeEntries: TimeEntry[];
  currentTask: Task | null;
  addTask: (name: string, projectId?: string) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  startTimeEntry: (taskId: string) => TimeEntry;
  stopTimeEntry: (entryId: string) => TimeEntry;
  getTaskById: (id: string) => Task | undefined;
  getTimeEntriesForTask: (taskId: string) => TimeEntry[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTask = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTask must be used within a TaskProvider');
  }
  return context;
};

// Mock data for initial state
const initialTasks: Task[] = [
  { 
    id: "1", 
    name: "Design UI Mockups", 
    totalTime: 7200, 
    createdAt: Date.now(), 
    updatedAt: Date.now() 
  },
  { 
    id: "2", 
    name: "Code Timer Functionality", 
    totalTime: 10800, 
    createdAt: Date.now(), 
    updatedAt: Date.now() 
  },
  { 
    id: "3", 
    name: "Fix Navigation Issue", 
    totalTime: 3600, 
    createdAt: Date.now(), 
    updatedAt: Date.now() 
  },
  { 
    id: "4", 
    name: "Research SQLite Implementation", 
    totalTime: 5400, 
    createdAt: Date.now(), 
    updatedAt: Date.now() 
  },
];

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  // In a real app, we would load the tasks from SQLite here
  // This is just a placeholder for now
  useEffect(() => {
    // Load tasks from storage
    // For MVP, we'll just use the mock data
  }, []);

  const addTask = (name: string, projectId?: string): Task => {
    const now = Date.now();
    const newTask: Task = {
      id: Date.now().toString(),
      name,
      totalTime: 0,
      projectId,
      createdAt: now,
      updatedAt: now,
    };
    
    setTasks(prevTasks => [...prevTasks, newTask]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === id 
          ? { ...task, ...updates, updatedAt: Date.now() } 
          : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    setTimeEntries(prevEntries => prevEntries.filter(entry => entry.taskId !== id));
  };

  const startTimeEntry = (taskId: string): TimeEntry => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task with id ${taskId} not found`);
    }

    const now = Date.now();
    const newEntry: TimeEntry = {
      id: now.toString(),
      taskId,
      startTime: now,
      endTime: null,
      duration: 0,
    };

    setTimeEntries(prev => [...prev, newEntry]);
    setCurrentTask(task);

    return newEntry;
  };

  const stopTimeEntry = (entryId: string): TimeEntry => {
    const now = Date.now();
    let updatedEntry: TimeEntry | null = null;

    setTimeEntries(prev => 
      prev.map(entry => {
        if (entry.id === entryId && entry.endTime === null) {
          const duration = Math.floor((now - entry.startTime) / 1000);
          updatedEntry = {
            ...entry,
            endTime: now,
            duration,
          };
          return updatedEntry;
        }
        return entry;
      })
    );

    if (updatedEntry && currentTask) {
      const newTotalTime = currentTask.totalTime + (updatedEntry.duration || 0);
      updateTask(currentTask.id, { totalTime: newTotalTime });
      setCurrentTask(null);
    }

    return updatedEntry || { id: "", taskId: "", startTime: 0, endTime: 0, duration: 0 };
  };

  const getTaskById = (id: string) => {
    return tasks.find(task => task.id === id);
  };

  const getTimeEntriesForTask = (taskId: string) => {
    return timeEntries.filter(entry => entry.taskId === taskId);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        timeEntries,
        currentTask,
        addTask,
        updateTask,
        deleteTask,
        startTimeEntry,
        stopTimeEntry,
        getTaskById,
        getTimeEntriesForTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};