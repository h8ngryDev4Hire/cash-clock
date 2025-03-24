import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

/**
 * Button component - A reusable button with different variants and sizes
 */
const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = ''
}) => {
  // Variant styles
  const variantClasses = {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-200',
    danger: 'bg-red-500'
  };
  
  // Text color based on variant
  const textClasses = {
    primary: 'text-white',
    secondary: 'text-gray-800',
    danger: 'text-white'
  };
  
  // Size styles
  const sizeClasses = {
    small: 'py-1 px-3',
    medium: 'py-2 px-4',
    large: 'py-3 px-6'
  };
  
  // Text sizes based on button size
  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };
  
  // Icon sizes based on button size
  const iconSizes = {
    small: 16,
    medium: 20,
    large: 24
  };

  return (
    <TouchableOpacity
      className={`rounded-lg ${sizeClasses[size]} ${variantClasses[variant]} 
        ${disabled ? 'opacity-50' : 'opacity-100'}
        ${fullWidth ? 'w-full' : 'w-auto'}
        flex-row items-center justify-center ${className}`}
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'secondary' ? '#4B5563' : '#FFFFFF'} 
        />
      ) : (
        <>
          {icon && (
            <Ionicons 
              name={icon} 
              size={iconSizes[size]} 
              color={variant === 'secondary' ? '#4B5563' : '#FFFFFF'} 
              className="mr-2"
            />
          )}
          <Text 
            className={`font-medium ${textSizeClasses[size]} ${textClasses[variant]}`}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;