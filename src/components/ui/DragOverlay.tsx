import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  useSharedValue,
  useDerivedValue 
} from 'react-native-reanimated';
import { useDragContext } from '@context/DragContext';

interface DragOverlayProps {
  // Optional props for customization
  showDebugInfo?: boolean;
  showDropZones?: boolean;
}

/**
 * Overlay component that provides visual feedback during drag operations
 */
const DragOverlay: React.FC<DragOverlayProps> = ({
  showDebugInfo = false,
  showDropZones = true
}) => {
  const {
    isDragging,
    draggedItemId,
    draggedItemType,
    dragPosition,
    dragOrigin,
    dragDistance,
    dropZones
  } = useDragContext();
  
  // Animation value for overlay opacity
  const overlayOpacity = useDerivedValue(() => {
    return isDragging ? withTiming(0.5, { duration: 200 }) : withTiming(0, { duration: 200 });
  });
  
  // Animation style for the overlay
  const overlayStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 90,
      pointerEvents: 'none'
    };
  });
  
  // Animation style for the drag indicator
  const indicatorStyle = useAnimatedStyle(() => {
    if (!isDragging || !dragPosition) {
      return {
        opacity: 0,
        transform: [{ scale: 0 }]
      };
    }
    
    return {
      opacity: 1,
      transform: [
        { translateX: dragPosition.x - 10 },
        { translateY: dragPosition.y - 10 },
        { scale: withSpring(1) }
      ]
    };
  });
  
  // Render debug info if enabled
  const renderDebugInfo = () => {
    if (!showDebugInfo || !isDragging) return null;
    
    return (
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>ID: {draggedItemId}</Text>
        <Text style={styles.debugText}>Type: {draggedItemType}</Text>
        {dragPosition && (
          <Text style={styles.debugText}>
            Position: ({Math.round(dragPosition.x)}, {Math.round(dragPosition.y)})
          </Text>
        )}
        {dragDistance && (
          <Text style={styles.debugText}>
            Distance: ({Math.round(dragDistance.x)}, {Math.round(dragDistance.y)})
          </Text>
        )}
      </View>
    );
  };
  
  // Render drop zones visualization if enabled
  const renderDropZones = () => {
    if (!showDropZones || !isDragging) return null;
    
    return Object.values(dropZones).map((zone) => (
      <Animated.View
        key={zone.id}
        style={[
          styles.dropZone,
          {
            position: 'absolute',
            left: zone.bounds.x,
            top: zone.bounds.y,
            width: zone.bounds.width,
            height: zone.bounds.height,
          }
        ]}
      >
        <Text style={styles.dropZoneText}>{zone.id}</Text>
      </Animated.View>
    ));
  };
  
  if (!isDragging) return null;
  
  return (
    <>
      {/* Overlay background */}
      <Animated.View style={overlayStyle} />
      
      {/* Drag position indicator */}
      <Animated.View style={[styles.dragIndicator, indicatorStyle]} />
      
      {/* Render drop zones if enabled */}
      {renderDropZones()}
      
      {/* Debug information if enabled */}
      {renderDebugInfo()}
    </>
  );
};

const styles = StyleSheet.create({
  dragIndicator: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    zIndex: 100,
    pointerEvents: 'none'
  },
  debugContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    zIndex: 100
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'monospace'
  },
  dropZone: {
    borderWidth: 2,
    borderColor: '#6366F1',
    borderStyle: 'dashed',
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 95
  },
  dropZoneText: {
    color: '#6366F1',
    fontSize: 12,
    fontWeight: 'bold'
  }
});

export default DragOverlay; 