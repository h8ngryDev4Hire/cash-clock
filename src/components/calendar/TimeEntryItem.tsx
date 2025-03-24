import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { format } from 'date-fns';

interface TimeEntry {
  id: string;
  taskId: string;
  taskName: string;
  startTime: number;
  endTime: number;
  color: string;
}

interface TimeEntryItemProps {
  entry: TimeEntry;
  onPress?: () => void;
}

/**
 * TimeEntryItem component renders a time entry block in the timeline
 */
const TimeEntryItem: React.FC<TimeEntryItemProps> = ({ entry, onPress }) => {
  // Calculate position and height for time entry
  const getTimeEntryStyle = () => {
    const start = new Date(entry.startTime);
    const end = new Date(entry.endTime);
    
    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const endHour = end.getHours();
    const endMinute = end.getMinutes();
    
    const hourHeight = 60; // Height of each hour in pixels
    const topPosition = (startHour * hourHeight) + (startMinute / 60 * hourHeight);
    const durationHours = (endHour - startHour) + ((endMinute - startMinute) / 60);
    const height = Math.max(durationHours * hourHeight, 30); // Minimum height for visibility
    
    return {
      position: 'absolute',
      top: topPosition,
      left: 60, // Leave space for hour labels
      right: 10,
      height,
      backgroundColor: entry.color + '20', // Light version of the color
      borderLeftWidth: 4,
      borderLeftColor: entry.color,
      borderRadius: 8,
      padding: 8,
      zIndex: 1,
    };
  };

  return (
    <Pressable 
      style={getTimeEntryStyle()}
      onPress={onPress}
      accessibilityLabel={`${entry.taskName} from ${format(new Date(entry.startTime), 'h:mm a')} to ${format(new Date(entry.endTime), 'h:mm a')}`}
      accessibilityHint="Tap to view or edit this time entry"
    >
      <Text className="font-medium text-sm text-gray-800">{entry.taskName}</Text>
      <Text className="text-xs text-gray-600">
        {format(new Date(entry.startTime), 'h:mm a')} - {format(new Date(entry.endTime), 'h:mm a')}
      </Text>
    </Pressable>
  );
};

export default TimeEntryItem;