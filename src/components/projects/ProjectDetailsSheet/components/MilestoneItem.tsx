import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Milestone {
  id: string;
  text: string;
}

interface MilestoneItemProps {
  milestone: Milestone;
  onRemove?: (id: string) => void;
  isDark: boolean;
  showDelete?: boolean;
}

/**
 * Component for displaying a milestone item
 */
const MilestoneItem: React.FC<MilestoneItemProps> = ({
  milestone,
  onRemove,
  isDark,
  showDelete = true
}) => {
  return (
    <View className={`flex-row items-center p-2 mb-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
      <Text className={`flex-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
        {milestone.text}
      </Text>
      {showDelete && onRemove && (
        <TouchableOpacity
          onPress={() => onRemove(milestone.id)}
          className="p-1"
        >
          <Ionicons name="close-circle" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default MilestoneItem; 