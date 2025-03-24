import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage adapter for React Native
 * Provides localStorage-like API but uses AsyncStorage
 */
export const storage = {
  /**
   * Get an item from storage
   * @param key Key to retrieve
   * @returns Value or null if not found
   */
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  },
  
  /**
   * Set an item in storage
   * @param key Key to store
   * @param value Value to store
   */
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  },
  
  /**
   * Remove an item from storage
   * @param key Key to remove
   */
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  },
  
  /**
   * Clear all storage
   */
  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
  
  /**
   * Get all keys in storage
   */
  getAllKeys: async (): Promise<string[]> => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys from storage:', error);
      return [];
    }
  },
  
  /**
   * Synchronous getItem wrapper - internally awaits the async operation
   * (Note: This still returns a Promise, but allows code to look synchronous)
   */
  getItemSync: (key: string): Promise<string | null> => {
    return storage.getItem(key);
  },
  
  /**
   * Synchronous setItem wrapper - internally awaits the async operation
   */
  setItemSync: (key: string, value: string): Promise<void> => {
    return storage.setItem(key, value);
  },
}; 