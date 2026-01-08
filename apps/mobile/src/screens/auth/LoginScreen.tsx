import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Button, Input } from '@solitaire/ui-kit';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';
import api from '../../services/api';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);

  // Google OAuth configuration
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID', // Replace with actual Expo client ID
    iosClientId: 'YOUR_IOS_CLIENT_ID', // Replace with actual iOS client ID
    androidClientId: 'YOUR_ANDROID_CLIENT_ID', // Replace with actual Android client ID
    webClientId: 'YOUR_WEB_CLIENT_ID', // Replace with actual Web client ID
  });

  useEffect(() => {
    // Check if Apple Authentication is available
    AppleAuthentication.isAvailableAsync().then(setAppleAuthAvailable);
  }, []);

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleAuth(googleResponse.authentication?.idToken);
    }
  }, [googleResponse]);

  const handleLogin = async () => {
    setLoading(true);
    setErrors({});

    try {
      const { data } = await api.post('/auth/login', { email, password });
      await setAuth(data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
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

        <View style={styles(theme).divider}>
          <View style={styles(theme).dividerLine} />
          <Text style={[styles(theme).dividerText, { color: theme.colors.textSecondary }]}>OR</Text>
          <View style={styles(theme).dividerLine} />
        </View>

        {/* Apple Sign In - iOS only */}
        {appleAuthAvailable && Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={8}
            style={styles(theme).appleButton}
            onPress={handleAppleAuth}
          />
        )}

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
