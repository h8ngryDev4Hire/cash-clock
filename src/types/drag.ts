import { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import type { PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

// Type for drop zone bounds
export interface DropZoneBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Drop zone data
export interface DropZone {
  id: string;
  bounds: DropZoneBounds;
  data?: any;
}

// Point coordinates
export interface Point {
  x: number;
  y: number;
}

// Drag context value
export interface DragContextValue {
  // State
  isDragging: boolean;
  draggedItemId: string | null;
  draggedItemType: string | null;
  dragOrigin: Point | null;
  dragPosition: Point | null;
  dragDistance: Point | null;
  dropZones: Record<string, DropZone>;
  
  // Methods
  startDrag: (id: string, type: string, position: Point) => void;
  updateDrag: (position: Point) => void;
  endDrag: () => void;
  cancelDrag: () => void;
  registerDropZone: (id: string, bounds: DropZoneBounds, data?: any) => void;
  unregisterDropZone: (id: string) => void;
}

// Props for the DragProvider
export interface DragProviderProps {
  children: ReactNode;
}

// Options for the useDrag hook
export interface UseDragOptions {
  id: string;
  type: string;
  onDragStart?: () => void;
  onDragEnd?: (distance: Point) => void;
  enabled?: boolean;
}

// Return type for the useDrag hook
export interface UseDragResult {
  isDragging: boolean;
  isAnyDragging: boolean;
  gestureHandler: (event: PanGestureHandlerGestureEvent) => void;
  animatedStyle: StyleProp<ViewStyle>;
  enabled: boolean;
}

// Gesture context type for the pan handler
export interface DragGestureContext {
  startX: number;
  startY: number;
} 