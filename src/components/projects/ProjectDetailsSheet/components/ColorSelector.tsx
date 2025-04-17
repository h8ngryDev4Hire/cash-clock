import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PROJECT_COLORS } from '@lib/util/project/projectColors';

interface ColorSelectorProps {
  selectedColor: string;
  onSelectColor: (colorId: string) => void;
  isDark: boolean;
}

/**
 * Component for selecting a color for a project
 */
const ColorSelector: React.FC<ColorSelectorProps> = ({ 
  selectedColor, 
  onSelectColor, 
  isDark 
}) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      className="mt-2"
    >
      {PROJECT_COLORS.map((color) => (
        <TouchableOpacity
          key={color.id}
          className="mr-3 mb-3 items-center"
          onPress={() => onSelectColor(color.id)}
          accessibilityLabel={`Color ${color.name}`}
          accessibilityState={{ selected: selectedColor === color.id }}
        >
          <View 
            className={`w-10 h-10 rounded-full items-center justify-center mb-1 border-2 ${selectedColor === color.id ? 'border-blue-500' : 'border-transparent'}`}
            style={{ backgroundColor: color.value }}
          >
            {selectedColor === color.id && (
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
            )}
          </View>
          {selectedColor === color.id && (
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {color.name}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default ColorSelector; 