import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { StatusBar } from 'expo-status-bar';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ENV from './src/config/env';
import { useAuthStore } from './src/store/auth.store';
import { useThemeStore } from './src/store/theme.store';
import RootNavigator from './src/navigation/RootNavigator';
import { Tutorial } from './src/components/Tutorial';
import { GlobalErrorBoundary } from './src/components/GlobalErrorBoundary';
import { soundService } from './src/services/sound.service';
import { gameLoader } from './src/core/services/game-loader';
import { solitaireConfig } from './src/games/solitaire';

export default function App() {
  const { loadAuth, isLoading, isAuthenticated } = useAuthStore();
  const { theme, initialize: initializeTheme, setSystemColorScheme } = useThemeStore();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    loadAuth();
    checkFirstLaunch();

    // Initialize theme
    initializeTheme().catch((err) => {
      console.warn('Failed to initialize theme:', err);
    });

    // Listen for system appearance changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    // Register games
    gameLoader.registerGame(solitaireConfig);
    gameLoader.markInitialized();

    // Initialize sound service
    soundService.initialize().catch((err) => {
      console.warn('Failed to initialize sound service:', err);
    });

    return () => {
      soundService.cleanup();
      subscription.remove();
    };
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasSeenTutorial = await AsyncStorage.getItem('hasSeenTutorial');
      if (!hasSeenTutorial) {
        // Wait a bit for auth to load before showing tutorial
        setTimeout(() => {
          setShowTutorial(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to check tutorial status:', error);
    }
  };

  const handleTutorialComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenTutorial', 'true');
      setShowTutorial(false);
    } catch (error) {
      console.error('Failed to save tutorial status:', error);
    }
  };

  if (isLoading) {
    return null; // Or a splash screen
  }

  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider>
        <StripeProvider publishableKey={ENV.STRIPE_PUBLISHABLE_KEY}>
          <NavigationContainer>
            <StatusBar style={theme.isDark ? 'light' : 'dark'} />
            <RootNavigator />
            {isAuthenticated && (
              <Tutorial visible={showTutorial} onComplete={handleTutorialComplete} theme={theme} />
            )}
          </NavigationContainer>
        </StripeProvider>
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}
