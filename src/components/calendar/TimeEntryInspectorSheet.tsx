import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import BottomSheet from '../shared/BottomSheet';
import { CalendarTimeEntry } from '@hooks/useCalendarEntries';
import { formatDuration } from '@lib/util/time/timeFormatters';

interface TimeEntryInspectorSheetProps {
  isVisible: boolean;
  onClose: () => void;
  entryId: string | null;
  entries: CalendarTimeEntry[];
  onEditEntry?: (entryId: string) => void;
}

/**
 * Bottom sheet that displays details about a selected time entry
 */
const TimeEntryInspectorSheet: React.FC<TimeEntryInspectorSheetProps> = ({
  isVisible,
  onClose,
  entryId,
  entries,
  onEditEntry
}) => {
  const [entry, setEntry] = useState<CalendarTimeEntry | null>(null);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Find the selected entry when entryId changes
  useEffect(() => {
    if (entryId && entries.length > 0) {
      const foundEntry = entries.find(e => e.id === entryId);
      setEntry(foundEntry || null);
    } else {
      setEntry(null);
    }
  }, [entryId, entries]);

  // Handler for edit button
  const handleEdit = () => {
    if (entry && onEditEntry) {
      onEditEntry(entry.id);
      onClose();
    }
  };
  
  // Calculate duration of the time entry
  const getDuration = () => {
    if (!entry) return '';
    
    const durationMs = entry.endTime - entry.startTime;
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    return formatDuration(durationMinutes * 60); // Convert minutes to seconds for the formatter
  };

  return (
    <BottomSheet
      isVisible={isVisible && !!entry}
      onClose={onClose}
      height={350}
    >
      {entry ? (
        <View className="flex-1 p-4">
          {/* Header with task name and color */}
          <View className="flex-row items-center mb-4">
            <View className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
            <Text className={`text-lg font-bold flex-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {entry.taskName}
            </Text>
            <Pressable onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color={isDark ? '#9CA3AF' : '#6B7280'} />
            </Pressable>
          </View>
          
          {/* Project information if available */}
          {entry.projectName && (
            <View className="flex-row items-center mb-3">
              <Ionicons name="folder-outline" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} className="mr-2" />
              <Text className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                {entry.projectName}
              </Text>
            </View>
          )}
          
          {/* Time information */}
          <View className={`p-3 rounded-lg mb-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <View className="flex-row items-center mb-2">
              <Ionicons name="time-outline" size={18} color={isDark ? '#9CA3AF' : '#6B7280'} className="mr-2" />
              <Text className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                Time
              </Text>
            </View>
            
            <View className="flex-row items-center justify-between mb-1">
              <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>Start</Text>
              <Text className={isDark ? 'text-gray-200' : 'text-gray-800'}>
                {format(new Date(entry.startTime), 'h:mm a')}
              </Text>
            </View>
            
            <View className="flex-row items-center justify-between mb-1">
              <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>End</Text>
              <Text className={isDark ? 'text-gray-200' : 'text-gray-800'}>
                {format(new Date(entry.endTime), 'h:mm a')}
              </Text>
            </View>
            
            <View className="flex-row items-center justify-between">
              <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>Duration</Text>
              <Text className={isDark ? 'text-gray-200' : 'text-gray-800'}>
                {getDuration()}
              </Text>
            </View>
          </View>
          
          {/* Action buttons */}
          <View className="flex-row mt-auto">
            {onEditEntry && (
              <Pressable 
                className="w-full bg-blue-500 py-3 rounded-lg items-center"
                onPress={handleEdit}
              >
                <Text className="text-white font-medium">Edit Entry</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <View className="flex-1 justify-center items-center p-4">
          <Text className={isDark ? 'text-gray-400' : 'text-gray-500'}>
            No time entry selected
          </Text>
        </View>
      )}
    </BottomSheet>
  );
};

export default TimeEntryInspectorSheet; 