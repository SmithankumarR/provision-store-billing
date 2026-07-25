import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1b4332',
    onPrimary: '#ffffff',
    primaryContainer: '#d8f3dc',
    onPrimaryContainer: '#081c15',
    secondary: '#2d6a4f',
    onSecondary: '#ffffff',
    secondaryContainer: '#b7e4c7',
    onSecondaryContainer: '#1b4332',
    accent: '#f59e0b',
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceVariant: '#e2e8f0',
    onSurface: '#0f172a',
    error: '#ef4444',
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: '#ffffff',
      level2: '#f1f5f9',
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#52b788',
    onPrimary: '#081c15',
    primaryContainer: '#1b4332',
    onPrimaryContainer: '#d8f3dc',
    secondary: '#74c69d',
    onSecondary: '#081c15',
    secondaryContainer: '#2d6a4f',
    onSecondaryContainer: '#b7e4c7',
    accent: '#fbbf24',
    background: '#0f172a',
    surface: '#1e293b',
    surfaceVariant: '#334155',
    onSurface: '#f8fafc',
    error: '#f87171',
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: '#1e293b',
      level2: '#334155',
    },
  },
};
