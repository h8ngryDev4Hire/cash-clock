import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ColorSelector from '../components/ColorSelector';
import IconSelector from '../components/IconSelector';
import MilestoneItem from '../components/MilestoneItem';

// Define milestone interface
interface Milestone {
  id: string;
  text: string;
}

interface EditModeProps {
  projectName: string;
  projectDescription: string;
  projectGoals: string;
  projectColor: string;
  projectIcon: string;
  milestones: Milestone[];
  newMilestone: string;
  isSaving: boolean;
  onNameChange: (text: string) => void;
  onDescriptionChange: (text: string) => void;
  onGoalsChange: (text: string) => void;
  onColorSelect: (colorId: string) => void;
  onIconSelect: (iconId: string) => void;
  onSetNewMilestone: (text: string) => void;
  onAddMilestone: () => void;
  onRemoveMilestone: (id: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isDark: boolean;
}

/**
 * Edit mode tab for Project Details
 */
const EditMode: React.FC<EditModeProps> = ({
  projectName,
  projectDescription,
  projectGoals,
  projectColor,
  projectIcon,
  milestones,
  newMilestone,
  isSaving,
  onNameChange,
  onDescriptionChange,
  onGoalsChange,
  onColorSelect,
  onIconSelect,
  onSetNewMilestone,
  onAddMilestone,
  onRemoveMilestone,
  onSave,
  onCancel,
  isDark
}) => {
  return (
    <View className="mb-4">
      {/* Project name field */}
      <View className="mb-3">
        <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Project Name <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border`}
          placeholder="Enter project name"
          placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
          value={projectName}
          onChangeText={onNameChange}
          maxLength={50}
        />
      </View>
      
      {/* Project description field */}
      <View className="mb-3">
        <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Description (Optional)
        </Text>
        <TextInput
          className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border min-h-[80px]`}
          placeholder="Enter project description"
          placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
          value={projectDescription}
          onChangeText={onDescriptionChange}
          multiline
          maxLength={200}
          textAlignVertical="top"
        />
      </View>
      
      {/* Project color field */}
      <View className="mb-3">
        <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Project Color
        </Text>
        <ColorSelector 
          selectedColor={projectColor}
          onSelectColor={onColorSelect}
          isDark={isDark}
        />
      </View>
      
      {/* Project icon field */}
      <View className="mb-3">
        <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Project Icon
        </Text>
        <IconSelector
          selectedIcon={projectIcon}
          selectedColor={projectColor}
          onSelectIcon={onIconSelect}
          isDark={isDark}
        />
      </View>
      
      {/* Project goals field */}
      <View className="mb-3">
        <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Project Goals <Text className="text-red-500">*</Text>
        </Text>
        <TextInput
          className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border min-h-[80px]`}
          placeholder="Enter project goals"
          placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
          value={projectGoals}
          onChangeText={onGoalsChange}
          multiline
          maxLength={200}
          textAlignVertical="top"
        />
      </View>
      
      {/* Milestones field */}
      <View className="mb-3">
        <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Milestones
        </Text>
        
        {/* Existing milestones */}
        {milestones.map(milestone => (
          <MilestoneItem 
            key={milestone.id}
            milestone={milestone}
            onRemove={onRemoveMilestone}
            isDark={isDark}
            showDelete={true}
          />
        ))}
        
        {/* Add new milestone input */}
        <View className="flex-row mt-2">
          <TextInput
            className={`flex-1 p-3 rounded-l-lg ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'} border`}
            placeholder="Add a milestone"
            placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
            value={newMilestone}
            onChangeText={onSetNewMilestone}
            maxLength={100}
          />
          <TouchableOpacity
            onPress={onAddMilestone}
            className={`justify-center items-center px-4 rounded-r-lg ${isDark ? 'bg-indigo-600' : 'bg-indigo-500'}`}
            disabled={!newMilestone.trim()}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Actions buttons */}
      <View className="flex-row justify-end mt-4">
        <TouchableOpacity
          onPress={onCancel}
          className={`px-4 py-2 mr-2 rounded-lg border border-gray-300 ${isSaving ? 'opacity-50' : 'opacity-100'}`}
          disabled={isSaving}
        >
          <Text className={isDark ? 'text-white' : 'text-gray-800'}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={isSaving ? undefined : onSave}
          activeOpacity={0.7}
          className={`px-4 py-2 rounded-lg ${isDark ? 'bg-indigo-600' : 'bg-indigo-500'} ${(!projectName.trim() || !projectGoals.trim() || isSaving) ? 'opacity-50' : 'opacity-100'}`}
          disabled={isSaving || !projectName.trim() || !projectGoals.trim()}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="text-white">Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default EditMode; 