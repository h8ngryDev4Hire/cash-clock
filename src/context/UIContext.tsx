import React, { createContext, useState, useContext } from 'react';

// Define the UI context interface
interface UIContextType {
  isGlobalCreateMenuOpen: boolean;
  setGlobalCreateMenuOpen: (isOpen: boolean) => void;
}

// Create context with default values
const UIContext = createContext<UIContextType>({
  isGlobalCreateMenuOpen: false,
  setGlobalCreateMenuOpen: () => {},
});

// Create provider component
export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isGlobalCreateMenuOpen, setGlobalCreateMenuOpen] = useState(false);

  const value = {
    isGlobalCreateMenuOpen,
    setGlobalCreateMenuOpen,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

// Create custom hook for using the UI context
export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};

export default UIContext; 