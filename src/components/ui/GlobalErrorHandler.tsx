import React from 'react';
import { useError } from '@hooks/useError';
import { GlobalErrorMessage } from './GlobalErrorMessage';

/**
 * GlobalErrorHandler can be placed in a layout component to handle
 * and display global errors throughout the application.
 */
export const GlobalErrorHandler: React.FC = () => {
  // Initialize with handleGlobalErrors=true to subscribe to global errors
  const { error, clearError } = useError('GlobalErrorHandler', true);
  
  return (
    <GlobalErrorMessage
      error={error}
      onDismiss={clearError}
      autoDismiss={error?.level !== 'fatal'} // Don't auto-dismiss fatal errors
    />
  );
}; 