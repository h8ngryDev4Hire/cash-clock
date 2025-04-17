import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, TextInput, useColorScheme, Keyboard, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TimerControls from './TimerControls';
import TaskSearchResults from '../search/TaskSearchResults';
import { formatElapsedTime } from '@lib/util/time/timeFormatters';
import { log } from '@lib/util/debugging/logging';
import useTaskSearch from '@hooks/useTaskSearch';
import { useUI } from '@context/UIContext';

interface TimerPlayerProps {
  isVisible?: boolean;
  activeTimer?: boolean;
  taskName?: string;
  elapsedTime?: number;
  isRunning?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onTaskPress?: () => void;
  onStartNewTask?: (taskName: string) => void;
  onSelectExistingTask?: (taskId: string) => void;
}

/**
 * TimerPlayer component displays the currently active timer or input to create a new task
 * at the bottom of the screen
 */
const TimerPlayer: React.FC<TimerPlayerProps> = ({
  isVisible = true,
  activeTimer = false,
  taskName = "Project research",
  elapsedTime = 1513, // 25 minutes and 13 seconds
  isRunning = true,
  onPause = () => log('Pause', 'TimerPlayer', 'onPause', 'DEBUG'),
  onResume = () => log('Resume', 'TimerPlayer', 'onResume', 'DEBUG'),
  onStop = () => log('Stop', 'TimerPlayer', 'onStop', 'DEBUG'),
  onTaskPress = () => log('Task pressed', 'TimerPlayer', 'onTaskPress', 'DEBUG'),
  onStartNewTask = (taskName) => log(`Start new task: ${taskName}`, 'TimerPlayer', 'onStartNewTask', 'DEBUG'),
  onSelectExistingTask = (taskId) => log(`Selected existing task: ${taskId}`, 'TimerPlayer', 'onSelectExistingTask', 'DEBUG')
}) => {
  const {
    searchText,
    searchResults,
    isSearching,
    showResults,
    handleSearchTextChange,
    closeSearch,
    setShowResults
  } = useTaskSearch();
  
  // Get UI context to check if GlobalCreateButton is open
  const { isGlobalCreateMenuOpen } = useUI();
  
  const [playerEnabled, setPlayerEnabled] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Get screen dimensions for the backdrop
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // When GlobalCreateButton opens, close search results
  useEffect(() => {
    if (isGlobalCreateMenuOpen && showResults) {
      closeSearch();
      Keyboard.dismiss();
    }
  }, [isGlobalCreateMenuOpen, showResults, closeSearch]);

  // Handle starting a new task
  const handleStartNewTask = () => {
    if (searchText.trim()) {
      log(`Start new task button pressed: ${searchText.trim()}`, 'TimerPlayer', 'handleStartNewTask', 'INFO');
      onStartNewTask(searchText.trim());
      handleSearchTextChange('');
      Keyboard.dismiss();
    }
  };
  
  // Handle selecting an existing task from search results
  const handleTaskSelect = (taskId: string) => {
    log(`Task selected from search: ${taskId}`, 'TimerPlayer', 'handleTaskSelect', 'INFO');
    onSelectExistingTask(taskId);
    closeSearch();
    Keyboard.dismiss();
  };

  useEffect(() => {
    if (searchText.trim()) {
      setPlayerEnabled(true);
    } else {
      setPlayerEnabled(false);
    }
  }, [searchText]);
  
  // Don't render if timer is not visible
  if (!isVisible) return null;

  // Calculate z-index based on GlobalCreateButton state
  // Use lower z-index when GlobalCreateButton is open
  const wrapperZIndex = isGlobalCreateMenuOpen ? 20 : 99;
  const playerZIndex = isGlobalCreateMenuOpen ? 21 : 100;

  return (
    // Wrapper View with dynamic z-index based on GlobalCreateButton state
    <View style={{ zIndex: wrapperZIndex, elevation: isGlobalCreateMenuOpen ? 2 : 9 }}>
      {/* Backdrop to capture touches when search is active */}
      {showResults && !isGlobalCreateMenuOpen && (
        <Pressable
          style={{
            position: 'absolute',
            top: -screenHeight, // Position off-screen above
            left: 0,
            width: screenWidth,
            height: screenHeight,
            backgroundColor: 'transparent',
            zIndex: wrapperZIndex - 1,
            elevation: isGlobalCreateMenuOpen ? 1 : 8
          }}
          onPress={() => {
            closeSearch();
            Keyboard.dismiss();
          }}
        />
      )}
    
      {/* Task search results component */}
      <TaskSearchResults
        searchText={searchText}
        results={searchResults}
        isLoading={isSearching}
        onTaskSelect={handleTaskSelect}
        onClose={closeSearch}
      />
      
      {/* Timer player */}
      <View className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t shadow-lg`}
        style={{ zIndex: playerZIndex, elevation: isGlobalCreateMenuOpen ? 3 : 10 }}
      >
        <View className="flex-row items-center p-3 justify-between">
          {activeTimer ? (
            // Active timer display
            <>
              <View className="flex-row items-center justify-between flex-1 px-4">
                <Pressable 
                  className="flex-1" 
                  onPress={() => {
                    log(`Task name pressed: ${taskName}`, 'TimerPlayer', 'onTaskPress', 'INFO');
                    onTaskPress();
                  }}
                  accessibilityLabel="View task details"
                  accessibilityHint="Navigates to the task details page"
                >
                  <Text className={`text-base font-medium ${isDark ? 'text-white' : 'text-gray-800'} truncate`} numberOfLines={1}>
                    {taskName}
                  </Text>
                </Pressable>

                <View className="flex-grow" />

                <Text className="text-xl font-bold text-blue-600">
                  {formatElapsedTime(elapsedTime)}
                </Text>
              </View>
              
              <TimerControls 
                isRunning={isRunning}
                onPause={() => {
                  log(`Pause timer pressed for task: ${taskName}`, 'TimerPlayer', 'onPause', 'INFO');
                  onPause();
                }}
                onResume={() => {
                  log(`Resume timer pressed for task: ${taskName}`, 'TimerPlayer', 'onResume', 'INFO');
                  onResume();
                }}
                onStop={() => {
                  log(`Stop timer pressed for task: ${taskName}`, 'TimerPlayer', 'onStop', 'INFO');
                  onStop();
                }}
              />
            </>
          ) : (
            // New task input / search
            <>
              <View className="flex-1 px-4">
                <TextInput
                  className={`text-base border-b ${isDark ? 'border-gray-600 text-white' : 'border-gray-300 text-gray-800'} py-1`}
                  placeholder="What are you working on?"
                  placeholderTextColor={isDark ? '#9CA3AF' : '#9CA3AF'}
                  value={searchText}
                  onChangeText={handleSearchTextChange}
                  onFocus={() => {
                    // Show search results when input gets focus
                    if (searchText.trim()) {
                      setShowResults(true);
                    }
                  }}
                  onSubmitEditing={() => {
                    if (searchResults.length > 0) {
                      // If there are search results, select the first one
                      handleTaskSelect(searchResults[0].id);
                    } else {
                      // Otherwise create a new task
                      handleStartNewTask();
                    }
                  }}
                  returnKeyType="go"
                  accessibilityLabel="Task name input or search"
                  accessibilityHint="Enter a name for your new task or search for existing tasks"
                />
              </View>
              
              <Pressable 
                onPress={handleStartNewTask}
                className={`w-10 h-10 rounded-full bg-blue-500 items-center justify-center ml-2 ${!playerEnabled ? 'opacity-50' : ''}`}
                accessibilityLabel="Start new task"
                accessibilityRole="button"
                disabled={!playerEnabled}
              >
                <Ionicons name="play" size={18} color="#FFFFFF" />
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default TimerPlayer;