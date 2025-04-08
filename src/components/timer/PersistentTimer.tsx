import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TimerControls from './TimerControls';
import { log } from '@lib/util/debugging/logging';

interface TimerPlayerProps {
  isVisible?: boolean;
  activeTimer?: boolean;
  taskName?: string;
  elapsedTime?: number;
  isRunning?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onTaskPress?: () => void;
  onStartNewTask?: (taskName: string) => void;
}

/**
 * TimerPlayer component displays the currently active timer or input to create a new task
 * at the bottom of the screen
 */
const TimerPlayer: React.FC<TimerPlayerProps> = ({
  isVisible = true,
  activeTimer = false,
  taskName = "Project research",
  elapsedTime = 1513, // 25 minutes and 13 seconds
  isRunning = true,
  onPause = () => log('Pause', 'TimerPlayer', 'INFO'),
  onResume = () => log('Resume', 'TimerPlayer', 'INFO'),
  onStop = () => log('Stop', 'TimerPlayer', 'INFO'),
  onTaskPress = () => log('Task pressed', 'TimerPlayer', 'INFO'),
  onStartNewTask = (taskName) => log('Start new task: ' + taskName, 'TimerPlayer', 'INFO')
}) => {
  const [newTaskName, setNewTaskName] = useState('');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Handle starting a new task
  const handleStartNewTask = () => {
    if (newTaskName.trim()) {
      onStartNewTask(newTaskName.trim());
      setNewTaskName('');
    }
  };
  
  // Don't render if timer is not visible
  if (!isVisible) return null;

  return (
    <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t shadow-lg`}>
      <View className="flex-row items-center p-3 justify-between">
        {activeTimer ? (
          // Active timer display
          <>
            <View className="flex-row items-center justify-between flex-1 px-4">
              <Pressable 
                className="flex-1" 
                onPress={onTaskPress}
                accessibilityLabel="View task details"
                accessibilityHint="Navigates to the task details page"
              >
                <Text className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-800'} truncate`} numberOfLines={1}>
                  {taskName}
                </Text>
              </Pressable>

              <View className="flex-grow" />

              <Text className="text-xl font-bold text-blue-600">
                {formatTime(elapsedTime)}
              </Text>
            </View>
            
            <TimerControls 
              isRunning={isRunning}
              onPause={onPause}
              onResume={onResume}
              onStop={onStop}
            />
          </>
        ) : (
          // New task input
          <>
            <View className="flex-1 px-4">
              <TextInput
                className={`text-base border-b ${isDark ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-800'} py-1`}
                placeholder="What are you working on?"
                placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
                value={newTaskName}
                onChangeText={setNewTaskName}
                onSubmitEditing={handleStartNewTask}
                returnKeyType="go"
                accessibilityLabel="Task name input"
                accessibilityHint="Enter a name for your new task"
              />
            </View>
            
            <Pressable 
              onPress={handleStartNewTask}
              className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center ml-2"
              accessibilityLabel="Start new task"
              accessibilityRole="button"
              disabled={!newTaskName.trim()}
            >
              <Ionicons name="play" size={18} color="#FFFFFF" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
};

export default TimerPlayer;
