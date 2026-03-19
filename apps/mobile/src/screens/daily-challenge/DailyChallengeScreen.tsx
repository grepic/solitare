import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/theme.store';
import {
  dailyChallengeService,
  DailyChallenge,
  DailyChallengeStreak,
  DailyChallengeProgress,
} from '../../services/daily-challenge.service';

export default function DailyChallengeScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState<DailyChallengeProgress | null>(null);
  const [streak, setStreak] = useState<DailyChallengeStreak | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [history, setHistory] = useState<DailyChallengeProgress[]>([]);
  const [calendar, setCalendar] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChallengeData();
  }, []);

  const loadChallengeData = async () => {
    setLoading(true);
    try {
      await dailyChallengeService.initialize();

      const currentChallenge = dailyChallengeService.getCurrentChallenge();
      setChallenge(currentChallenge);

      const completed = dailyChallengeService.isTodayChallengeCompleted();
      setIsCompleted(completed);

      if (currentChallenge) {
        const prog = dailyChallengeService.getProgress(currentChallenge.id);
        setProgress(prog);
      }

      const streakData = dailyChallengeService.getStreak();
      setStreak(streakData);

      const statsData = dailyChallengeService.getStats();
      setStats(statsData);

      const historyData = await dailyChallengeService.getHistory(7);
      setHistory(historyData);

      // Load calendar for current month
      const now = new Date();
      const calendarData = await dailyChallengeService.getCalendarData(
        now.getMonth(),
        now.getFullYear()
      );
      setCalendar(calendarData);
    } catch (error) {
      console.error('Failed to load daily challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChallengeData();
    setRefreshing(false);
  };

  const handlePlayChallenge = () => {
    if (!challenge) return;

    if (isCompleted) {
      Alert.alert('Already Completed', 'You have already completed today\'s challenge!');
      return;
    }

    // Navigate to game with challenge seed
    navigation.navigate('Game', {
      seed: challenge.seed,
      isDailyChallenge: true,
      challengeId: challenge.id,
    });
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'EASY':
        return theme.colors.success;
      case 'MEDIUM':
        return theme.colors.warning;
      case 'HARD':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const days: JSX.Element[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(<View key={`empty-${i}`} style={styles(theme).calendarDay} />);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday =
        day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      const isCompleted = calendar[dateString] || false;

      days.push(
        <View
          key={day}
          style={[
            styles(theme).calendarDay,
            isToday && { borderColor: theme.colors.primary, borderWidth: 2 },
            isCompleted && { backgroundColor: theme.colors.success + '30' },
          ]}
        >
          <Text
            style={[
              styles(theme).calendarDayText,
              { color: isToday ? theme.colors.primary : theme.colors.text },
            ]}
          >
            {day}
          </Text>
          {isCompleted && <Text style={styles(theme).calendarCheckmark}>✓</Text>}
        </View>
      );
    }

    return <View style={styles(theme).calendarGrid}>{days}</View>;
  };

  if (loading || !challenge) {
    return (
      <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles(theme).loadingText, { color: theme.colors.textSecondary }]}>
          Loading daily challenge...
        </Text>
      </View>
    );
  }

  const timeRemaining = challenge.expiresAt.getTime() - Date.now();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));

  return (
    <ScrollView
      style={[styles(theme).container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles(theme).content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles(theme).header}
      >
        <Text style={styles(theme).headerTitle}>📅 Daily Challenge</Text>
        <Text style={styles(theme).headerSubtitle}>
          {isCompleted ? '✅ Completed!' : `⏰ ${hoursRemaining}h remaining`}
        </Text>
      </LinearGradient>

      {/* Challenge Card */}
      <View style={[styles(theme).challengeCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles(theme).challengeHeader}>
          <Text style={[styles(theme).challengeTitle, { color: theme.colors.text }]}>
            Today's Challenge
          </Text>
          <View
            style={[
              styles(theme).difficultyBadge,
              { backgroundColor: getDifficultyColor(challenge.difficulty) },
            ]}
          >
            <Text style={styles(theme).difficultyText}>{challenge.difficulty}</Text>
          </View>
        </View>

        {!isCompleted && (
          <Text style={[styles(theme).challengeDescription, { color: theme.colors.textSecondary }]}>
            Complete this unique daily challenge to earn rewards and maintain your streak!
          </Text>
        )}

        {/* Rewards */}
        <View style={styles(theme).rewards}>
          <View style={styles(theme).rewardItem}>
            <Text style={styles(theme).rewardIcon}>💎</Text>
            <Text style={[styles(theme).rewardValue, { color: theme.colors.text }]}>
              {challenge.rewards.gems}
            </Text>
            <Text style={[styles(theme).rewardLabel, { color: theme.colors.textSecondary }]}>
              Gems
            </Text>
          </View>
          <View style={styles(theme).rewardItem}>
            <Text style={styles(theme).rewardIcon}>🪙</Text>
            <Text style={[styles(theme).rewardValue, { color: theme.colors.text }]}>
              {challenge.rewards.coins}
            </Text>
            <Text style={[styles(theme).rewardLabel, { color: theme.colors.textSecondary }]}>
              Coins
            </Text>
          </View>
          {streak && streak.current > 0 && (
            <View style={styles(theme).rewardItem}>
              <Text style={styles(theme).rewardIcon}>⚡</Text>
              <Text style={[styles(theme).rewardValue, { color: theme.colors.primary }]}>
                +{Math.min(streak.current * 5, 50)}%
              </Text>
              <Text style={[styles(theme).rewardLabel, { color: theme.colors.textSecondary }]}>
                Streak Bonus
              </Text>
            </View>
          )}
        </View>

        {/* Progress (if completed) */}
        {isCompleted && progress && (
          <View style={[styles(theme).completionInfo, { backgroundColor: theme.colors.success + '20' }]}>
            <Text style={[styles(theme).completionTitle, { color: theme.colors.success }]}>
              ✅ Completed!
            </Text>
            <View style={styles(theme).completionStats}>
              <View style={styles(theme).completionStat}>
                <Text style={[styles(theme).completionStatLabel, { color: theme.colors.textSecondary }]}>
                  Score
                </Text>
                <Text style={[styles(theme).completionStatValue, { color: theme.colors.text }]}>
                  {progress.score}
                </Text>
              </View>
              <View style={styles(theme).completionStat}>
                <Text style={[styles(theme).completionStatLabel, { color: theme.colors.textSecondary }]}>
                  Moves
                </Text>
                <Text style={[styles(theme).completionStatValue, { color: theme.colors.text }]}>
                  {progress.moves}
                </Text>
              </View>
              <View style={styles(theme).completionStat}>
                <Text style={[styles(theme).completionStatLabel, { color: theme.colors.textSecondary }]}>
                  Time
                </Text>
                <Text style={[styles(theme).completionStatValue, { color: theme.colors.text }]}>
                  {formatTime(progress.timeMs)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Play Button */}
        <TouchableOpacity
          style={[
            styles(theme).playButton,
            {
              backgroundColor: isCompleted ? theme.colors.border : theme.colors.primary,
            },
          ]}
          onPress={handlePlayChallenge}
          disabled={isCompleted}
        >
          <Text style={styles(theme).playButtonText}>
            {isCompleted ? '✅ Already Completed' : '🎮 Play Challenge'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Streak Section */}
      {streak && (
        <View style={[styles(theme).streakCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>
            🔥 Streak
          </Text>
          <View style={styles(theme).streakStats}>
            <View style={styles(theme).streakStat}>
              <Text style={[styles(theme).streakValue, { color: theme.colors.primary }]}>
                {streak.current}
              </Text>
              <Text style={[styles(theme).streakLabel, { color: theme.colors.textSecondary }]}>
                Current
              </Text>
            </View>
            <View style={styles(theme).streakStat}>
              <Text style={[styles(theme).streakValue, { color: theme.colors.warning }]}>
                {streak.longest}
              </Text>
              <Text style={[styles(theme).streakLabel, { color: theme.colors.textSecondary }]}>
                Longest
              </Text>
            </View>
          </View>
          <Text style={[styles(theme).streakInfo, { color: theme.colors.textSecondary }]}>
            Complete daily challenges to build your streak and earn bonus rewards!
          </Text>
        </View>
      )}

      {/* Stats Section */}
      {stats && (
        <View style={[styles(theme).statsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>
            📊 Statistics
          </Text>
          <View style={styles(theme).statsGrid}>
            <View style={styles(theme).statBox}>
              <Text style={[styles(theme).statBoxValue, { color: theme.colors.text }]}>
                {stats.totalCompleted}
              </Text>
              <Text style={[styles(theme).statBoxLabel, { color: theme.colors.textSecondary }]}>
                Completed
              </Text>
            </View>
            <View style={styles(theme).statBox}>
              <Text style={[styles(theme).statBoxValue, { color: theme.colors.primary }]}>
                {stats.completionRate}%
              </Text>
              <Text style={[styles(theme).statBoxLabel, { color: theme.colors.textSecondary }]}>
                Completion Rate
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Calendar Section */}
      <View style={[styles(theme).calendarCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>
          📆 This Month
        </Text>
        {renderCalendar()}
        <View style={styles(theme).calendarLegend}>
          <View style={styles(theme).legendItem}>
            <View
              style={[
                styles(theme).legendDot,
                { backgroundColor: theme.colors.success + '30' },
              ]}
            />
            <Text style={[styles(theme).legendText, { color: theme.colors.textSecondary }]}>
              Completed
            </Text>
          </View>
          <View style={styles(theme).legendItem}>
            <View
              style={[styles(theme).legendDot, { borderColor: theme.colors.primary, borderWidth: 2 }]}
            />
            <Text style={[styles(theme).legendText, { color: theme.colors.textSecondary }]}>
              Today
            </Text>
          </View>
        </View>
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
      paddingBottom: theme.spacing.xl,
    },
    header: {
      padding: theme.spacing.xl,
      alignItems: 'center',
    },
    headerTitle: {
      ...theme.typography.h1,
      color: '#FFFFFF',
      fontSize: 28,
      marginBottom: theme.spacing.xs,
    },
    headerSubtitle: {
      ...theme.typography.body,
      color: 'rgba(255,255,255,0.9)',
      fontSize: 14,
    },
    challengeCard: {
      margin: theme.spacing.lg,
      padding: theme.spacing.xl,
      borderRadius: theme.radius.xl,
    },
    challengeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    challengeTitle: {
      ...theme.typography.h2,
      fontSize: 20,
    },
    difficultyBadge: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
    },
    difficultyText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    challengeDescription: {
      ...theme.typography.body,
      fontSize: 14,
      marginBottom: theme.spacing.lg,
      lineHeight: 20,
    },
    rewards: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: theme.spacing.lg,
    },
    rewardItem: {
      alignItems: 'center',
    },
    rewardIcon: {
      fontSize: 32,
      marginBottom: theme.spacing.xs,
    },
    rewardValue: {
      ...theme.typography.h3,
      fontSize: 20,
      marginBottom: 2,
    },
    rewardLabel: {
      ...theme.typography.caption,
      fontSize: 11,
    },
    completionInfo: {
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing.lg,
    },
    completionTitle: {
      ...theme.typography.bodyBold,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    completionStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    completionStat: {
      alignItems: 'center',
    },
    completionStatLabel: {
      ...theme.typography.caption,
      fontSize: 11,
      marginBottom: 4,
    },
    completionStatValue: {
      ...theme.typography.bodyBold,
      fontSize: 18,
    },
    playButton: {
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
    },
    playButtonText: {
      color: '#FFFFFF',
      ...theme.typography.bodyBold,
      fontSize: 16,
    },
    streakCard: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.xl,
      borderRadius: theme.radius.xl,
    },
    sectionTitle: {
      ...theme.typography.h2,
      fontSize: 18,
      marginBottom: theme.spacing.md,
    },
    streakStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: theme.spacing.md,
    },
    streakStat: {
      alignItems: 'center',
    },
    streakValue: {
      ...theme.typography.h1,
      fontSize: 48,
      fontWeight: 'bold',
    },
    streakLabel: {
      ...theme.typography.caption,
      fontSize: 12,
    },
    streakInfo: {
      ...theme.typography.caption,
      fontSize: 12,
      textAlign: 'center',
      fontStyle: 'italic',
    },
    statsCard: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.xl,
      borderRadius: theme.radius.xl,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statBox: {
      alignItems: 'center',
    },
    statBoxValue: {
      ...theme.typography.h2,
      fontSize: 28,
      marginBottom: 4,
    },
    statBoxLabel: {
      ...theme.typography.caption,
      fontSize: 12,
    },
    calendarCard: {
      marginHorizontal: theme.spacing.lg,
      padding: theme.spacing.xl,
      borderRadius: theme.radius.xl,
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: theme.spacing.md,
    },
    calendarDay: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.sm,
      marginBottom: theme.spacing.xs,
      position: 'relative',
    },
    calendarDayText: {
      ...theme.typography.body,
      fontSize: 14,
    },
    calendarCheckmark: {
      position: 'absolute',
      top: 2,
      right: 2,
      fontSize: 10,
      color: '#10B981',
    },
    calendarLegend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.xl,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    legendDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    legendText: {
      ...theme.typography.caption,
      fontSize: 11,
    },
    loadingText: {
      ...theme.typography.body,
      textAlign: 'center',
      marginTop: theme.spacing.xxxl,
    },
  });
