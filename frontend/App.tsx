import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/i18n';
import { ThemeProvider } from './src/context/ThemeContext';
import { SyncProvider } from './src/context/SyncContext';
import AppNavigator from './src/navigation/AppNavigator';
import { theme } from './src/theme';
import { LogBox, View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { decode, encode } from 'base-64';

if (!global.btoa) {
  global.btoa = encode;
}

if (!global.atob) {
  global.atob = decode;
}

// Completely suppress all console warnings in development
if (__DEV__) {
  const originalWarn = console.warn;
  const originalError = console.error;

  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    // Suppress all React Native Web deprecation warnings
    if (
      message.includes('shadow') ||
      message.includes('textShadow') ||
      message.includes('pointerEvents') ||
      message.includes('expo-av') ||
      message.includes('useNativeDriver') ||
      message.includes('React DevTools') ||
      message.includes('aria-hidden') ||
      message.includes('deprecated')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    // Only suppress specific non-critical errors
    if (
      message.includes('Download the React DevTools') ||
      message.includes('deprecated')
    ) {
      return;
    }
    originalError.apply(console, args);
  };
}

// Suppress LogBox warnings
LogBox.ignoreAllLogs(true);

export default function App() {
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
    ...Ionicons.font,
    ...MaterialIcons.font,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <SyncProvider>
              <StatusBar style="auto" />
              <AppNavigator />
            </SyncProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
