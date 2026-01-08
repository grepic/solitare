import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image } from 'react-native';
import { useThemeStore } from '../../store/theme.store';
import { SkeletonList } from '../../components/SkeletonLoader';
import api from '../../services/api';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  wins: number;
  totalMatches: number;
  winRate: number;
  totalEarnings: number;
}

export default function LeaderboardScreen() {
  const { theme } = useThemeStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'allTime'>('weekly');

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/leaderboard?period=${period}`);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: LeaderboardEntry }) => (
    <View style={[styles(theme).item, { backgroundColor: theme.colors.surface }]}>
      <View style={styles(theme).rankContainer}>
        <Text style={[styles(theme).rank, { color: getRankColor(item.rank) }]}>#{item.rank}</Text>
      </View>

      <Image
        source={{ uri: item.avatarUrl || 'https://via.placeholder.com/40' }}
        style={styles(theme).avatar}
      />

      <View style={styles(theme).info}>
        <Text style={[styles(theme).nickname, { color: theme.colors.text }]}>{item.nickname}</Text>
        <Text style={[styles(theme).stats, { color: theme.colors.textSecondary }]}>
          {item.wins}W / {item.totalMatches - item.wins}L ({item.winRate.toFixed(1)}%)
        </Text>
      </View>

      <View style={styles(theme).earnings}>
        <Text style={[styles(theme).earningsValue, { color: theme.colors.success }]}>
          ${(item.totalEarnings / 100).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return theme.colors.text;
  };

  if (loading) {
    return (
      <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
        <SkeletonList count={10} />
      </View>
    );
  }

  return (
    <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles(theme).title, { color: theme.colors.text }]}>Leaderboard</Text>

      {/* Period Selector */}
      <View style={styles(theme).periodSelector}>
        {(['daily', 'weekly', 'allTime'] as const).map((p) => (
          <Text
            key={p}
            style={[
              styles(theme).periodTab,
              { color: period === p ? theme.colors.primary : theme.colors.textSecondary },
            ]}
            onPress={() => setPeriod(p)}
          >
            {p === 'daily' ? 'Daily' : p === 'weekly' ? 'Weekly' : 'All Time'}
          </Text>
        ))}
      </View>

      <FlatList
        data={leaderboard}
        renderItem={renderItem}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles(theme).list}
      />
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: theme.spacing.lg,
    },
    title: {
      ...theme.typography.h1,
      marginBottom: theme.spacing.lg,
    },
    periodSelector: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    periodTab: {
      ...theme.typography.body,
      fontWeight: '600',
    },
    list: {
      gap: theme.spacing.sm,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      gap: theme.spacing.md,
    },
    rankContainer: {
      width: 40,
      alignItems: 'center',
    },
    rank: {
      ...theme.typography.h3,
      fontWeight: '700',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    info: {
      flex: 1,
    },
    nickname: {
      ...theme.typography.body,
      fontWeight: '600',
      marginBottom: 2,
    },
    stats: {
      ...theme.typography.caption,
    },
    earnings: {
      alignItems: 'flex-end',
    },
    earningsValue: {
      ...theme.typography.h3,
      fontWeight: '700',
    },
  });
