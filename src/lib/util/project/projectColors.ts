/**
 * Predefined colors for projects in the application
 */

export interface ProjectColor {
  id: string;
  name: string;
  value: string;
}

/**
 * Predefined project colors with HEX values
 */
export const PROJECT_COLORS: ProjectColor[] = [
  { id: 'blue', name: 'Blue', value: '#3B82F6' },
  { id: 'indigo', name: 'Indigo', value: '#6366F1' },
  { id: 'purple', name: 'Purple', value: '#8B5CF6' },
  { id: 'pink', name: 'Pink', value: '#EC4899' },
  { id: 'red', name: 'Red', value: '#EF4444' },
  { id: 'orange', name: 'Orange', value: '#F97316' },
  { id: 'amber', name: 'Amber', value: '#F59E0B' },
  { id: 'yellow', name: 'Yellow', value: '#EAB308' },
  { id: 'lime', name: 'Lime', value: '#84CC16' },
  { id: 'green', name: 'Green', value: '#10B981' },
  { id: 'teal', name: 'Teal', value: '#14B8A6' },
  { id: 'cyan', name: 'Cyan', value: '#06B6D4' },
];

/**
 * Get a color by ID
 */
export const getColorById = (colorId: string): ProjectColor | undefined => {
  return PROJECT_COLORS.find(color => color.id === colorId);
};

/**
 * Get a default color for new projects
 */
export const getDefaultColor = (): ProjectColor => {
  return PROJECT_COLORS[0]; // Blue is the default
};

/**
 * Get a color value from an ID, or return a default if not found
 */
export const getColorValue = (colorId?: string): string => {
  if (!colorId) {
    return getDefaultColor().value;
  }
  
  const color = getColorById(colorId);
  return color ? color.value : getDefaultColor().value;
}; 