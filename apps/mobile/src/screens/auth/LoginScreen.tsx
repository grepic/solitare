import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Button, Input } from '@solitaire/ui-kit';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';
import api from '../../services/api';
import ENV from '../../config/env';
import * as Google from 'expo-auth-session/providers/google';

function maybeCompleteAuthSessionSafe() {
  if (Platform.OS !== 'web') return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const WebBrowser = require('expo-web-browser') as typeof import('expo-web-browser');
    WebBrowser.maybeCompleteAuthSession?.();
  } catch {
    // ignore
  }
}

export default function LoginScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const [appleAuthModule, setAppleAuthModule] = useState<any>(null);

  // Google OAuth configuration
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID', // Replace with actual Expo client ID
    iosClientId: 'YOUR_IOS_CLIENT_ID', // Replace with actual iOS client ID
    androidClientId: 'YOUR_ANDROID_CLIENT_ID', // Replace with actual Android client ID
    webClientId: 'YOUR_WEB_CLIENT_ID', // Replace with actual Web client ID
  });

  useEffect(() => {
    maybeCompleteAuthSessionSafe();

    if (Platform.OS !== 'ios') {
      setAppleAuthAvailable(false);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const AppleAuthentication = require('expo-apple-authentication');
      setAppleAuthModule(AppleAuthentication);
      AppleAuthentication.isAvailableAsync()
        .then(setAppleAuthAvailable)
        .catch(() => setAppleAuthAvailable(false));
    } catch {
      setAppleAuthAvailable(false);
    }
  }, []);

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleAuth(googleResponse.authentication?.idToken);
    }
  }, [googleResponse]);

  const showDemoLogin =
    __DEV__ ||
    (Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('debug') === '1');

  const DEMO_EMAIL = 'player1@test.com';
  const DEMO_PASSWORD = 'test123';

  const handleLogin = async () => {
    setLoading(true);
    setErrors({});
    setInlineError(null);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      await setAuth(data);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        (error?.message ? `Login failed: ${error.message}` : 'Login failed');
      console.error('Login failed', {
        apiUrl: ENV.API_URL,
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      setInlineError(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setErrors({});
    setInlineError(null);
    setInlineError('Attempting demo login…');

    try {
      const { data } = await api.post('/auth/login', { email: DEMO_EMAIL, password: DEMO_PASSWORD });
      await setAuth(data);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        (error?.message
          ? `Demo login failed: ${error.message}`
          : 'Demo login failed (is the API running and seeded?)');
      console.error('Demo login failed', {
        apiUrl: ENV.API_URL,
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      setInlineError(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    try {
      if (!appleAuthModule) {
        Alert.alert('Error', 'Apple Sign In is not available');
        return;
      }

      const credential = await appleAuthModule.signInAsync({
        requestedScopes: [
          appleAuthModule.AppleAuthenticationScope.FULL_NAME,
          appleAuthModule.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { data } = await api.post('/auth/oauth/apple', {
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode,
        user: credential.fullName
          ? {
              email: credential.email,
              name: {
                firstName: credential.fullName.givenName,
                lastName: credential.fullName.familyName,
              },
            }
          : undefined,
      });

      await setAuth(data);
    } catch (error: any) {
      if (error.code !== 'ERR_CANCELED') {
        Alert.alert('Error', 'Apple Sign In failed');
      }
    }
  };

  const handleGoogleAuth = async (idToken?: string) => {
    if (!idToken) {
      Alert.alert('Error', 'Google authentication failed');
      return;
    }

    try {
      const { data } = await api.post('/auth/oauth/google', { idToken });
      await setAuth(data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Google Sign In failed');
    }
  };

  const AppleButton = appleAuthModule?.AppleAuthenticationButton;

  return (
    <ScrollView
      style={[styles(theme).container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles(theme).content}
    >
      <Text style={[styles(theme).title, { color: theme.colors.text }]}>Welcome Back</Text>
      <Text style={[styles(theme).subtitle, { color: theme.colors.textSecondary }]}>
        Sign in to continue playing
      </Text>

      <View style={styles(theme).form}>
        {showDemoLogin ? (
          <Text style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
            API: {ENV.API_URL}
          </Text>
        ) : null}

        {inlineError ? (
          <Text style={{ color: '#DC2626', marginBottom: theme.spacing.sm }}>{inlineError}</Text>
        ) : null}

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          theme={theme}
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          error={errors.password}
          theme={theme}
        />

        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
          theme={theme}
          style={{ marginTop: theme.spacing.lg }}
        />

        {showDemoLogin ? (
          <Button
            title={`Demo login (${DEMO_EMAIL})`}
            onPress={handleDemoLogin}
            variant="secondary"
            theme={theme}
            disabled={loading}
            loading={loading}
          />
        ) : null}

        <View style={styles(theme).divider}>
          <View style={styles(theme).dividerLine} />
          <Text style={[styles(theme).dividerText, { color: theme.colors.textSecondary }]}>OR</Text>
          <View style={styles(theme).dividerLine} />
        </View>

        {/* Apple Sign In - iOS only */}
        {appleAuthAvailable && Platform.OS === 'ios' && AppleButton ? (
          <AppleButton
            buttonType={appleAuthModule.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={appleAuthModule.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={8}
            style={styles(theme).appleButton}
            onPress={handleAppleAuth}
          />
        ) : null}

        {/* Google Sign In */}
        <Button
          title="Continue with Google"
          onPress={() => googlePromptAsync()}
          variant="secondary"
          theme={theme}
          disabled={!googleRequest}
        />

        <Button
          title="Don't have an account? Sign Up"
          onPress={() => navigation.navigate('Register')}
          variant="ghost"
          theme={theme}
        />
      </View>
    </ScrollView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: theme.spacing.xl,
      paddingTop: theme.spacing.xxxl * 2,
    },
    title: {
      ...theme.typography.h1,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      ...theme.typography.body,
      marginBottom: theme.spacing.xxxl,
    },
    form: {
      gap: theme.spacing.md,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      ...theme.typography.caption,
      marginHorizontal: theme.spacing.md,
    },
    appleButton: {
      width: '100%',
      height: 44,
    },
  });
