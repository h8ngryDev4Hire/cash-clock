import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import BottomSheet from '../../shared/BottomSheet';
import { useTask } from '@hooks/useTask';
import { log } from '@lib/util/debugging/logging';
import { suggestIconFromName } from '@lib/util/project/projectIcons';
import { PROJECT_COLORS } from '@lib/util/project/projectColors';
import { CreateProjectSheetProps } from '@def/projects';
import { Milestone, TaskItem } from '@def/core';
import StepIndicator from './components/StepIndicator';
import Step1BasicInfo from './steps/Step1BasicInfo';
import Step2GoalsMilestones from './steps/Step2GoalsMilestones';
import Step3Tasks from './steps/Step3Tasks';

/**
 * Bottom sheet for creating a new project with a three-step wizard
 */
export default function CreateProjectSheet({
  isVisible,
  onClose,
  onCreateProject
} : CreateProjectSheetProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { tasks, isLoading: isTasksLoading } = useTask();
  
  // Step state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(PROJECT_COLORS[0].id);
  const [selectedIcon, setSelectedIcon] = useState<string>('');
  const [goals, setGoals] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Tasks state
  const [availableTasks, setAvailableTasks] = useState<TaskItem[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  
  // Load available tasks
  useEffect(() => {
    const loadTasks = async () => {
      if (currentStep === 3 && isVisible) {
        try {
          setIsLoadingTasks(true);
          
          // First check if we have tasks
          log(`Loading available tasks. Tasks array length: ${tasks.length}`, 'CreateProjectSheet', 'loadTasks', 'INFO');
          
          // Map tasks to the format needed for the component
          // Use any type temporarily to bypass type checking when accessing properties
          const mappedTasks: TaskItem[] = tasks
            .filter((task: any) => !task.projectId)
            .map((task: any): TaskItem => ({
              id: String(task?.id || task?.itemId || ''),
              title: String(task?.name || ''),
              isCompleted: Boolean(task?.isCompleted),
              projectId: task?.projectId || null
            }));
          
          // Set the available tasks state
          setAvailableTasks(mappedTasks.filter(task => task.id !== ''));
          
          // Log for debugging
          log(`Loaded ${mappedTasks.length} available tasks for selection`, 'CreateProjectSheet', 'loadTasks', 'INFO');
          if (mappedTasks.length > 0) {
            log(`First task: ${JSON.stringify(mappedTasks[0])}`, 'CreateProjectSheet', 'loadTasks', 'DEBUG');
          }
        } catch (err) {
          log('Failed to fetch tasks: ' + err, 'CreateProjectSheet', 'loadTasks', 'ERROR', { variableName: 'err', value: err });
          setError('Unable to load tasks. Please try again.');
        } finally {
          setIsLoadingTasks(false);
        }
      }
    };
    
    loadTasks();
  }, [currentStep, isVisible, tasks]);
  
  // Reset form when sheet is closed
  const handleClose = () => {
    if (isSubmitting) return;
    
    onClose();
    // Reset form after animation completes
    setTimeout(() => {
      setName('');
      setDescription('');
      setSelectedColor(PROJECT_COLORS[0].id);
      setSelectedIcon('');
      setGoals('');
      setMilestones([]);
      setNewMilestone('');
      setSelectedTaskIds([]);
      setError(null);
      setCurrentStep(1);
    }, 300);
  };
  
  // Handle task selection toggle
  const handleTaskSelect = (taskId: string) => {
    log(`Task selection toggled: ${taskId}`, 'CreateProjectSheet', 'handleTaskSelect', 'INFO');
    
    setSelectedTaskIds(prevSelectedIds => {
      // Create a copy of the previous selection
      const newSelection = [...prevSelectedIds];
      
      // Find the index of the task if already selected
      const index = newSelection.indexOf(taskId);
      
      // Toggle selection state
      if (index > -1) {
        // Task is already selected, remove it
        newSelection.splice(index, 1);
        log(`Removed task ${taskId} from selection. New count: ${newSelection.length}`, 'CreateProjectSheet', 'handleTaskSelect', 'DEBUG');
      } else {
        // Task is not selected, add it
        newSelection.push(taskId);
        log(`Added task ${taskId} to selection. New count: ${newSelection.length}`, 'CreateProjectSheet', 'handleTaskSelect', 'DEBUG');
      }
      
      return newSelection;
    });
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    if (!name.trim()) {
      setError('Please enter a project name');
      setCurrentStep(1);
      return;
    }

    if (!goals.trim()) {
      setError('Please enter project goals');
      setCurrentStep(2);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Convert milestones array to JSON string
      const milestonesString = milestones.length > 0 
        ? JSON.stringify(milestones.map(m => m.text))
        : undefined;
      
      // If no icon was explicitly selected but we have a name,
      // we can suggest an icon based on the name
      const iconToUse = selectedIcon || suggestIconFromName(name);
      
      await onCreateProject({
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
        icon: iconToUse,
        goals: goals.trim(),
        milestones: milestonesString,
        taskIds: selectedTaskIds.length > 0 ? selectedTaskIds : undefined
      });
      
      // Close sheet on success
      handleClose();
    } catch (error) {
      log('Failed to create project: ' + error, 'CreateProjectSheet', 'handleSubmit', 'ERROR', { variableName: 'error', value: error });
      setError('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle navigation to next step
  const handleNext = () => {
    if (currentStep === 1) {
      if (!name.trim()) {
        setError('Please enter a project name');
        return;
      }
      setError(null);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!goals.trim()) {
        setError('Please enter project goals');
        return;
      }
      setError(null);
      setCurrentStep(3);
    }
  };
  
  // Handle navigation to previous step
  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };
  
  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={handleClose}
      height={600}
    >
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-2">
          <Text className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Create New Project
          </Text>
          <TouchableOpacity 
            onPress={handleClose}
            disabled={isSubmitting}
            className="p-2"
          >
            <Ionicons 
              name="close" 
              size={24} 
              color={isDark ? '#9CA3AF' : '#6B7280'} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Step indicator */}
        <StepIndicator currentStep={currentStep} totalSteps={3} />
        
        {/* Error message */}
        {error && (
          <View className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
            <Text className="text-red-800">{error}</Text>
          </View>
        )}
        
        <View className="flex-1">
          {/* Step content */}
          {currentStep === 1 && (
            <Step1BasicInfo
              name={name}
              setName={setName}
              description={description}
              setDescription={setDescription}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              selectedIcon={selectedIcon}
              setSelectedIcon={setSelectedIcon}
              isSubmitting={isSubmitting}
              onNext={handleNext}
              isDark={isDark}
            />
          )}
          
          {currentStep === 2 && (
            <Step2GoalsMilestones
              goals={goals}
              setGoals={setGoals}
              milestones={milestones}
              setMilestones={setMilestones}
              newMilestone={newMilestone}
              setNewMilestone={setNewMilestone}
              isSubmitting={isSubmitting}
              onNext={handleNext}
              onBack={handleBack}
              isDark={isDark}
            />
          )}
          
          {currentStep === 3 && (
            <Step3Tasks
              availableTasks={availableTasks}
              selectedTaskIds={selectedTaskIds}
              isLoadingTasks={isLoadingTasks}
              isSubmitting={isSubmitting}
              onSelectTask={handleTaskSelect}
              onBack={handleBack}
              onSubmit={handleSubmit}
              isDark={isDark}
            />
          )}
        </View>
      </View>
    </BottomSheet>
  );
};

