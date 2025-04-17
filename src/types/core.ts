/**
 * Task represents a tracked activity in the app
 */
export interface Task {
  id: string;
  name: string;
  totalTime: number; // in seconds
  projectId?: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
  isCompleted?: boolean;
  isRunning?: boolean;
}

/**
 * TimeEntry represents a single instance of time spent on a task
 */
export interface TimeEntry {
  id: string;
  taskId: string;
  startTime: number; // timestamp
  endTime: number | null; // timestamp
  duration: number; // in seconds
}

/**
 * TaskContextType defines the shape of the TaskContext object
 */
export interface TaskContextType {
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

/**
 * TimerContextType defines the shape of the TimerContext object
 */
export interface TimerContextType {
  isRunning: boolean;
  elapsedTime: number;
  currentTaskId: string | null;
  startTimer: (taskId: string) => TimeEntry;
  pauseTimer: () => void;
  stopTimer: (entryId: string) => void;
  resetTimer: () => void;
}

/**
 * Project for grouping related tasks
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  goals?: string;
  milestones?: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Milestone represents a project milestone
 */
export interface Milestone {
  id: string;
  text: string;
}

/**
 * TaskItem represents a simplified task for UI selection
 */
export interface TaskItem {
  id: string;
  title: string;
  isCompleted: boolean;
  projectId?: string | null;
}

/**
 * Common formatting functions
 */
export interface TimeFormatters {
  formatElapsedTime: (seconds: number) => string; // Format as HH:MM:SS
  formatDuration: (seconds: number) => string; // Format as Xh Ym
}