import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { addDays } from 'date-fns';
import DaySelector from '../components/calendar/DaySelector';
import HourlyTimeline from '../components/calendar/HourlyTimeline';
import { log } from '@lib/util/debugging/logging';

/**
 * CalendarScreen displays a 24-hour calendar view with time entries
 */
export default function CalendarScreen() {
  // State for the currently selected day
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Generate array of days for horizontal navigation (3 days before, selected day, 3 days after)
  const daysToDisplay = Array.from({ length: 7 }, (_, i) => {
    const offset = i - 3; // -3, -2, -1, 0, 1, 2, 3
    return addDays(selectedDate, offset);
  });
  
  // Handle day selection
  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
    // Additional logic to fetch entries for the selected day would be added here
  };
  
  // Dummy time entries for demonstration
  const timeEntries = [
    {
      id: '1',
      taskId: 'task1',
      taskName: 'Project Planning',
      startTime: new Date(selectedDate).setHours(9, 30),
      endTime: new Date(selectedDate).setHours(11, 45),
      color: '#4CAF50'
    },
    {
      id: '2',
      taskId: 'task2',
      taskName: 'Team Meeting',
      startTime: new Date(selectedDate).setHours(13, 0),
      endTime: new Date(selectedDate).setHours(14, 0),
      color: '#2196F3'
    },
    {
      id: '3',
      taskId: 'task3',
      taskName: 'Development',
      startTime: new Date(selectedDate).setHours(15, 15),
      endTime: new Date(selectedDate).setHours(18, 30),
      color: '#FF9800'
    }
  ];
  
  // Handle time entry press
  const handleEntryPress = (entryId: string) => {
    log('Time entry pressed: ' + entryId, 'CalendarScreen', 'INFO');
    // In a real app, navigate to entry detail/edit
  };
  
  // Handle add new entry
  const handleAddEntry = () => {
    log('Add new time entry', 'CalendarScreen', 'INFO');
    // In a real app, open a modal or navigate to entry creation
  };

  return (
    <View className="flex-1 bg-white">
      {/* Day navigation with date display */}
      <DaySelector 
        days={daysToDisplay}
        selectedDate={selectedDate}
        onSelectDay={handleDayPress}
      />
      
      {/* Hourly timeline with entries */}
      <HourlyTimeline 
        selectedDate={selectedDate}
        entries={timeEntries}
        onEntryPress={handleEntryPress}
      />
      
      {/* Floating action button to add new time entry */}
      <Pressable 
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full justify-center items-center shadow-md"
        onPress={handleAddEntry}
        accessibilityLabel="Add new time entry"
        accessibilityHint="Opens form to add a new time entry"
      >
        <Ionicons name="add" size={30} color="white" />
      </Pressable>
    </View>
  );
}