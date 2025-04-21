import React from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator,
  ScrollView,
  useColorScheme
} from 'react-native';
import BottomSheet from '../../shared/BottomSheet';
import { TaskManagerRef } from './components/TaskManager';

// Import modularized components
import ViewMode from './tabs/ViewMode';
import EditMode from './tabs/EditMode';
import SheetHeader from './components/SheetHeader';

// Import utilities and hook functions
import { Milestone, getProjectIconValue } from '@lib/util/project/projectDetailsHelpers';
import { useProjectDetailsState } from '@hooks/useProjectDetailsState';
import { createProjectActionHandlers } from '@lib/util/handlers/projectActionHandlers';

// Define task interface to remain here since it's only used in this component
export interface ProjectTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface ProjectDetailsSheetProps {
  isVisible: boolean;
  onClose: () => void;
  projectId: string | null;
  onProjectDeleted?: () => void;
}

/**
 * Bottom sheet for viewing and editing project details
 */
const ProjectDetailsSheet: React.FC<ProjectDetailsSheetProps> = ({
  isVisible,
  onClose,
  projectId,
  onProjectDeleted
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // Use our custom hook to manage state
  const state = useProjectDetailsState(projectId, isVisible, onClose, onProjectDeleted);
  
  // Create action handlers based on state
  // Include required properties from props to satisfy the type
  const handlers = createProjectActionHandlers({
    ...state,
    projectId, // Ensure projectId is passed
    onClose,   // Ensure onClose is passed
    onProjectDeleted
  });
  
  // Destructure values from state
  const {
    projectName,
    projectDescription,
    projectColor,
    projectIcon,
    projectGoals,
    milestones,
    newMilestone,
    projectTasks,
    isLoadingTasks,
    taskCount,
    completedTaskCount,
    completionPercentage,
    totalTime,
    isEditing,
    isSaving,
    localError,
    taskManagerRef,
    isLoading
  } = state;
  
  // Return the component with appropriate rendering based on state
  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={handlers.handleClose}
      height={600}
    >
      <View className="flex-1">
        <SheetHeader 
          isEditing={isEditing}
          onDeletePress={handlers.handleDeletePress}
          isDark={isDark}
        />
        
        {isLoading ? (
          <View className="p-8 items-center justify-center">
            <ActivityIndicator size="large" color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text className={`mt-2 text-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Loading project...
            </Text>
          </View>
        ) : localError ? (
          <View className="p-8">
            <View className="bg-red-100 dark:bg-red-900 p-3 rounded-lg">
              <Text className="text-red-800 dark:text-red-200 text-center mb-1 font-bold">
                Error
              </Text>
              <Text className="text-red-800 dark:text-red-200 text-center">
                {localError}
              </Text>
            </View>
            
            <Text
              onPress={() => {
                state.setLocalError(null);
                state.refreshData();
              }}
              className="mt-4 p-2 bg-indigo-500 rounded-lg text-white text-center"
            >
              Try Again
            </Text>
          </View>
        ) : isEditing ? (
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <EditMode
              projectId={projectId || ''}
              projectName={projectName}
              projectDescription={projectDescription}
              projectGoals={projectGoals}
              projectColor={projectColor}
              projectIcon={projectIcon}
              projectTasks={projectTasks}
              milestones={milestones}
              newMilestone={newMilestone}
              isSaving={isSaving}
              onNameChange={handlers.handleNameChange}
              onDescriptionChange={handlers.handleDescriptionChange}
              onGoalsChange={handlers.handleGoalsChange}
              onColorSelect={handlers.handleColorSelect}
              onIconSelect={handlers.handleIconSelect}
              onSetNewMilestone={state.setNewMilestone}
              onAddMilestone={handlers.handleAddMilestone}
              onRemoveMilestone={handlers.handleRemoveMilestone}
              onSave={handlers.handleSave}
              onCancel={handlers.handleCancelEdit}
              onTasksUpdated={handlers.handleTasksUpdated}
              onPendingTaskChanges={state.handlePendingTaskChanges}
              taskManagerRef={taskManagerRef}
              isDark={isDark}
            />
          </ScrollView>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <ViewMode
              projectName={projectName}
              projectDescription={projectDescription}
              projectGoals={projectGoals}
              projectColor={projectColor}
              projectIcon={projectIcon}
              projectTasks={projectTasks}
              isLoadingTasks={isLoadingTasks}
              milestones={milestones}
              taskCount={taskCount}
              completedTaskCount={completedTaskCount}
              completionPercentage={completionPercentage}
              totalTime={totalTime}
              getProjectIconValue={() => getProjectIconValue(projectIcon, projectName)}
              onEditPress={handlers.handleEditPress}
              isDark={isDark}
            />
          </ScrollView>
        )}
      </View>
    </BottomSheet>
  );
};

export default ProjectDetailsSheet; 