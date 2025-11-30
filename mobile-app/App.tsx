import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/contexts/AuthContext';
import { WeddingProvider } from './src/contexts/WeddingContext';
import AppNavigator from './src/navigation/AppNavigator';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <WeddingProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </WeddingProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
