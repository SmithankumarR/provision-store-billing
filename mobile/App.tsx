import React from 'react';
import { View, StyleSheet } from 'react-native';
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
    <SafeAreaProvider style={styles.container}>
      <PaperProvider theme={theme}>
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <StatusBar style={darkMode ? 'light' : 'dark'} />
          <AppNavigator />
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
