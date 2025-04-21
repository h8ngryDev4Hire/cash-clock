import React, { createContext, useContext, useState } from 'react';
import { Point, DragContextValue, DragProviderProps, DropZone, DropZoneBounds } from '@def/drag';
import { log } from '@lib/util/debugging/logging';

// Create a context with default values
const DragContext = createContext<DragContextValue>({
  // Default state
  isDragging: false,
  draggedItemId: null,
  draggedItemType: null,
  dragOrigin: null,
  dragPosition: null,
  dragDistance: null,
  dropZones: {},
  
  // Default methods (no-ops)
  startDrag: () => {},
  updateDrag: () => {},
  endDrag: () => {},
  cancelDrag: () => {},
  registerDropZone: () => {},
  unregisterDropZone: () => {}
});

/**
 * Provider component for the drag context
 */
export const DragProvider: React.FC<DragProviderProps> = ({ children }) => {
  // State for tracking drag operations
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [draggedItemType, setDraggedItemType] = useState<string | null>(null);
  const [dragOrigin, setDragOrigin] = useState<Point | null>(null);
  const [dragPosition, setDragPosition] = useState<Point | null>(null);
  const [dragDistance, setDragDistance] = useState<Point | null>(null);
  const [dropZones, setDropZones] = useState<Record<string, DropZone>>({});
  
  // Start a drag operation
  const startDrag = (id: string, type: string, position: Point) => {
    log(`Starting drag: ${id} (${type})`, 'DragContext', 'startDrag', 'INFO');
    
    setIsDragging(true);
    setDraggedItemId(id);
    setDraggedItemType(type);
    setDragOrigin(position);
    setDragPosition(position);
    setDragDistance({ x: 0, y: 0 });
  };
  
  // Update drag position during a drag operation
  const updateDrag = (position: Point) => {
    if (!isDragging || !dragOrigin) return;
    
    setDragPosition(position);
    setDragDistance({
      x: position.x - dragOrigin.x,
      y: position.y - dragOrigin.y
    });
  };
  
  // End a drag operation successfully
  const endDrag = () => {
    log(`Ending drag: ${draggedItemId}`, 'DragContext', 'endDrag', 'INFO');
    
    // Find if we're over a drop zone
    if (dragPosition && draggedItemId && draggedItemType) {
      const matchingDropZones = Object.values(dropZones).filter(zone => 
        isPointInZone(dragPosition, zone.bounds)
      );
      
      if (matchingDropZones.length > 0) {
        log(`Dropped on zones: ${matchingDropZones.map(z => z.id).join(', ')}`, 'DragContext', 'endDrag', 'INFO');
        // Here you could trigger callbacks for the drop zones
      }
    }
    
    resetDragState();
  };
  
  // Cancel a drag operation
  const cancelDrag = () => {
    log(`Cancelling drag: ${draggedItemId}`, 'DragContext', 'cancelDrag', 'INFO');
    resetDragState();
  };
  
  // Reset all drag state
  const resetDragState = () => {
    setIsDragging(false);
    setDraggedItemId(null);
    setDraggedItemType(null);
    setDragOrigin(null);
    setDragPosition(null);
    setDragDistance(null);
  };
  
  // Register a drop zone
  const registerDropZone = (id: string, bounds: DropZoneBounds, data?: any) => {
    log(`Registering drop zone: ${id}`, 'DragContext', 'registerDropZone', 'INFO');
    
    setDropZones(prev => ({
      ...prev,
      [id]: { id, bounds, data }
    }));
  };
  
  // Unregister a drop zone
  const unregisterDropZone = (id: string) => {
    log(`Unregistering drop zone: ${id}`, 'DragContext', 'unregisterDropZone', 'INFO');
    
    setDropZones(prev => {
      const newZones = { ...prev };
      delete newZones[id];
      return newZones;
    });
  };
  
  // Helper to check if a point is in a zone
  const isPointInZone = (point: Point, bounds: DropZoneBounds): boolean => {
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  };
  
  // Build the context value
  const contextValue: DragContextValue = {
    // State
    isDragging,
    draggedItemId,
    draggedItemType,
    dragOrigin,
    dragPosition,
    dragDistance,
    dropZones,
    
    // Methods
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    registerDropZone,
    unregisterDropZone
  };
  
  return (
    <DragContext.Provider value={contextValue}>
      {children}
    </DragContext.Provider>
  );
};

/**
 * Hook to access the drag context
 */
export const useDragContext = (): DragContextValue => {
  const context = useContext(DragContext);
  
  if (context === undefined) {
    throw new Error('useDragContext must be used within a DragProvider');
  }
  
  return context;
};

export default DragContext; 