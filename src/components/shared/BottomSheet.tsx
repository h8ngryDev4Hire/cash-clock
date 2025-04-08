import React, { useEffect } from 'react';
import { 
  View, 
  Modal, 
  TouchableOpacity, 
  TouchableWithoutFeedback,
  StyleSheet,
  useColorScheme,
  Animated,
  Dimensions,
  StatusBar
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

interface BottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number | 'auto';
  enableBlurBackdrop?: boolean;
}

/**
 * BottomSheet component for displaying content in a modal from the bottom of the screen
 */
const BottomSheet: React.FC<BottomSheetProps> = ({
  isVisible,
  onClose,
  children,
  height = 'auto',
  enableBlurBackdrop = true
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const translateY = new Animated.Value(Dimensions.get('window').height);
  
  // Animate the bottom sheet when visibility changes
  useEffect(() => {
    if (isVisible) {
      // Provide haptic feedback when opening
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Animate slide up
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 5,
        speed: 14
      }).start();
    } else {
      // Animate slide down
      Animated.timing(translateY, {
        toValue: Dimensions.get('window').height,
        duration: 250,
        useNativeDriver: true
      }).start();
    }
  }, [isVisible]);
  
  // Handle background press
  const handleBackdropPress = () => {
    onClose();
  };
  
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Backdrop with optional blur */}
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <View style={styles.backdrop}>
            {enableBlurBackdrop && (
              <BlurView
                intensity={10}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            )}
          </View>
        </TouchableWithoutFeedback>
        
        {/* Bottom sheet content */}
        <Animated.View 
          style={[
            styles.sheet,
            { 
              transform: [{ translateY }],
              height: height === 'auto' ? undefined : height,
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              paddingBottom: insets.bottom + 16,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16
            }
          ]}
        >
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={[
              styles.handle, 
              { backgroundColor: isDark ? '#4B5563' : '#D1D5DB' }
            ]} />
          </View>
          
          {/* Content */}
          <View style={styles.content}>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  }
});

export default BottomSheet; 