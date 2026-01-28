import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { Button } from '@solitaire/ui-kit';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';
import api from '../../services/api';
import ENV from '../../config/env';

export default function OnboardingScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const { setAuth } = useAuthStore();
  const [currentPage, setCurrentPage] = useState(0);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const showDemoLogin =
    __DEV__ ||
    (Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('debug') === '1');

  const DEMO_EMAIL = 'player1@test.com';
  const DEMO_PASSWORD = 'test123';

  const pages = [
    {
      title: 'Skill-Based Solitaire',
      description: 'Compete head-to-head in fair, skill-based matches. Same deck, same rules.',
    },
    {
      title: 'Win Real Money',
      description: 'Play for cash prizes. Fast, secure, and transparent payouts.',
    },
    {
      title: 'Fair Play Guaranteed',
      description: 'Age 18+. Legal skill-based competition. Not gambling.',
    },
  ];

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    setDemoError(null);
    setDemoError('Attempting demo login…');
    try {
      const { data } = await api.post('/auth/login', {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });
      await setAuth(data);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        (error?.message
          ? `Demo login failed: ${error.message}`
          : 'Demo login failed (is the API running and seeded?)');
      console.error('Demo login failed (onboarding)', {
        apiUrl: ENV.API_URL,
        status: error?.response?.status,
        data: error?.response?.data,
        message: error?.message,
      });
      setDemoError(message);
      Alert.alert('Error', message);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles(theme).content}>
        <View style={styles(theme).pageContainer}>
          <Text style={[styles(theme).title, { color: theme.colors.text }]}>
            {pages[currentPage].title}
          </Text>
          <Text style={[styles(theme).description, { color: theme.colors.textSecondary }]}>
            {pages[currentPage].description}
          </Text>
        </View>

        <View style={styles(theme).dots}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles(theme).dot,
                {
                  backgroundColor:
                    index === currentPage ? theme.colors.primary : theme.colors.border,
                },
              ]}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles(theme).footer}>
        <Button
          title={currentPage === pages.length - 1 ? 'Get Started' : 'Next'}
          onPress={handleNext}
          theme={theme}
        />
        <Button
          title="Skip"
          onPress={() => navigation.navigate('Login')}
          variant="ghost"
          theme={theme}
        />

        {showDemoLogin ? (
          <Button
            title={`Demo login (${DEMO_EMAIL})`}
            onPress={handleDemoLogin}
            variant="secondary"
            theme={theme}
            loading={demoLoading}
            disabled={demoLoading}
          />
        ) : null}

        {showDemoLogin ? (
          <Text style={{ color: theme.colors.textSecondary, marginTop: 8 }}>
            API: {ENV.API_URL}
          </Text>
        ) : null}

        {demoError ? <Text style={{ color: '#DC2626', marginTop: 8 }}>{demoError}</Text> : null}
      </View>
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    pageContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.xxxl,
    },
    title: {
      ...theme.typography.h1,
      textAlign: 'center',
      marginBottom: theme.spacing.lg,
    },
    description: {
      ...theme.typography.body,
      textAlign: 'center',
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.sm,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: theme.radius.full,
    },
    footer: {
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
    },
  });
