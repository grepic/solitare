import React, { useEffect, useMemo, useState } from 'react';
import { Appearance, Platform, Pressable, ScrollView, Text, View } from 'react-native';

type WebCapturedError = {
  name?: string;
  message: string;
  stack?: string;
  source: 'error' | 'rejection';
  time: number;
};

let webReporterInstalled = false;
let lastWebCapturedError: WebCapturedError | null = null;
const webErrorSubscribers = new Set<(err: WebCapturedError | null) => void>();

function publishWebCapturedError(err: WebCapturedError) {
  lastWebCapturedError = err;
  for (const subscriber of webErrorSubscribers) subscriber(lastWebCapturedError);
}

function clearWebCapturedError() {
  lastWebCapturedError = null;
  for (const subscriber of webErrorSubscribers) subscriber(lastWebCapturedError);
}

function installWebErrorReporterOnce() {
  if (webReporterInstalled) return;
  if (Platform.OS !== 'web' || typeof window === 'undefined') return;
  webReporterInstalled = true;

  window.addEventListener('error', (event) => {
    const error = (event as ErrorEvent).error as unknown;
    if (error instanceof Error) {
      publishWebCapturedError({
        name: error.name,
        message: error.message,
        stack: error.stack,
        source: 'error',
        time: Date.now(),
      });
      return;
    }

    publishWebCapturedError({
      message: (event as ErrorEvent).message || 'Unknown error',
      stack: (event as ErrorEvent).filename
        ? `${(event as ErrorEvent).filename}:${(event as ErrorEvent).lineno}:${(event as ErrorEvent).colno}`
        : undefined,
      source: 'error',
      time: Date.now(),
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = (event as PromiseRejectionEvent).reason as unknown;
    if (reason instanceof Error) {
      publishWebCapturedError({
        name: reason.name,
        message: reason.message,
        stack: reason.stack,
        source: 'rejection',
        time: Date.now(),
      });
      return;
    }

    publishWebCapturedError({
      message: typeof reason === 'string' ? reason : 'Unhandled promise rejection',
      stack: typeof reason === 'object' ? JSON.stringify(reason) : undefined,
      source: 'rejection',
      time: Date.now(),
    });
  });
}

function WebErrorOverlay() {
  const [err, setErr] = useState<WebCapturedError | null>(lastWebCapturedError);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    installWebErrorReporterOnce();
    const subscriber = (next: WebCapturedError | null) => setErr(next);
    webErrorSubscribers.add(subscriber);
    return () => {
      webErrorSubscribers.delete(subscriber);
    };
  }, []);

  if (Platform.OS !== 'web' || !err) return null;

  const title = err.source === 'rejection' ? 'Unhandled rejection' : 'Unhandled error';
  const details = `${err.name ? `${err.name}: ` : ''}${err.message}`;
  const stack = err.stack ?? '';

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0,0,0,0.85)',
        padding: 16,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{title}</Text>
        <Pressable
          onPress={() => clearWebCapturedError()}
          style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111827', borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Close</Text>
        </Pressable>
      </View>

      <ScrollView style={{ marginTop: 12 }}>
        <Text style={{ color: '#fff', fontFamily: 'monospace', marginBottom: 10 }}>{details}</Text>
        {stack ? (
          <Text style={{ color: '#D1D5DB', fontFamily: 'monospace', fontSize: 12 }}>{stack}</Text>
        ) : null}
        <Text style={{ color: '#9CA3AF', fontFamily: 'monospace', fontSize: 12, marginTop: 12 }}>
          Tip: add `?debug=1` and try switching stages.
        </Text>
      </ScrollView>
    </View>
  );
}

function DebugBox({ label, value }: { label: string; value: unknown }) {
  const enabled =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === '1';

  if (!enabled) return null;

  return (
    <View style={{ backgroundColor: '#eee', padding: 8, margin: 8 }}>
      <Text style={{ fontFamily: 'monospace', fontWeight: '700' }}>{label}:</Text>
      <Text style={{ fontFamily: 'monospace' }}>{JSON.stringify(value, null, 2)}</Text>
    </View>
  );
}

type WebStage = 'full' | 'layout' | 'theme' | 'auth' | 'nav' | 'root';

const WEB_STAGES: WebStage[] = ['layout', 'theme', 'auth', 'nav', 'root', 'full'];

function getWebStage(): WebStage {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return 'full';
  const stage = new URLSearchParams(window.location.search).get('stage');
  if (stage === 'layout' || stage === 'theme' || stage === 'auth' || stage === 'nav' || stage === 'root' || stage === 'full') return stage;
  // On web default to the safest stage so we can debug progressively.
  return 'layout';
}

function StageSwitcher({ current }: { current: WebStage }) {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

  const switchStage = (stage: WebStage) => {
    const url = new URL(window.location.href);
    url.searchParams.set('stage', stage);
    url.searchParams.set('debug', '1');
    window.location.href = url.toString();
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {WEB_STAGES.map((stage) => (
        <Pressable
          key={stage}
          onPress={() => switchStage(stage)}
          style={({ pressed }) => ({
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: stage === current ? '#2563EB' : '#D1D5DB',
            backgroundColor: pressed ? '#E5E7EB' : '#FFFFFF',
          })}
        >
          <Text style={{ color: stage === current ? '#2563EB' : '#111827', fontWeight: '600' }}>
            {stage}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function LayoutStage({ stage }: { stage: WebStage }) {
  return (
    <View style={{ flex: 1, padding: 24 }}>
      <StageSwitcher current={stage} />
      <DebugBox label="App debug" value={{ stage }} />
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Test: layout</Text>
    </View>
  );
}

function ThemeStage({ stage }: { stage: WebStage }) {
  const { useThemeStore } = require('./src/store/theme.store') as typeof import('./src/store/theme.store');
  const { theme, initialize: initializeTheme, setSystemColorScheme } = useThemeStore();

  useEffect(() => {
    initializeTheme().catch((err) => {
      console.warn('Failed to initialize theme:', err);
    });

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, [initializeTheme, setSystemColorScheme]);

  return (
    <View style={{ flex: 1, padding: 24, backgroundColor: theme.colors.background }}>
      <StageSwitcher current={stage} />
      <DebugBox label="App debug" value={{ stage, isDark: theme.isDark }} />
      <Text style={{ fontSize: 22, fontWeight: '700', color: theme.colors.text }}>Test: theme</Text>
      <Text style={{ color: theme.colors.textSecondary }}>Pokud toto vidíš, theme funguje.</Text>
    </View>
  );
}

function AuthStage({ stage }: { stage: WebStage }) {
  const { useAuthStore } = require('./src/store/auth.store') as typeof import('./src/store/auth.store');
  const { loadAuth, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <StageSwitcher current={stage} />
      <DebugBox label="App debug" value={{ stage, isLoading, isAuthenticated }} />
      <Text style={{ fontSize: 22, fontWeight: '700' }}>Test: auth storage</Text>
      <Text style={{ marginTop: 8 }}>isLoading: {String(isLoading)}</Text>
      <Text>isAuthenticated: {String(isAuthenticated)}</Text>
      <Text style={{ marginTop: 12, opacity: 0.7 }}>
        Pokud tohle spadne na webu, je problém v auth store / secure storage.
      </Text>
    </View>
  );
}

function NavStage({ stage }: { stage: WebStage }) {
  const { NavigationContainer } = require('@react-navigation/native') as typeof import('@react-navigation/native');

  return (
    <NavigationContainer>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <StageSwitcher current={stage} />
        <DebugBox label="App debug" value={{ stage }} />
        <Text style={{ fontSize: 22, fontWeight: '700' }}>Test: navigation</Text>
        <Text>Pokud toto vidíš, NavigationContainer funguje.</Text>
      </ScrollView>
    </NavigationContainer>
  );
}

function RootStage({ stage }: { stage: WebStage }) {
  const { SafeAreaProvider } = require('react-native-safe-area-context') as typeof import('react-native-safe-area-context');
  const { NavigationContainer } = require('@react-navigation/native') as typeof import('@react-navigation/native');
  const { StatusBar } = require('expo-status-bar') as typeof import('expo-status-bar');

  const ENV = (require('./src/config/env') as typeof import('./src/config/env')).default;
  const StripeProvider =
    Platform.OS !== 'web'
      ? (require('@stripe/stripe-react-native') as typeof import('@stripe/stripe-react-native')).StripeProvider
      : undefined;

  const { useAuthStore } = require('./src/store/auth.store') as typeof import('./src/store/auth.store');
  const { useThemeStore } = require('./src/store/theme.store') as typeof import('./src/store/theme.store');
  const { GlobalErrorBoundary } = require('./src/components/GlobalErrorBoundary') as typeof import('./src/components/GlobalErrorBoundary');
  let RootNavigator: React.ComponentType | null = null;
  let rootError: Error | null = null;
  try {
    RootNavigator = (require('./src/navigation/RootNavigator') as typeof import('./src/navigation/RootNavigator')).default;
  } catch (error) {
    if (error instanceof Error) {
      rootError = error;
    }
  }

  const { loadAuth, isLoading, isAuthenticated } = useAuthStore();
  const { theme, initialize: initializeTheme, setSystemColorScheme } = useThemeStore();

  useEffect(() => {
    loadAuth();

    initializeTheme().catch((err) => {
      console.warn('Failed to initialize theme:', err);
    });

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, [initializeTheme, loadAuth, setSystemColorScheme]);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    (window as any).__solitaire_debug = { stage, isLoading, isAuthenticated };
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, padding: 24 }}>
        <DebugBox label="App debug" value={{ stage, isLoading }} />
        <Text style={{ fontSize: 18, fontFamily: 'monospace' }}>Načítání aplikace…</Text>
      </View>
    );
  }

  const content = rootError || !RootNavigator ? (
    <View style={{ flex: 1, padding: 24 }}>
      <StageSwitcher current={stage} />
      <Text style={{ fontWeight: '700', fontSize: 22 }}>Root stage failed to load</Text>
      <Text style={{ marginTop: 12 }}>{rootError?.message ?? 'RootNavigator is missing'}</Text>
      <Text style={{ marginTop: 8, color: '#6B7280' }}>{rootError?.stack?.split('\n').slice(0, 3).join('\n')}</Text>
    </View>
  ) : (
    <NavigationContainer>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <StageSwitcher current={stage} />
      <DebugBox label="App debug" value={{ stage, isLoading, isAuthenticated }} />
      <RootNavigator />
    </NavigationContainer>
  );

  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider>
        {StripeProvider ? (
          <StripeProvider publishableKey={ENV.STRIPE_PUBLISHABLE_KEY}>{content}</StripeProvider>
        ) : (
          content
        )}
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}

function FullStage() {
  const { SafeAreaProvider } = require('react-native-safe-area-context') as typeof import('react-native-safe-area-context');
  const { NavigationContainer } = require('@react-navigation/native') as typeof import('@react-navigation/native');
  const { StatusBar } = require('expo-status-bar') as typeof import('expo-status-bar');

  const ENV = (require('./src/config/env') as typeof import('./src/config/env')).default;
  const StripeProvider =
    Platform.OS !== 'web'
      ? (require('@stripe/stripe-react-native') as typeof import('@stripe/stripe-react-native')).StripeProvider
      : undefined;

  const AsyncStorage = (require('@react-native-async-storage/async-storage') as typeof import('@react-native-async-storage/async-storage')).default;
  const { useAuthStore } = require('./src/store/auth.store') as typeof import('./src/store/auth.store');
  const { useThemeStore } = require('./src/store/theme.store') as typeof import('./src/store/theme.store');
  const { Tutorial } = require('./src/components/Tutorial') as typeof import('./src/components/Tutorial');
  const { GlobalErrorBoundary } = require('./src/components/GlobalErrorBoundary') as typeof import('./src/components/GlobalErrorBoundary');

  let RootNavigator: React.ComponentType | null = null;
  let rootError: Error | null = null;
  try {
    RootNavigator = (require('./src/navigation/RootNavigator') as typeof import('./src/navigation/RootNavigator')).default;
  } catch (error) {
    if (error instanceof Error) {
      rootError = error;
    }
  }

  const { gameLoader } = require('./src/core/services/game-loader') as typeof import('./src/core/services/game-loader');
  const { solitaireConfig } = require('./src/games/solitaire') as typeof import('./src/games/solitaire');

  // On web, avoid loading native-only audio at startup.
  const soundService =
    Platform.OS !== 'web'
      ? (require('./src/services/sound.service') as typeof import('./src/services/sound.service')).soundService
      : null;

  const { loadAuth, isLoading, isAuthenticated } = useAuthStore();
  const { theme, initialize: initializeTheme, setSystemColorScheme } = useThemeStore();
  const [showTutorial, setShowTutorial] = useState(false);

  const checkFirstLaunch = useMemo(
    () =>
      async () => {
        try {
          const hasSeenTutorial = await AsyncStorage.getItem('hasSeenTutorial');
          if (!hasSeenTutorial) {
            setTimeout(() => {
              setShowTutorial(true);
            }, 1000);
          }
        } catch (error) {
          console.error('Failed to check tutorial status:', error);
        }
      },
    [AsyncStorage]
  );

  useEffect(() => {
    loadAuth();
    checkFirstLaunch();

    initializeTheme().catch((err) => {
      console.warn('Failed to initialize theme:', err);
    });

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    gameLoader.registerGame(solitaireConfig);
    gameLoader.markInitialized();

    if (soundService) {
      soundService.initialize().catch((err: unknown) => {
        console.warn('Failed to initialize sound service:', err);
      });
    }

    return () => {
      if (soundService) soundService.cleanup();
      subscription.remove();
    };
  }, [checkFirstLaunch, gameLoader, initializeTheme, loadAuth, setSystemColorScheme, soundService, solitaireConfig]);

  const handleTutorialComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenTutorial', 'true');
      setShowTutorial(false);
    } catch (error) {
      console.error('Failed to save tutorial status:', error);
    }
  };

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    (window as any).__solitaire_debug = { stage: 'full', isLoading, isAuthenticated };
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, padding: 24 }}>
        <DebugBox label="App debug" value={{ stage: 'full', isLoading }} />
        <Text style={{ fontSize: 18, fontFamily: 'monospace' }}>Načítání aplikace…</Text>
      </View>
    );
  }

  if (rootError || !RootNavigator) {
    return (
      <View style={{ flex: 1, padding: 24 }}>
        <Text style={{ fontWeight: '700', fontSize: 22 }}>Full stage failed to load</Text>
        <Text style={{ marginTop: 12 }}>{rootError?.message ?? 'RootNavigator is missing'}</Text>
        <Text style={{ marginTop: 8, color: '#6B7280' }}>
          {rootError?.stack?.split('\n').slice(0, 4).join('\n')}
        </Text>
      </View>
    );
  }

  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider>
        {StripeProvider ? (
          <StripeProvider publishableKey={ENV.STRIPE_PUBLISHABLE_KEY}>
          <NavigationContainer>
            <StatusBar style={theme.isDark ? 'light' : 'dark'} />
            <DebugBox label="App debug" value={{ stage: 'full', isLoading, isAuthenticated }} />
            <RootNavigator />
            {isAuthenticated && (
              <Tutorial visible={showTutorial} onComplete={handleTutorialComplete} theme={theme} />
            )}
          </NavigationContainer>
          </StripeProvider>
        ) : (
          <NavigationContainer>
            <StatusBar style={theme.isDark ? 'light' : 'dark'} />
            <DebugBox label="App debug" value={{ stage: 'full', isLoading, isAuthenticated }} />
            <RootNavigator />
            {isAuthenticated && (
              <Tutorial visible={showTutorial} onComplete={handleTutorialComplete} theme={theme} />
            )}
          </NavigationContainer>
        )}
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}

export default function App() {
  const stage = getWebStage();

  const content =
    stage === 'layout' ? (
      <LayoutStage stage={stage} />
    ) : stage === 'theme' ? (
      <ThemeStage stage={stage} />
    ) : stage === 'auth' ? (
      <AuthStage stage={stage} />
    ) : stage === 'nav' ? (
      <NavStage stage={stage} />
    ) : stage === 'root' ? (
      <RootStage stage={stage} />
    ) : (
      <FullStage />
    );

  return (
    <View style={{ flex: 1 }}>
      <WebErrorOverlay />
      {content}
    </View>
  );
}
