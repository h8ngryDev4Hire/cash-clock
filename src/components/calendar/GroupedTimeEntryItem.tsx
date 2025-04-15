import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { format } from 'date-fns';

interface TimeEntry {
  id: string;
  taskId: string;
  taskName: string;
  startTime: number;
  endTime: number;
  color: string;
}

interface GroupedTimeEntryItemProps {
  entries: TimeEntry[];
  hour: number;
  onEntryPress?: (entryId: string) => void;
}

/**
 * GroupedTimeEntryItem displays multiple time entries as horizontal tabs
 * for a cleaner UI when multiple entries exist in the same time slot
 */
const GroupedTimeEntryItem: React.FC<GroupedTimeEntryItemProps> = ({ 
  entries, 
  hour,
  onEntryPress 
}) => {
  if (!entries || entries.length === 0) return null;
  
  const hourHeight = 60; // Height of each hour in pixels
  
  // Style for the container that holds all entry tabs
  const containerStyle = {
    position: 'absolute' as 'absolute',
    top: hour * hourHeight,
    left: 60, // Leave space for hour labels
    right: 10,
    height: hourHeight,
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
    zIndex: 1,
  };
  
  return (
    <View style={containerStyle}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}
      >
        {entries.map((entry) => (
          <Pressable
            key={entry.id}
            className="mr-2 px-3 py-1 rounded-lg flex-row items-center"
            style={{
              backgroundColor: entry.color + '20', // Light version of the color
              borderLeftWidth: 4,
              borderLeftColor: entry.color,
            }}
            onPress={() => onEntryPress?.(entry.id)}
            accessibilityLabel={`${entry.taskName} from ${format(new Date(entry.startTime), 'h:mm a')} to ${format(new Date(entry.endTime), 'h:mm a')}`}
            accessibilityHint="Tap to view or edit this time entry"
          >
            <Text className="font-medium text-xs text-gray-800 mr-1">{entry.taskName}</Text>
            <Text className="text-xs text-gray-600">
              {format(new Date(entry.startTime), 'h:mm')}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

export default GroupedTimeEntryItem; 