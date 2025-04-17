/**
 * Predefined icons for projects in the application
 */

export interface ProjectIcon {
  id: string;
  name: string;
  value: string;
}

/**
 * Predefined project icons using Ionicons
 */
export const PROJECT_ICONS: ProjectIcon[] = [
  { id: 'folder', name: 'Folder', value: 'folder-outline' },
  { id: 'globe', name: 'Web', value: 'globe-outline' },
  { id: 'phone', name: 'Mobile', value: 'phone-portrait-outline' },
  { id: 'people', name: 'Meeting', value: 'people-outline' },
  { id: 'megaphone', name: 'Marketing', value: 'megaphone-outline' },
  { id: 'design', name: 'Design', value: 'color-palette-outline' },
  { id: 'code', name: 'Code', value: 'code-slash-outline' },
  { id: 'document', name: 'Document', value: 'document-text-outline' },
  { id: 'analytics', name: 'Analytics', value: 'analytics-outline' },
  { id: 'calendar', name: 'Calendar', value: 'calendar-outline' },
  { id: 'camera', name: 'Camera', value: 'camera-outline' },
  { id: 'cart', name: 'Shopping', value: 'cart-outline' },
];

/**
 * Get an icon by ID
 */
export const getIconById = (iconId: string): ProjectIcon | undefined => {
  return PROJECT_ICONS.find(icon => icon.id === iconId);
};

/**
 * Get a default icon for new projects
 */
export const getDefaultIcon = (): ProjectIcon => {
  return PROJECT_ICONS[0]; // Folder is the default
};

/**
 * Get an icon value from an ID, or return a default if not found
 */
export const getIconValue = (iconId?: string): string => {
  if (!iconId) {
    return getDefaultIcon().value;
  }
  
  const icon = getIconById(iconId);
  return icon ? icon.value : getDefaultIcon().value;
};

/**
 * Determine an appropriate icon based on project name
 */
export const suggestIconFromName = (name: string): string => {
  if (!name) return 'folder';
  
  const nameLower = name.toLowerCase();
  if (nameLower.includes('web') || nameLower.includes('site')) return 'globe';
  if (nameLower.includes('app') || nameLower.includes('mobile')) return 'phone';
  if (nameLower.includes('meeting') || nameLower.includes('client')) return 'people';
  if (nameLower.includes('marketing') || nameLower.includes('ads')) return 'megaphone';
  if (nameLower.includes('design') || nameLower.includes('ui')) return 'design';
  if (nameLower.includes('code') || nameLower.includes('dev')) return 'code';
  if (nameLower.includes('doc') || nameLower.includes('report')) return 'document';
  if (nameLower.includes('analytic') || nameLower.includes('data')) return 'analytics';
  if (nameLower.includes('schedule') || nameLower.includes('event')) return 'calendar';
  if (nameLower.includes('photo') || nameLower.includes('video')) return 'camera';
  if (nameLower.includes('shop') || nameLower.includes('store') || nameLower.includes('ecommerce')) return 'cart';
  
  return 'folder';
}; 