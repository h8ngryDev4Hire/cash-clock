import React, { useState, useEffect } from 'react';
import { TimerProvider } from './TimerContext';
import { TaskProvider } from './TaskContext';
import { StorageProvider } from './StorageContext';
import { orchestratorService } from '@lib/services/orchestrator/OrchestratorService';
import { AppLoading } from '@components/ui/AppLoading';
import { log } from '@lib/util/debugging/logging';

/**
 * AppProvider handles the initialization of the application
 * through the orchestratorService and provides all context providers.
 */
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationMessage, setInitializationMessage] = useState('Starting application...');
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initializeApp = async () => {
      try {
        log('Starting application initialization process', 'AppContext', 'initializeApp', 'INFO');
        setInitializationMessage('Initializing services...');
        
        const result = await orchestratorService.initialize();
        
        if (mounted) {
          if (result) {
            log('Application initialization completed successfully', 'AppContext', 'initializeApp', 'INFO');
            setIsInitialized(true);
          } else {
            const errors = orchestratorService.getInitializationErrors();
            const errorMessages = Object.entries(errors)
              .filter(([_, error]) => !!error)
              .map(([service, error]) => `${service}: ${error?.message || 'Unknown error'}`)
              .join('; ');
              
            setError(new Error(`Initialization failed: ${errorMessages}`));
            log('Application initialization failed: ' + errorMessages, 'AppContext', 'initializeApp', 'ERROR');
          }
        }
      } catch (err) {
        if (mounted) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          log('Unexpected error during initialization: ' + error.message, 'AppContext', 'initializeApp', 'ERROR');
        }
      }
    };
    
    initializeApp();
    
    return () => {
      mounted = false;
    };
  }, []);

  // If there's an error, render an error screen
  if (error) {
    return (
      <AppLoading message={`Initialization error: ${error.message}. Please restart the application.`} />
    );
  }

  // If initialization is not complete, render the loading screen
  if (!isInitialized) {
    return <AppLoading message={initializationMessage} />;
  }

  // Once initialized, render the application with all providers
  return (
    <StorageProvider>
      <TaskProvider>
        <TimerProvider>
          {children}
        </TimerProvider>
      </TaskProvider>
    </StorageProvider>
  );
};
