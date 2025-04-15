import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { addDays } from 'date-fns';
import DaySelector from '../components/calendar/DaySelector';
import HourlyTimeline from '../components/calendar/HourlyTimeline';
import TimeEntryInspectorSheet from '../components/calendar/TimeEntryInspectorSheet';
import { log } from '@lib/util/debugging/logging';
import { useCalendarEntries, CalendarTimeEntry } from '../hooks/useCalendarEntries';

/**
 * CalendarScreen displays a 24-hour calendar view with time entries
 */
export default function CalendarScreen() {
  // State for the currently selected day
  const [selectedDate, setSelectedDate] = useState(new Date());
  // State for loading status
  const [isLoading, setIsLoading] = useState(true);
  // State for time entries
  const [timeEntries, setTimeEntries] = useState<CalendarTimeEntry[]>([]);
  // State for the selected time entry
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  // State for bottom sheet visibility
  const [isInspectorVisible, setIsInspectorVisible] = useState(false);
  
  // Use our custom hooks
  const { formatEntriesForCalendar } = useCalendarEntries();
  
  // Generate array of days for horizontal navigation (3 days before, selected day, 3 days after)
  const daysToDisplay = Array.from({ length: 7 }, (_, i) => {
    const offset = i - 3; // -3, -2, -1, 0, 1, 2, 3
    return addDays(selectedDate, offset);
  });
  
  // Load entries whenever the selected date changes
  useEffect(() => {
    loadEntriesForDate(selectedDate);
  }, [selectedDate]);
  
  // Handle day selection
  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
  };
  
  // Load entries for the selected date
  const loadEntriesForDate = async (date: Date) => {
    try {
      setIsLoading(true);
      const entries = await formatEntriesForCalendar(date);
      setTimeEntries(entries);
      log(`Loaded ${entries.length} entries for ${date.toDateString()}`, 
          'CalendarScreen', 'loadEntriesForDate', 'INFO');
    } catch (error) {
      log('Error loading time entries: ' + error, 
          'CalendarScreen', 'loadEntriesForDate', 'ERROR', 
          { variableName: 'error', value: error });
      setTimeEntries([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle time entry press
  const handleEntryPress = (entryId: string) => {
    log('Time entry pressed: ' + entryId, 'CalendarScreen', 'handleEntryPress', 'INFO');
    setSelectedEntryId(entryId);
    setIsInspectorVisible(true);
  };
  
  // Handle inspector close
  const handleInspectorClose = () => {
    setIsInspectorVisible(false);
    // Clear the selected entry after a short delay to allow animation to complete
    setTimeout(() => {
      setSelectedEntryId(null);
    }, 300);
  };
  
  // Handle editing a time entry
  const handleEditEntry = (entryId: string) => {
    log('Edit time entry: ' + entryId, 'CalendarScreen', 'handleEditEntry', 'INFO');
    // Edit functionality to be implemented
  };

  return (
    <View className="flex-1 bg-white">
      {/* Day navigation with date display */}
      <DaySelector 
        days={daysToDisplay}
        selectedDate={selectedDate}
        onSelectDay={handleDayPress}
      />
      
      {/* Loading indicator */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="mt-2 text-gray-500">Loading time entries...</Text>
        </View>
      ) : (
        /* Hourly timeline with entries */
        <HourlyTimeline 
          selectedDate={selectedDate}
          entries={timeEntries}
          onEntryPress={handleEntryPress}
        />
      )}
      
      {/* Time entry inspector */}
      <TimeEntryInspectorSheet
        isVisible={isInspectorVisible}
        onClose={handleInspectorClose}
        entryId={selectedEntryId}
        entries={timeEntries}
        onEditEntry={handleEditEntry}
      />
    </View>
  );
}