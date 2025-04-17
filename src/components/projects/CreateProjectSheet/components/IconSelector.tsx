import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconSelectorProps } from '@def/projects';
import { PROJECT_ICONS } from '@lib/util/project/projectIcons';
import { PROJECT_COLORS } from '@lib/util/project/projectColors';

/**
 * Component for selecting an icon for a project
 */
const IconSelector: React.FC<IconSelectorProps> = ({ 
  selectedIcon, 
  selectedColor,
  onSelectIcon, 
  isDark 
}) => {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      className="mt-2"
    >
      {PROJECT_ICONS.map((icon) => (
        <TouchableOpacity
          key={icon.id}
          className="mr-3 mb-3 items-center"
          onPress={() => onSelectIcon(icon.id)}
          accessibilityLabel={`Icon ${icon.name}`}
          accessibilityState={{ selected: selectedIcon === icon.id }}
        >
          <View 
            className={`w-10 h-10 rounded-full items-center justify-center mb-1 border-2 ${selectedIcon === icon.id ? 'border-blue-500' : 'border-transparent'}`}
            style={{ backgroundColor: PROJECT_COLORS.find(c => c.id === selectedColor)?.value }}
          >
            <Ionicons 
              name={icon.value as any} 
              size={20} 
              color="#FFFFFF" 
            />
          </View>
          {selectedIcon === icon.id && (
            <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {icon.name}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default IconSelector; 