import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Step1Props } from '@def/components';
import ColorSelector from '../components/ColorSelector';
import IconSelector from '../components/IconSelector';

/**
 * Step 1 of project creation - Basic information (name, description, color, icon)
 */
const Step1BasicInfo: React.FC<Step1Props> = ({
  name,
  setName,
  description,
  setDescription,
  selectedColor,
  setSelectedColor,
  selectedIcon,
  setSelectedIcon,
  isSubmitting,
  onNext,
  isDark
}) => {
  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
      <View className="mb-4">
        <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Project Color
        </Text>
        <ColorSelector 
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
          isDark={isDark}
        />
      </View>
      
      {/* Icon selection */}
      <View className="mb-6">
        <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          Project Icon
        </Text>
        <IconSelector
          selectedIcon={selectedIcon}
          selectedColor={selectedColor}
          onSelectIcon={setSelectedIcon}
          isDark={isDark}
        />
      </View>
      
      {/* Next button */}
      <TouchableOpacity
        className="py-3 rounded-lg items-center justify-center bg-blue-500"
        onPress={onNext}
        disabled={isSubmitting}
      >
        <Text className="text-white font-medium">Next</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Step1BasicInfo; 