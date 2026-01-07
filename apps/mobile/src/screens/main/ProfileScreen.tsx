import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Button, Card } from '@solitaire/ui-kit';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';
import api from '../../services/api';

export default function ProfileScreen() {
  const { theme, toggleTheme, isDark } = useThemeStore();
  const { user, clearAuth } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    loadProfile();
    loadMatches();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await api.get('/me');
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const loadMatches = async () => {
    try {
      const { data } = await api.get('/me/matches');
      setMatches(data.slice(0, 10)); // Last 10 matches
    } catch (error) {
      console.error('Failed to load matches:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearAuth();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={[styles(theme).container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles(theme).content}
    >
      <Text style={[styles(theme).title, { color: theme.colors.text }]}>Profile</Text>

      {profile && (
        <Card theme={theme}>
          <Text style={[styles(theme).nickname, { color: theme.colors.text }]}>
            {profile.nickname}
          </Text>
          <Text style={[styles(theme).email, { color: theme.colors.textSecondary }]}>
            {profile.email}
          </Text>

          <View style={styles(theme).stats}>
            <View style={styles(theme).stat}>
              <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '600' }}>
                {profile.level}
              </Text>
              <Text style={{ color: theme.colors.textSecondary }}>Level</Text>
            </View>
            <View style={styles(theme).stat}>
              <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '600' }}>
                {profile.stats.wins}
              </Text>
              <Text style={{ color: theme.colors.textSecondary }}>Wins</Text>
            </View>
            <View style={styles(theme).stat}>
              <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '600' }}>
                {profile.stats.winRate.toFixed(1)}%
              </Text>
              <Text style={{ color: theme.colors.textSecondary }}>Win Rate</Text>
            </View>
          </View>
        </Card>
      )}

      <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>
        Recent Matches
      </Text>

      {matches.map((match, index) => (
        <Card key={index} theme={theme} padding={theme.spacing.md}>
          <View style={styles(theme).match}>
            <View>
              <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                vs {match.opponent?.nickname || 'Unknown'}
              </Text>
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12 }}>
                {match.tier} • {new Date(match.playedAt).toLocaleDateString()}
              </Text>
            </View>
            <Text
              style={{
                color: match.isWinner ? theme.colors.success : theme.colors.error,
                fontWeight: '600',
              }}
            >
              {match.isWinner ? 'WIN' : 'LOSS'}
            </Text>
          </View>
        </Card>
      ))}

      <Card theme={theme}>
        <Button
          title={`Theme: ${isDark ? 'Dark' : 'Light'}`}
          onPress={toggleTheme}
          variant="secondary"
          theme={theme}
        />
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="danger"
          theme={theme}
          style={{ marginTop: theme.spacing.md }}
        />
      </Card>
    </ScrollView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    title: {
      ...theme.typography.h1,
    },
    nickname: {
      ...theme.typography.h2,
      marginBottom: theme.spacing.xs,
    },
    email: {
      ...theme.typography.body,
      marginBottom: theme.spacing.lg,
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    stat: {
      alignItems: 'center',
    },
    sectionTitle: {
      ...theme.typography.h2,
    },
    match: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  });
