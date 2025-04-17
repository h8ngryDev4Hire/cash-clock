import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MilestoneItemProps } from '@def/projects';

/**
 * Component for rendering a milestone item in the project creation flow
 */
const MilestoneItem: React.FC<MilestoneItemProps> = ({ 
  milestone, 
  onRemove,
  isDark 
}) => {
  return (
    <View 
      className={`flex-row justify-between items-center p-3 rounded-lg mb-2 ${
        isDark ? 'bg-[#2C2C2E]' : 'bg-[#ECEDF0]'
      }`}
    >
      <View className="flex-1 pr-2">
        <Text 
          className={`font-medium text-sm ${
            isDark ? 'text-white' : 'text-black'
          }`}
          numberOfLines={2}
        >
          {milestone.text}
        </Text>
      </View>
      
      <TouchableOpacity 
        onPress={() => onRemove(milestone.id)} 
        className="p-2"
        accessibilityLabel="Delete milestone"
      >
        <Ionicons 
          name="trash-outline" 
          size={18} 
          color={isDark ? "#FF453A" : "#FF3B30"} 
        />
      </TouchableOpacity>
    </View>
  );
};

export default MilestoneItem; 