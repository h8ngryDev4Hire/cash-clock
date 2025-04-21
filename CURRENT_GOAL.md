# Global Drag System Implementation Plan

## Overview
Create a global drag context and hook system to centralize and standardize drag functionality across the app, enabling better coordination between draggable components and improving maintainability.

## Files to Create

### 1. `src/context/DragContext.tsx`
Central context to manage global drag state.

**Functionality:**
- Store global drag state (isDragging, draggedItemId, draggedItemType, etc.)
- Provide methods to manipulate drag state:
  - `startDrag`: Initialize a drag operation
  - `updateDrag`: Update position during drag
  - `endDrag`: Complete a drag operation successfully
  - `cancelDrag`: Abort a drag operation
- Track drop zones and their bounds (optional)
- Expose drag context through a provider

### 2. `src/hooks/useDrag.ts`
Custom hook to easily integrate components with the drag system.

**Functionality:**
- Consume the DragContext
- Provide component-specific animation values (translateY, scale)
- Create and return gesture handlers integrated with the context
- Return relevant state and handlers for components to use
- Handle actual animation with react-native-reanimated
- Connect pan gesture handlers with the global state

### 3. `src/components/ui/DragOverlay.tsx`
Optional component for global drag feedback.

**Functionality:**
- Render visual feedback during drag operations
- Show drag previews or hints
- Indicate where items will be dropped
- Conditionally render different UI based on drag types

### 4. `src/types/drag.ts`
Type definitions for the drag system.

**Content:**
- Interface for drag context value
- Types for drag events
- Types for drag item types
- Interface for useDrag hook options and return values

## Integration Plan

### Update Existing Components

1. **TaskItem.tsx**:
   - Replace current gesture handling with useDrag hook
   - Simplify component by removing duplicated animation logic
   - Keep component-specific callbacks for task-specific behavior

2. **DraggableTaskItem.tsx**:
   - Refactor to use the new useDrag hook
   - Remove duplicated gesture and animation code

3. **ViewMode.tsx**:
   - Update to consume DragContext for global drag state
   - Modify drag-related state management to leverage the context

### App-Level Integration

1. **App.tsx** or relevant wrapper component:
   - Wrap the application with DragProvider
   - Add DragOverlay component for global drag UI feedback

## Implementation Details

### DragContext State
```typescript
{
  isDragging: boolean;
  draggedItemId: string | null;
  draggedItemType: string | null;
  dragOrigin: { x: number, y: number } | null;
  dragPosition: { x: number, y: number } | null;
  dragDistance: { x: number, y: number } | null;
  dropZones: Record<string, { id: string, bounds: DOMRect, data?: any }>;
}
```

### Hook API
```typescript
const {
  isDragging,          // Is this component being dragged
  isAnyDragging,       // Is any component being dragged
  gestureHandler,      // Pan gesture handler to attach to component
  animatedStyle,       // Animated styles for the component
  enabled              // Whether drag is enabled for this component
} = useDrag({
  id: string,          // Unique ID for this draggable item
  type: string,        // Type of draggable (e.g., 'task', 'project')
  onDragStart?: () => void,
  onDragEnd?: (distance: number) => void,
  enabled?: boolean    // Whether drag is enabled
});
```



## Testing Plan

1. Create unit tests for the context and hook
2. Create integration tests for draggable components
3. Test edge cases like rapid drag operations
4. Test performance with many draggable items 