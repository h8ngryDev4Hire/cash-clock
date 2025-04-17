import { useCallback, useEffect, useState } from 'react';
import { useTask } from './useTask';
import { useProject } from './useProject';
import { getColorValue } from '@lib/util/project/projectColors';
import { log } from '@lib/util/debugging/logging';
import { Task } from '@def/core';
import { TaskSchema } from '@def/entities';

export interface SearchTaskItem {
  id: string;
  name: string;
  projectId?: string;
  projectName?: string;
  projectColor?: string;
}

export function useTaskSearch() {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<SearchTaskItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Get tasks and projects data
  const { tasks } = useTask();
  const { getProjectById } = useProject();
  
  // Search tasks based on search text
  const searchTasks = useCallback((text: string) => {
    if (!text.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    log(`Searching tasks with query: "${text}"`, 'useTaskSearch', 'searchTasks', 'INFO');
    
    // Get all tasks and filter by search text
    const allTasks = tasks;
    const normalizedSearchText = text.trim().toLowerCase();
    
    const filteredTasks = allTasks
      .filter((task: TaskSchema) => task.name.toLowerCase().includes(normalizedSearchText))
      .map((task: TaskSchema) => {
        let projectName = undefined;
        let projectColor = undefined;
        
        // Add project info if task is assigned to a project
        if (task.projectId) {
          const project = getProjectById(task.projectId);
          if (project) {
            projectName = project.name;
            projectColor = getColorValue(project.color);
          }
        }
        
        return {
          id: task.itemId,
          name: task.name,
          projectId: task.projectId || undefined,
          projectName,
          projectColor
        };
      });
    
    // Sort results: active tasks first, then recently created
    filteredTasks.sort((a: SearchTaskItem, b: SearchTaskItem) => {
      const taskA = allTasks.find((t: TaskSchema) => t.itemId === a.id);
      const taskB = allTasks.find((t: TaskSchema) => t.itemId === b.id);
      
      // Sort active tasks first
      if (taskA?.isRunning && !taskB?.isRunning) return -1;
      if (!taskA?.isRunning && taskB?.isRunning) return 1;
      
      // Then sort by creation time (newest first)
      if (taskA && taskB) {
        return taskB.created - taskA.created;
      }
      
      return 0;
    });
    
    setSearchResults(filteredTasks);
    setIsSearching(false);
    
    // Show results panel if we have search text
    if (text.trim()) {
      setShowResults(true);
    }
  }, [tasks, getProjectById]);
  
  // Debounced search for performance
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchTasks(searchText);
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchText, searchTasks]);
  
  // Update search text
  const handleSearchTextChange = (text: string) => {
    setSearchText(text);
    if (!text.trim()) {
      setShowResults(false);
    }
  };
  
  // Close search results panel
  const closeSearch = () => {
    setShowResults(false);
    setSearchText('');
  };
  
  return {
    searchText,
    searchResults,
    isSearching,
    showResults,
    handleSearchTextChange,
    closeSearch,
    setShowResults
  };
}

export default useTaskSearch; 