import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Input } from '@solitaire/ui-kit';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';
import api from '../../services/api';

export default function RegisterScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const { setAuth } = useAuthStore();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: '',
    country: 'US',
    dateOfBirth: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', formData);
      await setAuth(data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles(theme).container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles(theme).content}
    >
      <Text style={[styles(theme).title, { color: theme.colors.text }]}>Create Account</Text>
      <Text style={[styles(theme).subtitle, { color: theme.colors.textSecondary }]}>
        Join thousands of players
      </Text>

      <View style={styles(theme).form}>
        <Input
          label="Email"
          value={formData.email}
          onChangeText={(email) => setFormData({ ...formData, email })}
          placeholder="your@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          theme={theme}
        />

        <Input
          label="Nickname"
          value={formData.nickname}
          onChangeText={(nickname) => setFormData({ ...formData, nickname })}
          placeholder="PlayerName"
          theme={theme}
        />

        <Input
          label="Password"
          value={formData.password}
          onChangeText={(password) => setFormData({ ...formData, password })}
          placeholder="••••••••"
          secureTextEntry
          theme={theme}
        />

        <Input
          label="Date of Birth (YYYY-MM-DD)"
          value={formData.dateOfBirth}
          onChangeText={(dateOfBirth) => setFormData({ ...formData, dateOfBirth })}
          placeholder="1990-01-01"
          theme={theme}
        />

        <Text style={[styles(theme).disclaimer, { color: theme.colors.textSecondary }]}>
          By signing up, you confirm you are 18+ and agree to our Terms of Service. This is a
          skill-based competition, not gambling.
        </Text>

        <Button
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
          theme={theme}
        />

        <Button
          title="Already have an account? Sign In"
          onPress={() => navigation.navigate('Login')}
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
      paddingTop: theme.spacing.xxxl,
    },
    title: {
      ...theme.typography.h1,
      marginBottom: theme.spacing.xs,
    },
    subtitle: {
      ...theme.typography.body,
      marginBottom: theme.spacing.xl,
    },
    form: {
      gap: theme.spacing.md,
    },
    disclaimer: {
      ...theme.typography.small,
      textAlign: 'center',
      marginTop: theme.spacing.md,
    },
  });
