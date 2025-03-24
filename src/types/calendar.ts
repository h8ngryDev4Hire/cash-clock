import { TimeEntry, Task } from './definitions';

/**
 * CalendarEntry extends TimeEntry with additional display properties
 * for rendering in the calendar view
 */
export interface CalendarEntry extends TimeEntry {
  taskName: string;
  color: string;
}

/**
 * CalendarDay represents a day in the calendar navigation
 */
export interface CalendarDay {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
}

/**
 * TimeBlock represents a visual block in the hourly timeline
 */
export interface TimeBlock {
  id: string;
  startTime: number; // timestamp
  endTime: number; // timestamp
  taskId: string;
  taskName: string;
  color: string;
  height: number; // calculated height in pixels
  top: number; // calculated top position in pixels
}

/**
 * CalendarViewProps defines the props for the calendar view component
 */
export interface CalendarViewProps {
  initialDate?: Date;
  timeEntries?: TimeEntry[];
  tasks?: Task[];
  onTimeEntryPress?: (entryId: string) => void;
  onAddTimeEntry?: (hour: number, date: Date) => void;
  onSwipeChangeDate?: (date: Date) => void;
}