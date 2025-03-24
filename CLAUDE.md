# Cash Clock - Development Guide

## Build/Run Commands
- `npm start` - Start Expo development server
- `npm run ios` - Start iOS simulator
- `npm run android` - Start Android emulator
- `npm run web` - Start web development server
- `npm test` - Run Jest tests with watch mode
- `npm test -- -t "test name"` - Run specific test
- `npm run lint` - Run ESLint checks
- `npx tsc --noEmit` - Check TypeScript errors

## Project Overview
- Time tracking app with smart grouping features
- Focus on iOS widgets, Dynamic Island, and Live Activities
- SQLite for local data storage
- No sign-up required for users

## Architecture
- **Three-Layer Architecture**:
  - Frontend Components (UI/UX)
  - Custom Hooks (Bridge/Logic)
  - Backend Classes (Data/Services)
- **Testing**: Jest tests required for all non-UI code

## Code Style & Conventions
- **Types**: Use strict TypeScript with interfaces in definitions.ts
- **Components**: Functional components with hooks
- **State**: React Context API for app-wide state management
- **Storage**: SQLite via react-native-sqlite-storage
- **Styling**: NativeWind/TailwindCSS (className="...")
- **Naming**: 
  - Components: PascalCase
  - Hooks: useFeature
  - Classes: FeatureService
  - Tests: *.test.ts(x)
- **Imports**: Group by external/internal, alphabetical order
- **Documentation**: JSDoc comments for interfaces, hooks, and classes
- **Path Alias**: Use @/* for imports from project root

## Development Guidelines
- Explain planned changes before implementation
- Review codebase after major changes
- Create test files for hooks and service classes
- Maintain separation of concerns between layers
- Focus on simple, transparent UI/UX
- Prioritize core functionality: time tracking, task management
- Use try/catch for error handling with meaningful messages
