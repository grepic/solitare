import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Image, RefreshControl, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'allTime'>('weekly');
  const [currentUserId] = useState('user123'); // TODO: Get from auth store

  // Animation values for each item
  const animatedValues = useRef<Map<string, Animated.Value>>(new Map()).current;

  useEffect(() => {
    loadLeaderboard();
  }, [period]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/leaderboard?period=${period}`);
      setLeaderboard(data);

      // Animate items on load
      data.forEach((item: LeaderboardEntry, index: number) => {
        if (!animatedValues.has(item.userId)) {
          animatedValues.set(item.userId, new Animated.Value(0));
        }

        Animated.spring(animatedValues.get(item.userId)!, {
          toValue: 1,
          delay: index * 50,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }).start();
      });
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLeaderboard();
    setRefreshing(false);
  };

  const renderPodium = () => {
    const topThree = leaderboard.slice(0, 3);
    if (topThree.length === 0) return null;

    // Rearrange for podium: 2nd, 1st, 3rd
    const podiumOrder = [
      topThree[1], // 2nd place (left)
      topThree[0], // 1st place (center)
      topThree[2], // 3rd place (right)
    ].filter(Boolean);

    return (
      <View style={styles(theme).podiumContainer}>
        {podiumOrder.map((entry, index) => {
          if (!entry) return null;

          const actualRank = entry.rank;
          const podiumHeight = actualRank === 1 ? 140 : actualRank === 2 ? 110 : 90;
          const medalEmoji = actualRank === 1 ? '🥇' : actualRank === 2 ? '🥈' : '🥉';

          return (
            <View key={entry.userId} style={styles(theme).podiumItem}>
              {/* Avatar */}
              <View style={styles(theme).podiumAvatarContainer}>
                <Image
                  source={{ uri: entry.avatarUrl || 'https://via.placeholder.com/60' }}
                  style={[
                    styles(theme).podiumAvatar,
                    actualRank === 1 && styles(theme).podiumAvatarFirst,
                  ]}
                />
                <Text style={styles(theme).podiumMedal}>{medalEmoji}</Text>
              </View>

              {/* Nickname */}
              <Text
                style={[
                  styles(theme).podiumNickname,
                  { color: theme.colors.text },
                  actualRank === 1 && styles(theme).podiumNicknameFirst,
                ]}
                numberOfLines={1}
              >
                {entry.nickname}
              </Text>

              {/* Stats */}
              <Text style={[styles(theme).podiumStats, { color: theme.colors.textSecondary }]}>
                {entry.wins}W
              </Text>

              {/* Podium */}
              <LinearGradient
                colors={getPodiumGradient(actualRank)}
                style={[styles(theme).podium, { height: podiumHeight }]}
              >
                <Text style={styles(theme).podiumRank}>#{actualRank}</Text>
                <Text style={styles(theme).podiumEarnings}>
                  ${(entry.totalEarnings / 100).toFixed(0)}
                </Text>
              </LinearGradient>
            </View>
          );
        })}
      </View>
    );
  };

  const getPodiumGradient = (rank: number): [string, string] => {
    if (rank === 1) return ['#FFD700', '#FFA500']; // Gold
    if (rank === 2) return ['#C0C0C0', '#A8A8A8']; // Silver
    if (rank === 3) return ['#CD7F32', '#B8860B']; // Bronze
    return ['#E5E7EB', '#D1D5DB'];
  };

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => {
    // Skip top 3 as they're shown in podium
    if (item.rank <= 3) return null;

    const isCurrentUser = item.userId === currentUserId;
    const animValue = animatedValues.get(item.userId) || new Animated.Value(1);

    const animatedStyle = {
      opacity: animValue,
      transform: [
        {
          translateY: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    };

    return (
      <Animated.View style={animatedStyle}>
        <View
          style={[
            styles(theme).item,
            { backgroundColor: isCurrentUser ? theme.colors.primary + '20' : theme.colors.surface },
            isCurrentUser && styles(theme).currentUserItem,
          ]}
        >
          {/* Rank */}
          <View style={styles(theme).rankContainer}>
            <Text style={[styles(theme).rank, { color: getRankColor(item.rank) }]}>
              #{item.rank}
            </Text>
            {item.rank <= 10 && (
              <Text style={styles(theme).rankBadge}>
                {item.rank <= 5 ? '🔥' : '⭐'}
              </Text>
            )}
          </View>

          {/* Avatar */}
          <Image
            source={{ uri: item.avatarUrl || 'https://via.placeholder.com/40' }}
            style={[
              styles(theme).avatar,
              isCurrentUser && styles(theme).currentUserAvatar,
            ]}
          />

          {/* Info */}
          <View style={styles(theme).info}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text
                style={[
                  styles(theme).nickname,
                  { color: theme.colors.text },
                  isCurrentUser && styles(theme).currentUserNickname,
                ]}
              >
                {item.nickname}
              </Text>
              {isCurrentUser && (
                <Text style={styles(theme).youBadge}>YOU</Text>
              )}
            </View>
            <Text style={[styles(theme).stats, { color: theme.colors.textSecondary }]}>
              {item.wins}W / {item.totalMatches - item.wins}L ({item.winRate.toFixed(1)}%)
            </Text>
          </View>

          {/* Earnings */}
          <View style={styles(theme).earnings}>
            <Text style={[styles(theme).earningsValue, { color: theme.colors.success }]}>
              ${(item.totalEarnings / 100).toFixed(2)}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    if (rank <= 10) return theme.colors.primary;
    return theme.colors.textSecondary;
  };

  if (loading) {
    return (
      <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles(theme).title, { color: theme.colors.text }]}>Leaderboard 🏆</Text>
        <SkeletonList count={10} />
      </View>
    );
  }

  return (
    <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={leaderboard}
        renderItem={renderItem}
        keyExtractor={(item) => item.userId}
        contentContainerStyle={styles(theme).list}
        ListHeaderComponent={
          <>
            <Text style={[styles(theme).title, { color: theme.colors.text }]}>
              Leaderboard 🏆
            </Text>

            {/* Period Selector */}
            <View style={styles(theme).periodSelector}>
              {(['daily', 'weekly', 'allTime'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles(theme).periodTab,
                    period === p && styles(theme).periodTabActive,
                  ]}
                  onPress={() => setPeriod(p)}
                >
                  <Text
                    style={[
                      styles(theme).periodTabText,
                      { color: period === p ? '#FFFFFF' : theme.colors.textSecondary },
                    ]}
                  >
                    {p === 'daily' ? 'Daily' : p === 'weekly' ? 'Weekly' : 'All Time'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Top 3 Podium */}
            {renderPodium()}

            {/* Rest of leaderboard header */}
            {leaderboard.length > 3 && (
              <Text style={[styles(theme).sectionTitle, { color: theme.colors.textSecondary }]}>
                Rest of the pack
              </Text>
            )}
          </>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    title: {
      ...theme.typography.h1,
      marginBottom: theme.spacing.lg,
      textAlign: 'center',
      marginTop: theme.spacing.lg,
    },
    periodSelector: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: theme.spacing.xl,
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    periodTab: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
    },
    periodTabActive: {
      backgroundColor: theme.colors.primary,
    },
    periodTabText: {
      ...theme.typography.body,
      fontWeight: '600',
      fontSize: 13,
    },
    // Podium styles
    podiumContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    podiumItem: {
      flex: 1,
      alignItems: 'center',
      maxWidth: 120,
    },
    podiumAvatarContainer: {
      position: 'relative',
      marginBottom: theme.spacing.sm,
    },
    podiumAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      borderWidth: 3,
      borderColor: '#E5E7EB',
    },
    podiumAvatarFirst: {
      width: 70,
      height: 70,
      borderRadius: 35,
      borderWidth: 4,
      borderColor: '#FFD700',
    },
    podiumMedal: {
      position: 'absolute',
      bottom: -8,
      right: -8,
      fontSize: 28,
    },
    podiumNickname: {
      ...theme.typography.body,
      fontWeight: '700',
      fontSize: 13,
      marginBottom: 4,
      textAlign: 'center',
    },
    podiumNicknameFirst: {
      fontSize: 15,
    },
    podiumStats: {
      ...theme.typography.caption,
      fontSize: 11,
      marginBottom: theme.spacing.sm,
    },
    podium: {
      width: '100%',
      borderTopLeftRadius: theme.radius.md,
      borderTopRightRadius: theme.radius.md,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    podiumRank: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: '900',
      marginBottom: 4,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    podiumEarnings: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    sectionTitle: {
      ...theme.typography.body,
      fontWeight: '600',
      fontSize: 13,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: theme.spacing.md,
      marginLeft: theme.spacing.lg,
      marginTop: theme.spacing.sm,
    },
    // List styles
    list: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xl,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      gap: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    currentUserItem: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    rankContainer: {
      width: 45,
      alignItems: 'center',
      position: 'relative',
    },
    rank: {
      ...theme.typography.h3,
      fontWeight: '700',
      fontSize: 16,
    },
    rankBadge: {
      position: 'absolute',
      top: -8,
      right: -8,
      fontSize: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    currentUserAvatar: {
      borderColor: theme.colors.primary,
    },
    info: {
      flex: 1,
    },
    nickname: {
      ...theme.typography.body,
      fontWeight: '600',
      marginBottom: 2,
      fontSize: 15,
    },
    currentUserNickname: {
      fontWeight: '700',
    },
    youBadge: {
      backgroundColor: theme.colors.primary,
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '900',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      letterSpacing: 0.5,
    },
    stats: {
      ...theme.typography.caption,
      fontSize: 12,
    },
    earnings: {
      alignItems: 'flex-end',
    },
    earningsValue: {
      ...theme.typography.h3,
      fontWeight: '700',
      fontSize: 16,
    },
  });
