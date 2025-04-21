import { useCallback } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { 
  PanGestureHandlerGestureEvent,
  PanGestureHandlerEventPayload,
  GestureHandlerRootView 
} from 'react-native-gesture-handler';
import { useDragContext } from '@context/DragContext';
import { DragGestureContext, Point, UseDragOptions, UseDragResult } from '@def/drag';
import { log } from '@lib/util/debugging/logging';

/**
 * Custom hook for making components draggable using the global drag system
 */
export const useDrag = ({
  id,
  type,
  onDragStart,
  onDragEnd,
  enabled = true
}: UseDragOptions): UseDragResult => {
  // Get the global drag context
  const {
    isDragging: isAnyDragging,
    draggedItemId,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag
  } = useDragContext();
  
  // Determine if this specific item is being dragged
  const isDragging = isAnyDragging && draggedItemId === id;
  
  // Animated values for this component
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  // Create animated styles
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value }
      ],
      opacity: opacity.value,
      zIndex: isDragging ? 100 : 1
    };
  });
  
  // Helper to convert event to Point
  const eventToPoint = (event: PanGestureHandlerEventPayload): Point => ({
    x: event.absoluteX,
    y: event.absoluteY
  });
  
  // Handler for drag gesture
  const gestureHandler = useCallback((event: PanGestureHandlerGestureEvent) => {
    const { nativeEvent } = event;
    
    // Helper functions to be called from worklet context
    const handleDragStart = () => {
      log(`Drag started: ${id} (${type})`, 'useDrag', 'gestureHandler', 'INFO');
      startDrag(id, type, {
        x: nativeEvent.absoluteX,
        y: nativeEvent.absoluteY
      });
      
      if (onDragStart) {
        onDragStart();
      }
    };
    
    const handleDragUpdate = () => {
      updateDrag({
        x: nativeEvent.absoluteX,
        y: nativeEvent.absoluteY
      });
    };
    
    const handleDragEnd = () => {
      // Calculate final distance for callback
      if (onDragEnd && translateX.value !== 0 && translateY.value !== 0) {
        const distance: Point = {
          x: translateX.value,
          y: translateY.value
        };
        onDragEnd(distance);
      }
      
      endDrag();
    };
    
    const handleDragCancel = () => {
      cancelDrag();
    };
    
    // State-based gesture handling
    switch (nativeEvent.state) {
      case 1: // Began
        if (!enabled) return;
        
        // Animation for drag start
        scale.value = withTiming(1.05, { duration: 100 });
        translateX.value = 0;
        translateY.value = 0;
        
        runOnJS(handleDragStart)();
        break;
        
      case 2: // Active
        if (!enabled || !isDragging) return;
        
        // Update position
        translateX.value = nativeEvent.translationX;
        translateY.value = nativeEvent.translationY;
        
        runOnJS(handleDragUpdate)();
        break;
        
      case 3: // Ended
      case 5: // Failed/Cancelled
        if (!enabled || !isDragging) return;
        
        // Reset animations
        scale.value = withTiming(1, { duration: 200 });
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        
        if (nativeEvent.state === 3) {
          runOnJS(handleDragEnd)();
        } else {
          runOnJS(handleDragCancel)();
        }
        break;
    }
  }, [id, type, enabled, isDragging, startDrag, updateDrag, endDrag, cancelDrag, onDragStart, onDragEnd]);
  
  return {
    isDragging,
    isAnyDragging,
    gestureHandler,
    animatedStyle,
    enabled
  };
};

export default useDrag; 