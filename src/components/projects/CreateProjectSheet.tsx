import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  useColorScheme,
  StyleSheet,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '../shared/BottomSheet';
import { PROJECT_COLORS, ProjectColor } from '@lib/util/project/projectColors';
import { log } from '@lib/util/debugging/logging';

// Define a milestone interface
interface Milestone {
  id: string;
  text: string;
}

interface CreateProjectSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onCreateProject: (data: { 
    name: string; 
    description?: string; 
    color: string;
    goals: string; // Changed from optional to required
    milestones?: string;
  }) => Promise<void>;
}

/**
 * Bottom sheet for creating a new project with a two-step wizard
 */
const CreateProjectSheet: React.FC<CreateProjectSheetProps> = ({
  isVisible,
  onClose,
  onCreateProject
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Step state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(PROJECT_COLORS[0].id);
  const [goals, setGoals] = useState('');
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reset form when sheet is closed
  const handleClose = () => {
    if (isSubmitting) return;
    
    onClose();
    // Reset form after animation completes
    setTimeout(() => {
      setName('');
      setDescription('');
      setSelectedColor(PROJECT_COLORS[0].id);
      setGoals('');
      setMilestones([]);
      setNewMilestone('');
      setError(null);
      setCurrentStep(1);
    }, 300);
  };

  // Handle adding a new milestone
  const handleAddMilestone = () => {
    if (!newMilestone.trim()) {
      return;
    }
    
    const milestone: Milestone = {
      id: Date.now().toString(),
      text: newMilestone.trim()
    };
    
    setMilestones([...milestones, milestone]);
    setNewMilestone('');
  };

  // Handle removing a milestone
  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter(milestone => milestone.id !== id));
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
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Convert milestones array to JSON string
      const milestonesString = milestones.length > 0 
        ? JSON.stringify(milestones.map(m => m.text))
        : undefined;
      
      await onCreateProject({
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor,
        goals: goals.trim(),  // Required now
        milestones: milestonesString
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
    if (!name.trim()) {
      setError('Please enter a project name');
      return;
    }
    
    setError(null);
    setCurrentStep(2);
  };
  
  // Handle navigation to previous step
  const handleBack = () => {
    setCurrentStep(1);
  };
  
  // Render color selector
  const renderColorOptions = () => {
    return (
      <View className="flex-row flex-wrap mt-2">
        {PROJECT_COLORS.map((color) => (
          <TouchableOpacity
            key={color.id}
            className="mr-3 mb-3 items-center"
            onPress={() => setSelectedColor(color.id)}
            accessibilityLabel={`Color ${color.name}`}
            accessibilityState={{ selected: selectedColor === color.id }}
          >
            <View 
              className={`w-10 h-10 rounded-full items-center justify-center mb-1 border-2 ${selectedColor === color.id ? 'border-blue-500' : 'border-transparent'}`}
              style={{ backgroundColor: color.value }}
            >
              {selectedColor === color.id && (
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              )}
            </View>
            {selectedColor === color.id && (
              <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {color.name}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render milestone item
  const renderMilestoneItem = (item: Milestone) => {
    return (
      <View className={`flex-row items-center p-2 mb-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <Text className={`flex-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {item.text}
        </Text>
        <TouchableOpacity
          onPress={() => handleRemoveMilestone(item.id)}
          className="p-1"
        >
          <Ionicons name="close-circle" size={20} color={isDark ? '#9CA3AF' : '#6B7280'} />
        </TouchableOpacity>
      </View>
    );
  };
  
  // Render step indicator
  const renderStepIndicator = () => {
    return (
      <View className="flex-row items-center justify-center mb-4">
        <View className={`h-2 w-2 rounded-full ${currentStep === 1 ? 'bg-blue-500' : 'bg-gray-300'} mr-1`} />
        <Text className={`text-xs mr-2 ${currentStep === 1 ? 'text-blue-500 font-medium' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Step 1
        </Text>
        <View className="h-px w-4 bg-gray-300" />
        <View className={`h-2 w-2 rounded-full ${currentStep === 2 ? 'bg-blue-500' : 'bg-gray-300'} ml-1`} />
        <Text className={`text-xs ml-1 ${currentStep === 2 ? 'text-blue-500 font-medium' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Step 2
        </Text>
      </View>
    );
  };
  
  // Render Step 1: Basic Info
  const renderStep1 = () => {
    return (
      <>
        {/* Project name */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Project Name <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border`}
            placeholder="Enter project name"
            placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
            value={name}
            onChangeText={setName}
            maxLength={50}
            autoCapitalize="words"
            editable={!isSubmitting}
          />
        </View>
        
        {/* Project description */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Description (Optional)
          </Text>
          <TextInput
            className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border min-h-[80px]`}
            placeholder="Enter project description"
            placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={200}
            editable={!isSubmitting}
            textAlignVertical="top"
          />
        </View>
        
        {/* Color selection */}
        <View className="mb-6">
          <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Project Color
          </Text>
          {renderColorOptions()}
        </View>
        
        {/* Next button */}
        <TouchableOpacity
          className="py-3 rounded-lg items-center justify-center bg-blue-500"
          onPress={handleNext}
          disabled={isSubmitting}
        >
          <Text className="text-white font-medium">Next</Text>
        </TouchableOpacity>
      </>
    );
  };
  
  // Render Step 2: Goals & Milestones
  const renderStep2 = () => {
    return (
      <>
        {/* Project goals */}
        <View className="mb-4">
          <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Project Goals <Text className="text-red-500">*</Text>
          </Text>
          <TextInput
            className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border min-h-[80px]`}
            placeholder="What are the main objectives of this project?"
            placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
            value={goals}
            onChangeText={setGoals}
            multiline
            maxLength={300}
            editable={!isSubmitting}
            textAlignVertical="top"
          />
        </View>
        
        {/* Project milestones */}
        <View className="mb-6">
          <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Key Milestones (Optional)
          </Text>
          
          {/* Milestone list */}
          {milestones.length > 0 && (
            <View className="mb-2">
              {milestones.map(milestone => renderMilestoneItem(milestone))}
            </View>
          )}
          
          {/* Add milestone form */}
          <View className="flex-row mb-2">
            <TextInput
              className={`flex-1 p-3 rounded-l-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border-r-0 border`}
              placeholder="Add a milestone"
              placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
              value={newMilestone}
              onChangeText={setNewMilestone}
              editable={!isSubmitting}
            />
            <TouchableOpacity
              className={`px-3 rounded-r-lg items-center justify-center ${isDark ? 'bg-gray-700 border-gray-700' : 'bg-gray-200 border-gray-200'} border`}
              onPress={handleAddMilestone}
              disabled={!newMilestone.trim() || isSubmitting}
            >
              <Ionicons name="add" size={24} color={isDark ? '#FFFFFF' : '#374151'} />
            </TouchableOpacity>
          </View>
          
          <Text className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Add important deliverables or deadlines for your project
          </Text>
        </View>
        
        {/* Navigation buttons */}
        <View className="flex-row space-x-3">
          <TouchableOpacity
            className="flex-1 py-3 rounded-lg items-center justify-center bg-gray-200 dark:bg-gray-700"
            onPress={handleBack}
            disabled={isSubmitting}
          >
            <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`flex-1 py-3 rounded-lg items-center justify-center ${isSubmitting ? 'bg-blue-400' : !goals.trim() ? 'bg-blue-300' : 'bg-blue-500'}`}
            onPress={handleSubmit}
            disabled={isSubmitting || !goals.trim()}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text className="text-white font-medium">Create Project</Text>
            )}
          </TouchableOpacity>
        </View>
      </>
    );
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
        {renderStepIndicator()}
        
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Error message */}
          {error && (
            <View className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
              <Text className="text-red-800">{error}</Text>
            </View>
          )}
          
          {/* Step content */}
          {currentStep === 1 ? renderStep1() : renderStep2()}
        </ScrollView>
      </View>
    </BottomSheet>
  );
};

export default CreateProjectSheet; 