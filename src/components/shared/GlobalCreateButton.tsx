import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Pressable, useColorScheme, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { log } from '@lib/util/debugging/logging';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface GlobalCreateButtonProps {
  onCreateTask: () => void;
  onCreateProject: () => void;
}

/**
 * GlobalCreateButton renders a floating action button that shows creation options
 * This component is visible across all screens and provides quick access to creation actions
 */
const GlobalCreateButton: React.FC<GlobalCreateButtonProps> = ({
  onCreateTask,
  onCreateProject
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Animation values
  const expandAnimation = useSharedValue(0);
  const rotateAnimation = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  // Get screen dimensions for the backdrop
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Update animations when expanded state changes
  useEffect(() => {
    // Apply haptic feedback
    if (isExpanded) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Animate values
    expandAnimation.value = withSpring(isExpanded ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
    
    rotateAnimation.value = withTiming(isExpanded ? 1 : 0, {
      duration: 300,
    });
    
    backdropOpacity.value = withTiming(isExpanded ? 0.5 : 0, {
      duration: 200,
    });
  }, [isExpanded]);

  // Toggle expansion state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Handle backdrop press - specifically for dismissal
  const handleBackdropPress = () => {
    log('Backdrop pressed, dismissing menu', 'GlobalCreateButton', 'handleBackdropPress', 'INFO');
    setIsExpanded(false);
  };

  // Handle option selection
  const handleOptionPress = (action: () => void) => {
    // Log the action
    log('Create button option pressed', 'GlobalCreateButton', 'handleOptionPress', 'INFO');
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Collapse the menu
    setIsExpanded(false);
    // Execute the action
    action();
  };
  
  // Animated styles
  const projectButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: interpolate(expandAnimation.value, [0, 1], [0.5, 1], Extrapolate.CLAMP) },
        { translateY: interpolate(expandAnimation.value, [0, 1], [50, 0], Extrapolate.CLAMP) }
      ],
      opacity: expandAnimation.value
    };
  });
  
  const taskButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: interpolate(expandAnimation.value, [0, 0.7, 1], [0.5, 0.8, 1], Extrapolate.CLAMP) },
        { translateY: interpolate(expandAnimation.value, [0, 1], [25, 0], Extrapolate.CLAMP) }
      ],
      opacity: expandAnimation.value
    };
  });
  
  const backdropStyle = useAnimatedStyle(() => {
    return {
      opacity: backdropOpacity.value,
      backgroundColor: 'black',
    };
  });
  
  const mainButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${interpolate(rotateAnimation.value, [0, 1], [0, 45], Extrapolate.CLAMP)}deg` }
      ]
    };
  });

  return (
    <>
      {/* Backdrop when expanded - positioned fixed relative to screen */}
      {isExpanded && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              width: screenWidth,
              height: screenHeight,
              zIndex: 50,
            },
            backdropStyle
          ]}
        >
          <Pressable
            style={{ width: '100%', height: '100%' }}
            onPress={handleBackdropPress}
            accessibilityLabel="Close create menu"
          />
        </Animated.View>
      )}
      
      <View className="absolute bottom-20 right-6 items-center" style={{ zIndex: 51 }}>
        {/* Menu options - Vertically stacked ABOVE the main button */}
        <View className="absolute bottom-20 right-0 items-end">
          {/* Project button - displayed first (top) */}
          <Animated.View style={projectButtonStyle}>
            <TouchableOpacity
              onPress={() => handleOptionPress(onCreateProject)}
              className={`w-16 h-16 rounded-full shadow-2xl items-center justify-center mb-4 ${
                isDark ? 'bg-blue-600' : 'bg-blue-600'
              }`}
              accessibilityLabel="Create new project"
              accessibilityHint="Opens the project creation form"
            >
              <Ionicons name="folder-outline" size={30} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
          
          {/* Task button - displayed second (bottom) */}
          <Animated.View style={taskButtonStyle}>
            <TouchableOpacity
              onPress={() => handleOptionPress(onCreateTask)}
              className={`w-16 h-16 rounded-full shadow-2xl items-center justify-center mb-4 ${
                isDark ? 'bg-indigo-600' : 'bg-indigo-600'
              }`}
              accessibilityLabel="Create new task"
              accessibilityHint="Opens the task creation form"
            >
              <Ionicons name="checkbox-outline" size={30} color="#FFFFFF" />
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        {/* Main FAB button */}
        <TouchableOpacity
          onPress={toggleExpand}
          className={`w-16 h-16 rounded-full shadow-2xl items-center justify-center ${
            isDark ? 'bg-indigo-500' : 'bg-indigo-600'
          }`}
          accessibilityLabel="Create new item"
          accessibilityHint="Opens a menu with creation options"
          accessibilityRole="button"
        >
          <Animated.View style={mainButtonStyle}>
            <Ionicons 
              name="add" 
              size={30} 
              color="#FFFFFF" 
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
    </>
  );
};

export default GlobalCreateButton; 