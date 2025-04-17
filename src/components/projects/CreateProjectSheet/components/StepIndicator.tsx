import React from 'react';
import { View } from 'react-native';
import { StepIndicatorProps } from '@def/projects';

/**
 * A component that displays step indicators for a multi-step form
 */
const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <View className="flex-row items-center justify-center mb-4">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <React.Fragment key={index}>
          <View 
            className={`h-2 w-2 rounded-full ${
              currentStep === index + 1 ? 'bg-blue-500' : 'bg-gray-300'
            }`} 
          />
          {index < totalSteps - 1 && (
            <View className="h-px w-6 bg-gray-300 mx-1" />
          )}
        </React.Fragment>
      ))}
    </View>
  );
};

export default StepIndicator; 