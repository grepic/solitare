import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/theme.store';
import { statsService, PlayerStats, DailyStats, WinRateTrend, EarningsTrend } from '../../services/stats.service';
import { SkeletonCard } from '../../components/EnhancedSkeleton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 48;

export default function StatsScreen() {
  const { theme } = useThemeStore();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      await statsService.initialize();
      const playerStats = statsService.getStats();
      setStats(playerStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await statsService.refresh();
    const playerStats = statsService.getStats();
    setStats(playerStats);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <ScrollView
        style={[styles(theme).container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles(theme).content}
      >
        <Text style={[styles(theme).title, { color: theme.colors.text }]}>Statistics 📊</Text>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </ScrollView>
    );
  }

  if (!stats) {
    return (
      <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles(theme).emptyText, { color: theme.colors.textSecondary }]}>
          No statistics available yet. Play some games to see your stats!
        </Text>
      </View>
    );
  }

  const dailyStats = selectedPeriod === '7d' ? stats.last7Days : stats.last30Days;

  return (
    <ScrollView
      style={[styles(theme).container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles(theme).content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
      }
    >
      <Text style={[styles(theme).title, { color: theme.colors.text }]}>Statistics 📊</Text>

      {/* Overall Stats Cards */}
      <View style={styles(theme).statsGrid}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={styles(theme).statCard}
        >
          <Text style={styles(theme).statLabel}>Games Played</Text>
          <Text style={styles(theme).statValue}>{stats.totalGames}</Text>
        </LinearGradient>

        <View style={[styles(theme).statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles(theme).statLabel, { color: theme.colors.textSecondary }]}>Win Rate</Text>
          <Text style={[styles(theme).statValue, { color: theme.colors.success }]}>
            {stats.winRate.toFixed(1)}%
          </Text>
        </View>

        <View style={[styles(theme).statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles(theme).statLabel, { color: theme.colors.textSecondary }]}>Current Streak</Text>
          <Text
            style={[
              styles(theme).statValue,
              { color: stats.currentStreak >= 0 ? theme.colors.success : theme.colors.error },
            ]}
          >
            {stats.currentStreak >= 0 ? '+' : ''}
            {stats.currentStreak}
          </Text>
        </View>

        <View style={[styles(theme).statCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles(theme).statLabel, { color: theme.colors.textSecondary }]}>Net Profit</Text>
          <Text
            style={[
              styles(theme).statValue,
              { color: stats.netProfit >= 0 ? theme.colors.success : theme.colors.error },
            ]}
          >
            ${(stats.netProfit / 100).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Performance Summary */}
      <View style={[styles(theme).section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>Performance Summary</Text>

        <View style={styles(theme).summaryRow}>
          <Text style={[styles(theme).summaryLabel, { color: theme.colors.textSecondary }]}>Total Wins</Text>
          <Text style={[styles(theme).summaryValue, { color: theme.colors.text }]}>{stats.totalWins}</Text>
        </View>

        <View style={styles(theme).summaryRow}>
          <Text style={[styles(theme).summaryLabel, { color: theme.colors.textSecondary }]}>Total Losses</Text>
          <Text style={[styles(theme).summaryValue, { color: theme.colors.text }]}>{stats.totalLosses}</Text>
        </View>

        <View style={styles(theme).summaryRow}>
          <Text style={[styles(theme).summaryLabel, { color: theme.colors.textSecondary }]}>
            Longest Win Streak
          </Text>
          <Text style={[styles(theme).summaryValue, { color: theme.colors.success }]}>
            {stats.longestWinStreak} 🔥
          </Text>
        </View>

        <View style={styles(theme).summaryRow}>
          <Text style={[styles(theme).summaryLabel, { color: theme.colors.textSecondary }]}>Perfect Games</Text>
          <Text style={[styles(theme).summaryValue, { color: theme.colors.text }]}>
            {stats.perfectGames} ⭐
          </Text>
        </View>

        <View style={styles(theme).summaryRow}>
          <Text style={[styles(theme).summaryLabel, { color: theme.colors.textSecondary }]}>Average Time</Text>
          <Text style={[styles(theme).summaryValue, { color: theme.colors.text }]}>
            {Math.round(stats.averageGameTimeMs / 1000)}s
          </Text>
        </View>

        <View style={styles(theme).summaryRow}>
          <Text style={[styles(theme).summaryLabel, { color: theme.colors.textSecondary }]}>Fastest Win</Text>
          <Text style={[styles(theme).summaryValue, { color: theme.colors.text }]}>
            {stats.fastestWinMs ? `${Math.round(stats.fastestWinMs / 1000)}s` : 'N/A'}
          </Text>
        </View>
      </View>

      {/* Tier Performance */}
      {stats.tierStats.length > 0 && (
        <View style={[styles(theme).section, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>Performance by Tier</Text>

          {stats.tierStats.map((tierStat) => (
            <View key={tierStat.tier} style={styles(theme).tierRow}>
              <View style={styles(theme).tierInfo}>
                <Text style={[styles(theme).tierName, { color: theme.colors.text }]}>{tierStat.tier}</Text>
                <Text style={[styles(theme).tierGames, { color: theme.colors.textSecondary }]}>
                  {tierStat.gamesPlayed} games
                </Text>
              </View>

              <View style={styles(theme).tierStats}>
                <Text style={[styles(theme).tierWinRate, { color: theme.colors.success }]}>
                  {tierStat.winRate.toFixed(1)}%
                </Text>
                <Text style={[styles(theme).tierEarnings, { color: theme.colors.text }]}>
                  ${(tierStat.totalEarnings / 100).toFixed(2)}
                </Text>
              </View>

              {/* Win rate bar */}
              <View style={[styles(theme).winRateBar, { backgroundColor: theme.colors.border }]}>
                <View
                  style={[
                    styles(theme).winRateBarFill,
                    {
                      width: `${tierStat.winRate}%`,
                      backgroundColor: theme.colors.success,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Daily Activity Chart */}
      {dailyStats.length > 0 && (
        <View style={[styles(theme).section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles(theme).sectionHeader}>
            <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>Activity</Text>

            <View style={styles(theme).periodSelector}>
              <TouchableOpacity
                style={[
                  styles(theme).periodButton,
                  selectedPeriod === '7d' && styles(theme).periodButtonActive,
                  {
                    backgroundColor:
                      selectedPeriod === '7d' ? theme.colors.primary : theme.colors.background,
                  },
                ]}
                onPress={() => setSelectedPeriod('7d')}
              >
                <Text
                  style={[
                    styles(theme).periodButtonText,
                    { color: selectedPeriod === '7d' ? '#FFFFFF' : theme.colors.textSecondary },
                  ]}
                >
                  7D
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles(theme).periodButton,
                  selectedPeriod === '30d' && styles(theme).periodButtonActive,
                  {
                    backgroundColor:
                      selectedPeriod === '30d' ? theme.colors.primary : theme.colors.background,
                  },
                ]}
                onPress={() => setSelectedPeriod('30d')}
              >
                <Text
                  style={[
                    styles(theme).periodButtonText,
                    { color: selectedPeriod === '30d' ? '#FFFFFF' : theme.colors.textSecondary },
                  ]}
                >
                  30D
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <SimpleBarChart data={dailyStats} theme={theme} />
        </View>
      )}

      {/* Earnings Summary */}
      <View style={[styles(theme).section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>Earnings Summary</Text>

        <View style={styles(theme).summaryRow}>
          <Text style={[styles(theme).summaryLabel, { color: theme.colors.textSecondary }]}>Total Earnings</Text>
          <Text style={[styles(theme).summaryValue, { color: theme.colors.success }]}>
            ${(stats.totalEarnings / 100).toFixed(2)}
          </Text>
        </View>

        <View style={styles(theme).summaryRow}>
          <Text style={[styles(theme).summaryLabel, { color: theme.colors.textSecondary }]}>Total Losses</Text>
          <Text style={[styles(theme).summaryValue, { color: theme.colors.error }]}>
            ${(stats.totalLosses / 100).toFixed(2)}
          </Text>
        </View>

        <View style={styles(theme).summaryRow}>
          <Text style={[styles(theme).summaryLabel, { color: theme.colors.textSecondary }]}>Biggest Win</Text>
          <Text style={[styles(theme).summaryValue, { color: theme.colors.success }]}>
            ${(stats.biggestWin / 100).toFixed(2)} 💎
          </Text>
        </View>

        <View style={styles(theme).summaryRow}>
          <Text style={[styles(theme).summaryLabel, { color: theme.colors.textSecondary }]}>Biggest Loss</Text>
          <Text style={[styles(theme).summaryValue, { color: theme.colors.error }]}>
            ${(stats.biggestLoss / 100).toFixed(2)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

// Simple bar chart component
function SimpleBarChart({ data, theme }: { data: DailyStats[]; theme: any }) {
  const maxGames = Math.max(...data.map((d) => d.gamesPlayed), 1);
  const chartHeight = 150;

  return (
    <View style={styles(theme).chart}>
      <View style={styles(theme).chartBars}>
        {data.map((day, index) => {
          const height = (day.gamesPlayed / maxGames) * chartHeight;
          const isWinning = day.wins > day.losses;

          return (
            <View key={day.date} style={styles(theme).barContainer}>
              <View
                style={[
                  styles(theme).bar,
                  {
                    height,
                    backgroundColor: isWinning ? theme.colors.success : theme.colors.error,
                  },
                ]}
              />
              <Text style={[styles(theme).barLabel, { color: theme.colors.textSecondary }]}>
                {new Date(day.date).getDate()}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles(theme).chartLegend}>
        <View style={styles(theme).legendItem}>
          <View style={[styles(theme).legendDot, { backgroundColor: theme.colors.success }]} />
          <Text style={[styles(theme).legendText, { color: theme.colors.textSecondary }]}>More Wins</Text>
        </View>
        <View style={styles(theme).legendItem}>
          <View style={[styles(theme).legendDot, { backgroundColor: theme.colors.error }]} />
          <Text style={[styles(theme).legendText, { color: theme.colors.textSecondary }]}>More Losses</Text>
        </View>
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
      padding: theme.spacing.lg,
      paddingBottom: theme.spacing.xxxl,
    },
    title: {
      ...theme.typography.h1,
      marginBottom: theme.spacing.xl,
      textAlign: 'center',
    },
    emptyText: {
      ...theme.typography.body,
      textAlign: 'center',
      marginTop: theme.spacing.xxxl,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xl,
    },
    statCard: {
      flex: 1,
      minWidth: '47%',
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    statLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statValue: {
      fontSize: 28,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    section: {
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    sectionTitle: {
      ...theme.typography.h2,
      marginBottom: theme.spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    summaryLabel: {
      ...theme.typography.body,
      fontSize: 14,
    },
    summaryValue: {
      ...theme.typography.bodyBold,
      fontSize: 15,
    },
    tierRow: {
      marginBottom: theme.spacing.md,
    },
    tierInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    tierName: {
      ...theme.typography.bodyBold,
      fontSize: 15,
    },
    tierGames: {
      ...theme.typography.caption,
      fontSize: 12,
    },
    tierStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
    },
    tierWinRate: {
      ...theme.typography.bodyBold,
      fontSize: 14,
    },
    tierEarnings: {
      ...theme.typography.body,
      fontSize: 14,
    },
    winRateBar: {
      height: 4,
      borderRadius: 2,
      overflow: 'hidden',
    },
    winRateBarFill: {
      height: '100%',
    },
    periodSelector: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    periodButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.radius.md,
    },
    periodButtonActive: {},
    periodButtonText: {
      fontSize: 12,
      fontWeight: '700',
    },
    chart: {
      marginTop: theme.spacing.md,
    },
    chartBars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      height: 150,
      gap: 4,
    },
    barContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    bar: {
      width: '100%',
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
      minHeight: 2,
    },
    barLabel: {
      fontSize: 10,
      marginTop: 4,
    },
    chartLegend: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.lg,
      marginTop: theme.spacing.md,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 12,
    },
  });
