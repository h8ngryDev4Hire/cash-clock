import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  message: string;
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  action?: React.ReactNode;
}

/**
 * EmptyState component for displaying when a list or view has no content
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  title,
  icon = 'information-circle-outline',
  action
}) => {
  return (
    <View className="items-center justify-center py-10 px-4">
      <Ionicons name={icon} size={48} color="#9CA3AF" className="mb-4" />
      
      {title && (
        <Text className="text-lg font-medium text-center text-gray-700 dark:text-gray-300 mb-2">
          {title}
        </Text>
      )}
      
      <Text className="text-base text-center text-gray-500 mb-4">
        {message}
      </Text>
      
      {action && <View className="mt-2">{action}</View>}
    </View>
  );
};

export default EmptyState;