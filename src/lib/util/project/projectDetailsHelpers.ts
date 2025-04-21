import { getIconValue, suggestIconFromName } from './projectIcons';
import { log } from '../debugging/logging';

// Define milestone interface
export interface Milestone {
  id: string;
  text: string;
}

/**
 * Parse milestones from JSON string
 */
export const parseMilestones = (milestonesStr?: string): Milestone[] => {
  if (!milestonesStr) return [];
  
  try {
    const milestonesArr = JSON.parse(milestonesStr);
    if (Array.isArray(milestonesArr)) {
      return milestonesArr.map((text, index) => ({
        id: `milestone_${index}_${Date.now()}`,
        text
      }));
    }
    return [];
  } catch (err) {
    // If the string is not in JSON format (old format), create a single milestone
    return milestonesStr.trim() ? [{ id: `milestone_0_${Date.now()}`, text: milestonesStr }] : [];
  }
};

/**
 * Get the project icon from either stored value or suggested based on name
 */
export const getProjectIconValue = (projectIcon: string, projectName: string): string => {
  if (projectIcon) {
    return getIconValue(projectIcon);
  }
  // If no icon set but we have a name, suggest one
  if (projectName) {
    return getIconValue(suggestIconFromName(projectName));
  }
  return getIconValue();
}; 