import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Step2Props } from '@def/components';
import MilestoneItem from '../components/MilestoneItem';

/**
 * Step 2 of project creation - Goals and milestones
 */
const Step2GoalsMilestones: React.FC<Step2Props> = ({
  goals,
  setGoals,
  milestones,
  setMilestones,
  newMilestone,
  setNewMilestone,
  isSubmitting,
  onNext,
  onBack,
  isDark
}) => {
  // Handle adding a new milestone
  const handleAddMilestone = () => {
    if (!newMilestone.trim()) {
      return;
    }
    
    const milestone = {
      id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: newMilestone.trim()
    };
    
    setMilestones([...milestones, milestone]);
    setNewMilestone('');
  };

  // Handle removing a milestone
  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter(milestone => milestone.id !== id));
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
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
            {milestones.map(milestone => (
              <MilestoneItem 
                key={milestone.id}
                milestone={milestone}
                onRemove={handleRemoveMilestone}
                isDark={isDark}
              />
            ))}
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
          onPress={onBack}
          disabled={isSubmitting}
        >
          <Text className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="flex-1 py-3 rounded-lg items-center justify-center bg-blue-500"
          onPress={onNext}
          disabled={isSubmitting || !goals.trim()}
        >
          <Text className="text-white font-medium">Next</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Step2GoalsMilestones; 