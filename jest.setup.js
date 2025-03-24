// Mock React Native modules that are not available in the test environment
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios),
    },
    NativeModules: {
      ...RN.NativeModules,
      SettingsManager: {
        settings: {
          AppleLocale: 'en_US',
          AppleLanguages: ['en'],
        },
      },
    },
    I18nManager: {
      isRTL: false,
      allowRTL: jest.fn(),
      forceRTL: jest.fn(),
      swapLeftAndRightInRTL: jest.fn(),
    },
    Appearance: {
      getColorScheme: () => 'light',
      addChangeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  };
});

// Mock react-native-css-interop
jest.mock('react-native-css-interop', () => {
  const mockModule = {
    cssInterop: jest.fn(),
    useColorScheme: jest.fn(() => 'light'),
    resetAppearanceListeners: jest.fn(),
    default: {
      cssInterop: jest.fn(),
      useColorScheme: jest.fn(() => 'light'),
      resetAppearanceListeners: jest.fn(),
    },
    __esModule: true,
  };
  return mockModule;
});

// Mock react-native-css-interop/src/runtime/native/appearance-observables
jest.mock('react-native-css-interop/src/runtime/native/appearance-observables', () => {
  const mockModule = {
    getColorScheme: () => 'light',
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    resetAppearanceListeners: jest.fn(),
    __esModule: true,
  };
  return mockModule;
});

// Mock react-native-css-interop/src/runtime/native/api
jest.mock('react-native-css-interop/src/runtime/native/api', () => {
  const mockModule = {
    cssInterop: jest.fn(),
    useColorScheme: jest.fn(() => 'light'),
    resetAppearanceListeners: jest.fn(),
    __esModule: true,
  };
  return mockModule;
});

// Mock react-native-css-interop/src/runtime/api.native
jest.mock('react-native-css-interop/src/runtime/api.native', () => {
  const mockModule = {
    cssInterop: jest.fn(),
    useColorScheme: jest.fn(() => 'light'),
    resetAppearanceListeners: jest.fn(),
    __esModule: true,
  };
  return mockModule;
});

// Mock react-native-css-interop/src/runtime/wrap-jsx
jest.mock('react-native-css-interop/src/runtime/wrap-jsx', () => {
  const mockModule = {
    cssInterop: jest.fn(),
    useColorScheme: jest.fn(() => 'light'),
    resetAppearanceListeners: jest.fn(),
    __esModule: true,
  };
  return mockModule;
});

// Mock react-native-css-interop/src/runtime/jsx-runtime
jest.mock('react-native-css-interop/src/runtime/jsx-runtime', () => {
  const mockModule = {
    cssInterop: jest.fn(),
    useColorScheme: jest.fn(() => 'light'),
    resetAppearanceListeners: jest.fn(),
    __esModule: true,
  };
  return mockModule;
});

// Mock SQLite
jest.mock('react-native-sqlite-storage', () => ({
  openDatabase: jest.fn(),
}));

// Suppress console.error and console.warn in tests
console.error = jest.fn();
console.warn = jest.fn(); 