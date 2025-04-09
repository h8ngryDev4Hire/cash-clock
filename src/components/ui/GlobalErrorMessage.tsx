import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions, Pressable } from 'react-native';
import { ErrorLevel, AppError } from '@def/error';
import { log } from '@lib/util/debugging/logging';

interface GlobalErrorMessageProps {
  error: AppError | null;
  onDismiss?: () => void;
  autoDismiss?: boolean;
  dismissTimeout?: number;
}

/**
 * GlobalErrorMessage displays app-wide errors in a toast-like notification
 * that slides in from the top of the screen
 */
export const GlobalErrorMessage: React.FC<GlobalErrorMessageProps> = ({
  error,
  onDismiss,
  autoDismiss = true,
  dismissTimeout = 5000 // 5 seconds default
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [isMounted, setIsMounted] = useState(true);
  
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  useEffect(() => {
    if (!error) return;
    
    // Animate in
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      })
    ]).start();
    
    // Auto dismiss if enabled and not a fatal error
    if (autoDismiss && onDismiss && error.level !== ErrorLevel.FATAL && isMounted) {
      log('Setting auto-dismiss timeout for ' + dismissTimeout + 'ms', 'GlobalErrorMessage', 'useEffect', 'INFO');
      const timer = setTimeout(() => {
        log('Auto-dismissing error', 'GlobalErrorMessage', 'useEffect', 'INFO');
        if (isMounted) {
          dismiss();
        }
      }, dismissTimeout);
      
      return () => {
        log('Clearing auto-dismiss timeout', 'GlobalErrorMessage', 'useEffect', 'INFO');
        clearTimeout(timer);
      };
    }
  }, [error, isMounted]);
  
  // Animate out and then call onDismiss
  const dismiss = () => {
    if (!onDismiss || !isMounted) return;
    
    log('Dismissing error', 'GlobalErrorMessage', 'dismiss', 'INFO');
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      if (isMounted) {
        onDismiss();
      }
    });
  };
  
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
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        getStylesForLevel(),
        { 
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim
        }
      ]}
    >
      <Pressable 
        onPress={dismiss}
        style={styles.contentContainer}
      >
        <Text style={styles.icon}>{getIconForLevel()}</Text>
        <Text style={styles.message}>{error.userMessage}</Text>
        {onDismiss && (
          <TouchableOpacity 
            onPress={dismiss} 
            style={styles.dismissButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            accessibilityLabel="Dismiss global error"
            accessibilityHint="Tap to dismiss this error message"
          >
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        )}
      </Pressable>
    </Animated.View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50, // Adjust for status bar
    left: 15,
    right: 15,
    width: width - 30,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    width: '100%',
  },
  info: {
    backgroundColor: '#e6f7ff',
    borderLeftWidth: 4,
    borderLeftColor: '#1890ff',
  },
  warning: {
    backgroundColor: '#fffbe6',
    borderLeftWidth: 4,
    borderLeftColor: '#faad14',
  },
  error: {
    backgroundColor: '#fff1f0',
    borderLeftWidth: 4,
    borderLeftColor: '#f5222d',
  },
  fatal: {
    backgroundColor: '#4c0014',
    borderLeftWidth: 4,
    borderLeftColor: '#ff4d4f',
    borderWidth: 1,
    borderColor: '#ff4d4f',
  },
  icon: {
    marginRight: 10,
    fontSize: 18,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
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