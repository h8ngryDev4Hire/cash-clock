import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { format, isSameDay } from 'date-fns';

interface DaySelectorProps {
  days: Date[];
  selectedDate: Date;
  onSelectDay: (date: Date) => void;
}

/**
 * DaySelector component renders a horizontal scrollable list of days
 * for selecting a date in the calendar
 */
const DaySelector: React.FC<DaySelectorProps> = ({ 
  days, 
  selectedDate, 
  onSelectDay 
}) => {
  return (
    <View className="py-2 border-b border-gray-200">
      <FlatList
        data={days}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            className={`px-3 py-2 mx-1 h-[3.5rem] w-[3.5rem] rounded-full ${
              isSameDay(item, selectedDate) ? 'bg-blue-100' : 'bg-gray-50'
            }`}
            onPress={() => onSelectDay(item)}
            accessibilityLabel={format(item, 'EEEE, MMMM d')}
            accessibilityHint="Select this day to view its schedule"
          >
            <Text
              className={`text-center text-sm ${
                isSameDay(item, selectedDate) ? 'text-blue-600 font-bold' : 'text-gray-600'
              }`}
            >
              {format(item, 'EEE')}
            </Text>
            <Text
              className={`text-center text-sm ${
                isSameDay(item, selectedDate) ? 'text-blue-600 font-bold' : 'text-gray-600'
              }`}
            >
              {format(item, 'd')}
            </Text>
          </Pressable>
        )}
        keyExtractor={(item) => format(item, 'yyyy-MM-dd')}
        contentContainerStyle={{ paddingHorizontal: 10 }}
      />
      
      {/* Current date display */}
      <View className="py-3 px-4 bg-gray-50">
        <Text className="text-lg font-bold text-gray-800">
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </Text>
      </View>
    </View>
  );
};

export default DaySelector;
