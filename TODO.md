# Cash Clock - Development Tasks

## Current Tasks
- [x] Create StorageService for SQLite operations
- [x] Write tests for StorageService
- [x] Modularize UI components into feature-based folder structure
- [x] Create TaskManagementService class for task-related operations
- [ ] Write tests for TaskManagementService
- [x] Create custom hooks to bridge UI components with backend services
- [ ] Set up database initialization on app startup
- [ ] Implement task details screen

## Storage Layer
- [x] Base StorageService with CRUD operations
- [ ] Database schema migration mechanism
- [ ] Data export/import functionality

## Business Logic Layer
- [x] TaskService for task operations
- [x] TimeEntryService for time tracking
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
  - [x] Basic project list/item components
  - [ ] Project creation/editing interface
  - [ ] Task association with projects
- [ ] Analytics dashboard
- [ ] Settings screen

## Context Architecture
- [x] Refactor contexts to avoid redundant wrapping (moved all providers to AppContext)
- [x] TimerContext provides state and methods throughout the app
- [x] useTimer() hook API implementation

## iOS Integration
- [ ] Implement widget support
- [ ] Set up Dynamic Island integration
- [ ] Configure Live Activities