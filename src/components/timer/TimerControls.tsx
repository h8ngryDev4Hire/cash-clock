import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TimerControlsProps {
  isRunning: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  size?: 'small' | 'medium' | 'large';
}

/**
 * TimerControls component renders play/pause and stop buttons for timer control
 */
const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  onPause,
  onResume,
  onStop,
  size = 'medium'
}) => {
  // Determine button size based on size prop
  const buttonSize = {
    small: {
      container: 'w-8 h-8',
      icon: 16
    },
    medium: {
      container: 'w-10 h-10',
      icon: 20
    },
    large: {
      container: 'w-12 h-12',
      icon: 24
    }
  }[size];

  return (
    <View className="flex-row items-center space-x-2">
      {isRunning ? (
        <Pressable 
          onPress={onPause}
          className={`${buttonSize.container} rounded-full bg-gray-100 items-center justify-center`}
          accessibilityLabel="Pause timer"
          accessibilityRole="button"
        >
          <Ionicons name="pause" size={buttonSize.icon} color="#4B5563" />
        </Pressable>
      ) : (
        <Pressable 
          onPress={onResume}
          className={`${buttonSize.container} rounded-full bg-gray-100 items-center justify-center`}
          accessibilityLabel="Resume timer"
          accessibilityRole="button"
        >
          <Ionicons name="play" size={buttonSize.icon} color="#4B5563" />
        </Pressable>
      )}
      
      <Pressable 
        onPress={onStop}
        className={`${buttonSize.container} rounded-full bg-red-100 items-center justify-center`}
        accessibilityLabel="Stop timer"
        accessibilityRole="button"
      >
        <Ionicons name="stop" size={buttonSize.icon} color="#DC2626" />
      </Pressable>
    </View>
  );
};

export default TimerControls;