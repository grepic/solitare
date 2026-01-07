import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { StatusBar } from 'expo-status-bar';

import ENV from './src/config/env';
import { useAuthStore } from './src/store/auth.store';
import { useThemeStore } from './src/store/theme.store';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const { loadAuth, isLoading } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    loadAuth();
  }, []);

  if (isLoading) {
    return null; // Or a splash screen
  }

  return (
    <SafeAreaProvider>
      <StripeProvider publishableKey={ENV.STRIPE_PUBLISHABLE_KEY}>
        <NavigationContainer>
          <StatusBar style={theme.isDark ? 'light' : 'dark'} />
          <RootNavigator />
        </NavigationContainer>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
