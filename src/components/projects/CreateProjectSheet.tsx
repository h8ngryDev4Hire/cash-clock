import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  useColorScheme,
  StyleSheet,
  ActivityIndicator 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '../shared/BottomSheet';
import { PROJECT_COLORS, ProjectColor } from '@lib/util/project/projectColors';
import { log } from '@lib/util/debugging/logging';

interface CreateProjectSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onCreateProject: (data: { name: string; description?: string; color: string }) => Promise<void>;
}

/**
 * Bottom sheet for creating a new project
 */
const CreateProjectSheet: React.FC<CreateProjectSheetProps> = ({
  isVisible,
  onClose,
  onCreateProject
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(PROJECT_COLORS[0].id);
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
      setError(null);
    }, 300);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    if (!name.trim()) {
      setError('Please enter a project name');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await onCreateProject({
        name: name.trim(),
        description: description.trim() || undefined,
        color: selectedColor
      });
      
      // Close sheet on success
      handleClose();
    } catch (error) {
      log('Failed to create project: ' + error, 'CreateProjectSheet', 'ERROR', { variableName: 'error', value: error });
      setError('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
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
  
  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={handleClose}
      height={500}
    >
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-4">
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
        
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Error message */}
          {error && (
            <View className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
              <Text className="text-red-800">{error}</Text>
            </View>
          )}
          
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
        </ScrollView>
        
        {/* Create button */}
        <TouchableOpacity
          className={`py-3 rounded-lg items-center justify-center ${isSubmitting ? 'bg-blue-400' : 'bg-blue-500'}`}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text className="text-white font-medium">Create Project</Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
};

export default CreateProjectSheet; 