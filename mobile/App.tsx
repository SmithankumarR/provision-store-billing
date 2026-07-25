import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';

import { lightTheme, darkTheme } from './src/theme';
import { useSettingsStore } from './src/store/useSettingsStore';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  const { darkMode } = useSettingsStore();

  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar style={darkMode ? 'light' : 'dark'} />
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
