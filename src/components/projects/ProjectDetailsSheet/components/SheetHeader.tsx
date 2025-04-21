import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SheetHeaderProps {
  isEditing: boolean;
  onDeletePress: () => void;
  isDark: boolean;
}

/**
 * Header component for the project details sheet
 */
const SheetHeader: React.FC<SheetHeaderProps> = ({
  isEditing,
  onDeletePress,
  isDark
}) => {
  return (
    <View className="flex-row justify-between items-center mb-2">
      <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
        {isEditing ? 'Edit Project' : 'Project Details'}
      </Text>
      {!isEditing && (
        <TouchableOpacity onPress={onDeletePress} className="p-2">
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SheetHeader; 