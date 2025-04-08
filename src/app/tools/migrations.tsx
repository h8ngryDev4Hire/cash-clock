import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { storageService } from '@lib/services/storage/StorageService';
import { Stack } from 'expo-router';

// Simple Button component as a fallback since we don't have access to the actual Button component
const Button = ({ 
  children, 
  onPress, 
  disabled = false, 
  variant = 'primary', 
  style = {} 
}: { 
  children: React.ReactNode; 
  onPress: () => void; 
  disabled?: boolean; 
  variant?: 'primary' | 'secondary'; 
  style?: any;
}) => {
  const backgroundColor = variant === 'primary' 
    ? (disabled ? '#a0a0a0' : '#0066cc') 
    : (disabled ? '#e0e0e0' : '#f0f0f0');
  
  const textColor = variant === 'primary' ? '#ffffff' : '#333333';
  
  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor,
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={{ color: textColor, fontWeight: '600' }}>{children}</Text>
    </TouchableOpacity>
  );
};

/**
 * Migration Tools Screen
 * This screen provides tools for diagnosing and fixing database migration issues
 */
export default function MigrationTools() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const handleSyncSchemas = async () => {
    setIsLoading(true);
    addLog('Starting schema sync...');
    
    try {
      await storageService.initialize();
      addLog('Database initialized');
      
      // Access the migrationService through the storageService
      const result = await storageService['migrationService'].syncSchemas();
      addLog(`Schema sync completed with result: ${result ? 'SUCCESS' : 'FAILURE'}`);
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceProjectsUpdate = async () => {
    setIsLoading(true);
    addLog('Forcing projects table schema update...');
    
    try {
      await storageService.initialize();
      addLog('Database initialized');
      
      // Access the migrationService through the storageService
      const result = await storageService['migrationService'].forceSchemaUpdate('projects');
      addLog(`Projects schema update completed with result: ${result ? 'SUCCESS' : 'FAILURE'}`);
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceAllTableUpdates = async () => {
    setIsLoading(true);
    addLog('Starting update for all tables...');
    
    try {
      await storageService.initialize();
      addLog('Database initialized');
      
      const tables = ['projects', 'tasks', 'time_entries', 'settings'];
      
      for (const table of tables) {
        addLog(`Updating schema for ${table}...`);
        // Access the migrationService through the storageService
        const result = await storageService['migrationService'].forceSchemaUpdate(table);
        addLog(`Schema update for ${table}: ${result ? 'SUCCESS' : 'FAILURE'}`);
      }
      
      addLog('All table updates completed');
    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Migration Tools' }} />
      
      <View style={styles.buttonGroup}>
        <Button 
          onPress={handleSyncSchemas}
          disabled={isLoading}
          style={styles.button}
        >
          Run Schema Sync
        </Button>
        
        <Button 
          onPress={handleForceProjectsUpdate}
          disabled={isLoading}
          style={styles.button}
        >
          Force Projects Table Update
        </Button>
        
        <Button 
          onPress={handleForceAllTableUpdates}
          disabled={isLoading}
          style={styles.button}
        >
          Force All Tables Update
        </Button>
        
        <Button 
          onPress={clearLogs}
          variant="secondary"
          style={styles.button}
        >
          Clear Logs
        </Button>
      </View>
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={styles.loadingText}>Running migration...</Text>
        </View>
      )}
      
      <View style={styles.logContainer}>
        <Text style={styles.logHeader}>Operation Logs:</Text>
        <ScrollView style={styles.logScrollView}>
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>No logs yet. Run an operation to see results.</Text>
          ) : (
            logs.map((log, index) => (
              <Text key={index} style={styles.logEntry}>{log}</Text>
            ))
          )}
        </ScrollView>
      </View>
      
      <Text style={styles.disclaimer}>
        Note: Use these tools only when experiencing database issues. Normal app operation should handle migrations automatically.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  buttonGroup: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
    backgroundColor: '#e0f0ff',
    padding: 12,
    borderRadius: 8,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  logContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  logHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  logScrollView: {
    flex: 1,
  },
  logEntry: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  disclaimer: {
    marginTop: 16,
    fontStyle: 'italic',
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
}); 