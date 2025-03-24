# Cash Clock - Development Tasks

## Current Tasks
- [x] Create StorageService for SQLite operations
- [x] Write tests for StorageService
- [x] Modularize UI components into feature-based folder structure
- [ ] Create TaskManagementService class for task-related operations
- [ ] Write tests for TaskManagementService
- [ ] Create custom hooks to bridge UI components with backend services
- [ ] Set up database initialization on app startup

## Storage Layer
- [x] Base StorageService with CRUD operations
- [ ] Database schema migration mechanism
- [ ] Data export/import functionality

## Business Logic Layer
- [ ] TaskService for task operations
- [ ] TimeEntryService for time tracking
- [ ] ProjectService for project grouping
- [ ] Analytics calculations and reporting

## UI Layer
- [x] Create basic calendar view with hourly timeline
- [x] Create persistent timer component
- [x] Implement task creation form with timer integration
- [x] Modularize components into feature-based organization:
  - [x] **Calendar Components**:
    - [x] DaySelector
    - [x] HourlyTimeline
    - [x] TimeEntryItem
    - [x] CurrentTimeIndicator
  - [x] **Task Components**:
    - [x] TaskForm
    - [x] TaskList
    - [x] TaskItem
  - [x] **Timer Components**:
    - [x] PersistentTimer
    - [x] TimerControls
  - [x] **Shared Components**:
    - [x] Button
    - [x] EmptyState
- [ ] Project management UI
- [ ] Analytics dashboard
- [ ] Settings screen

## iOS Integration
- [ ] Implement widget support
- [ ] Set up Dynamic Island integration
- [ ] Configure Live Activities

## Timer Architecture
- [ ] TimerService handles core timing logic and persistence
- [ ] TimerContext provides state and methods throughout the app
- [ ] useTimer() gives components a simple API: 
  - const { startTimer, stopTimer, pauseTimer, resumeTimer, currentTime, isRunning } = useTimer()