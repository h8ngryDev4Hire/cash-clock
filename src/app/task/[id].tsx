import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, ActivityIndicator, useColorScheme, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useTask from '@hooks/useTask';
import { formatDuration } from '@lib/util/time/timeFormatters';
import { log } from '@lib/util/debugging/logging';

/**
 * TaskEditor component redirects to the home screen where task details are now displayed in a bottom sheet
 */
export default function TaskRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  // Redirect to home screen when this route is accessed directly
  useEffect(() => {
    log('Redirecting from task details page to home screen', 'TaskRedirect', 'useEffect', 'INFO');
    router.replace('/home');
  }, []);
  
  // Return null as this is just a redirect component
  return null;
} 