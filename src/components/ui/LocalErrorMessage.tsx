import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, TouchableWithoutFeedback, Pressable } from 'react-native';
import { ErrorLevel, AppError } from '@def/error';
import { log } from '@lib/util/debugging/logging';

interface LocalErrorMessageProps {
  error: AppError | null;
  onDismiss?: () => void;
  containerStyle?: object;
  textStyle?: object;
  showIcon?: boolean;
  autoDismissTimeout?: number; // Time in ms before auto-dismissing
}

/**
 * LocalErrorMessage displays contextual errors within components
 * For component-specific error feedback that appears near the relevant UI element
 */
export const LocalErrorMessage: React.FC<LocalErrorMessageProps> = ({
  error,
  onDismiss,
  containerStyle,
  textStyle,
  showIcon = true,
  autoDismissTimeout = 5000 // Default 5 seconds
}) => {
  // Track if component is mounted to prevent state updates after unmount
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  useEffect(() => {
    if (!error || !onDismiss || !isMounted) return;
    
    // Don't auto-dismiss fatal errors
    if (error.level !== ErrorLevel.FATAL) {
      log('Setting auto-dismiss timeout for ' + autoDismissTimeout + 'ms', 'LocalErrorMessage', 'INFO');
      const timer = setTimeout(() => {
        log('Auto-dismissing error', 'LocalErrorMessage', 'INFO');
        if (isMounted && onDismiss) {
          onDismiss();
        }
      }, autoDismissTimeout);
      
      // Clean up timer
      return () => {
        log('Clearing auto-dismiss timeout', 'LocalErrorMessage', 'INFO');
        clearTimeout(timer);
      };
    }
  }, [error, onDismiss, autoDismissTimeout, isMounted]);
  
  if (!error) return null;
  
  // Determine styles based on error level
  const getStylesForLevel = () => {
    switch (error.level) {
      case ErrorLevel.INFO:
        return styles.info;
      case ErrorLevel.WARNING:
        return styles.warning;
      case ErrorLevel.FATAL:
        return styles.fatal;
      case ErrorLevel.ERROR:
      default:
        return styles.error;
    }
  };
  
  // Determine icon based on error level
  const getIconForLevel = () => {
    switch (error.level) {
      case ErrorLevel.INFO:
        return 'ℹ️';
      case ErrorLevel.WARNING:
        return '⚠️';
      case ErrorLevel.FATAL:
        return '❌';
      case ErrorLevel.ERROR:
      default:
        return '⛔';
    }
  };
  
  // Manually dismiss the error
  const handleDismiss = () => {
    log('Manual dismiss triggered', 'LocalErrorMessage', 'INFO');
    if (onDismiss) {
      onDismiss();
    }
  };
  
  return (
    <Pressable onPress={handleDismiss} style={[styles.container, getStylesForLevel(), containerStyle]}>
      {showIcon && (
        <Text style={styles.icon}>{getIconForLevel()}</Text>
      )}
      <Text style={[styles.message, textStyle]}>{error.userMessage}</Text>
      {onDismiss && (
        <TouchableOpacity 
          onPress={handleDismiss} 
          style={styles.dismissButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          accessibilityLabel="Dismiss error"
          accessibilityHint="Tap to dismiss this error message"
        >
          <Text style={styles.dismissText}>✕</Text>
        </TouchableOpacity>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginVertical: 4,
    borderRadius: 4,
  },
  info: {
    backgroundColor: '#e6f7ff',
    borderLeftWidth: 3,
    borderLeftColor: '#1890ff',
  },
  warning: {
    backgroundColor: '#fffbe6',
    borderLeftWidth: 3,
    borderLeftColor: '#faad14',
  },
  error: {
    backgroundColor: '#fff1f0',
    borderLeftWidth: 3,
    borderLeftColor: '#f5222d',
  },
  fatal: {
    backgroundColor: '#4c0014',
    borderLeftWidth: 3,
    borderLeftColor: '#ff4d4f',
  },
  icon: {
    marginRight: 8,
    fontSize: 16,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 18,
  },
  dismissButton: {
    padding: 8,
    marginLeft: 8,
  },
  dismissText: {
    fontSize: 18,
    color: '#666',
    fontWeight: 'bold',
  },
}); 