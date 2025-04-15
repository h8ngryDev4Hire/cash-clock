import React, { useRef, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { isSameDay, getHours } from 'date-fns';
import TimeEntryItem from './TimeEntryItem';
import GroupedTimeEntryItem from './GroupedTimeEntryItem';
import CurrentTimeIndicator from './CurrentTimeIndicator';

interface TimeEntry {
  id: string;
  taskId: string;
  taskName: string;
  startTime: number;
  endTime: number;
  color: string;
}

interface HourlyTimelineProps {
  selectedDate: Date;
  entries: TimeEntry[];
  onEntryPress?: (entryId: string) => void;
}

interface TimeEntryGroup {
  [hour: number]: TimeEntry[];
}

/**
 * HourlyTimeline component renders a 24-hour timeline with time entries
 */
const HourlyTimeline: React.FC<HourlyTimelineProps> = ({ 
  selectedDate, 
  entries, 
  onEntryPress
}) => {
  // Generate hours for the timeline (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  // Ref for the hour scroll view to programmatically scroll
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Group time entries by hour for tabbed display
  const groupedEntries = useMemo(() => {
    const groups: TimeEntryGroup = {};
    
    // Initialize empty arrays for each hour
    hours.forEach(hour => {
      groups[hour] = [];
    });
    
    // Group entries by their start hour
    entries.forEach(entry => {
      const startHour = new Date(entry.startTime).getHours();
      if (groups[startHour]) {
        groups[startHour].push(entry);
      }
    });
    
    return groups;
  }, [entries, hours]);
  
  // Identify which entries span multiple hours (will be rendered as traditional blocks)
  const spanningEntries = useMemo(() => {
    return entries.filter(entry => {
      const startHour = new Date(entry.startTime).getHours();
      const endHour = new Date(entry.endTime).getHours();
      // If an entry spans 2+ hours or is longer than 45 minutes, show as a block
      return startHour !== endHour || 
        (new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) > 45 * 60 * 1000;
    });
  }, [entries]);
  
  // Scroll to the current hour when component mounts or date changes
  useEffect(() => {
    scrollToCurrentHour();
  }, [selectedDate]);
  
  const scrollToCurrentHour = () => {
    const currentHour = getHours(new Date());
    const hourHeight = 60; // Height of each hour cell
    
    // Scroll to slightly above the current hour for better context
    scrollViewRef.current?.scrollTo({
      y: Math.max(0, (currentHour - 1) * hourHeight),
      animated: true
    });
  };

  // Is the selected date today?
  const isToday = isSameDay(selectedDate, new Date());
  
  // Current hour (for highlighting)
  const currentHour = getHours(new Date());

  return (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      className="flex-1"
    >
      <View className="relative">
        {/* Hour labels */}
        {hours.map((hour) => (
          <View 
            key={hour} 
            className={`flex-row h-[60px] border-b border-gray-100 ${
              hour % 2 === 0 ? 'bg-white' : 'bg-gray-50'
            }`}
            style={isToday && hour === currentHour 
              ? { backgroundColor: 'rgba(219, 234, 254, 0.3)' } 
              : undefined}
          >
            <View className="w-[60px] justify-center items-center border-r border-gray-200">
              <Text className="text-xs text-gray-500">
                {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
              </Text>
            </View>
            <View className="flex-1 h-full" />
          </View>
        ))}
        
        {/* Render groupped time entries as tabs */}
        {hours.map(hour => (
          groupedEntries[hour] && groupedEntries[hour].length > 0 && (
            <GroupedTimeEntryItem
              key={`hour-${hour}`}
              entries={groupedEntries[hour]}
              hour={hour}
              onEntryPress={onEntryPress}
            />
          )
        ))}
        
        {/* Render spanning time entries as blocks */}
        {spanningEntries.map((entry) => (
          <TimeEntryItem
            key={entry.id}
            entry={entry}
            onPress={() => onEntryPress?.(entry.id)}
          />
        ))}
        
        {/* Current time indicator if viewing today */}
        {isToday && <CurrentTimeIndicator />}
      </View>
    </ScrollView>
  );
};

export default HourlyTimeline;