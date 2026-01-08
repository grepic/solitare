import React, { useState } from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react';
import { Button } from '@solitaire/ui-kit';
import { useThemeStore } from '../../store/theme.store';
import api from '../../services/api';

export default function ResponsibleGamingScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const [loading, setLoading] = useState(false);

  const handleSetLimit = async (type: 'daily' | 'weekly' | 'monthly', amountCents: number) => {
    setLoading(true);
    try {
      await api.post('/me/spending-limit', { type, amountCents });
    } catch (error) {
      console.error('Error setting limit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelfExclusion = async (days: number) => {
    setLoading(true);
    try {
      await api.post('/me/self-exclude', { days });
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error setting self-exclusion:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles(theme).container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles(theme).content}>
      <Text style={[styles(theme).title, { color: theme.colors.text }]}>Responsible Gaming</Text>

      <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
        We are committed to promoting responsible gaming. Please use these tools to help manage your gaming activity.
      </Text>

      <View style={styles(theme).section}>
        <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>Warning Signs</Text>
        <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
          • Spending more than you can afford{'\n'}
          • Chasing losses{'\n'}
          • Neglecting other responsibilities{'\n'}
          • Gaming to escape problems{'\n'}
          • Lying about gaming habits
        </Text>
      </View>

      <View style={styles(theme).section}>
        <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>Spending Limits</Text>
        <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
          Set daily, weekly, or monthly deposit limits to control your spending.
        </Text>
        <Button title="Set Daily Limit" onPress={() => handleSetLimit('daily', 10000)} theme={theme} loading={loading} />
      </View>

      <View style={styles(theme).section}>
        <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>Self-Exclusion</Text>
        <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
          Take a break from gaming for 24 hours, 7 days, 30 days, or permanently.
        </Text>
        <Button title="Take a Break (24 hours)" onPress={() => handleSelfExclusion(1)} theme={theme} loading={loading} variant="secondary" />
      </View>

      <View style={styles(theme).section}>
        <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>Get Help</Text>
        <Text style={[styles(theme).text, { color: theme.colors.textSecondary }]}>
          National Problem Gambling Helpline: 1-800-522-4700{'\n'}
          Available 24/7 for free, confidential support.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: { padding: theme.spacing.xl },
    title: { ...theme.typography.h1, marginBottom: theme.spacing.lg },
    section: { marginTop: theme.spacing.xl },
    sectionTitle: { ...theme.typography.h3, marginBottom: theme.spacing.sm },
    text: { ...theme.typography.body, lineHeight: 22, marginBottom: theme.spacing.md },
  });
