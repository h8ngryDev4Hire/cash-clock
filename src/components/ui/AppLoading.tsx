import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';

interface AppLoadingProps {
  message?: string;
}

/**
 * Loading component displayed during application initialization
 */
export const AppLoading: React.FC<AppLoadingProps> = ({ 
  message = 'Loading application...' 
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }
    ]}>
      <ActivityIndicator 
        size="large" 
        color={isDark ? '#6366F1' : '#4F46E5'} 
        style={styles.spinner} 
      />
      <Text style={[
        styles.message,
        { color: isDark ? '#E5E7EB' : '#1F2937' }
      ]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  spinner: {
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 30,
  },
}); 