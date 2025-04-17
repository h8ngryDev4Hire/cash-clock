import { Milestone, TaskItem } from './core';

/**
 * Project creation related types
 */

/**
 * CreateProjectSheet component props
 */
export interface CreateProjectSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onCreateProject: (data: { 
    name: string; 
    description?: string; 
    color: string;
    icon?: string;
    goals: string;
    milestones?: string;
    taskIds?: string[];
  }) => Promise<void>;
}

/**
 * UI component props for project creation wizard
 */

export interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export interface ColorSelectorProps {
  selectedColor: string;
  onSelectColor: (colorId: string) => void;
  isDark: boolean;
}

export interface IconSelectorProps {
  selectedIcon: string;
  selectedColor: string;
  onSelectIcon: (iconId: string) => void;
  isDark: boolean;
}

export interface MilestoneItemProps {
  milestone: Milestone;
  onRemove: (id: string) => void;
  isDark: boolean;
}

export interface ProjectTaskItemProps {
  task: TaskItem;
  isSelected: boolean;
  onSelect: (taskId: string) => void;
  isDark: boolean;
}

/**
 * Wizard step props for project creation
 */

export interface ProjectBasicInfoStepProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  selectedColor: string;
  setSelectedColor: (colorId: string) => void;
  selectedIcon: string;
  setSelectedIcon: (iconId: string) => void;
  isSubmitting: boolean;
  onNext: () => void;
  isDark: boolean;
}

export interface ProjectGoalsMilestonesStepProps {
  goals: string;
  setGoals: (goals: string) => void;
  milestones: Milestone[];
  setMilestones: (milestones: Milestone[]) => void;
  newMilestone: string;
  setNewMilestone: (milestone: string) => void;
  isSubmitting: boolean;
  onNext: () => void;
  onBack: () => void;
  isDark: boolean;
}

export interface ProjectTasksStepProps {
  availableTasks: TaskItem[];
  selectedTaskIds: string[];
  isLoadingTasks: boolean;
  isSubmitting: boolean;
  onSelectTask: (taskId: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isDark: boolean;
} 