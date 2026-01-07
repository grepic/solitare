import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Input } from '@solitaire/ui-kit';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';
import api from '../../services/api';

export default function LoginScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const { setAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

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
  });
