import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '@solitaire/ui-kit';
import api from '../../services/api';

interface RevenueStats {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  totalRevenue: number;
  activeGames: number;
  completedGamesToday: number;
  totalPlayers: number;
  averageGameSize: number;
}

export const AdminDashboardScreen: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { theme } = useTheme();
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/revenue-stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  const formatMoney = (cents: number) => {
    return `$${(cents / 100).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading && !stats) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading revenue data...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          💰 Platform Revenue
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Your earnings from all games
        </Text>
      </View>

      {/* Revenue Cards */}
      <View style={styles.revenueGrid}>
        {/* Today */}
        <Card theme={theme} style={styles.revenueCard}>
          <Text style={[styles.revenueLabel, { color: theme.colors.textSecondary }]}>
            Today
          </Text>
          <Text style={[styles.revenueAmount, { color: '#4CAF50' }]}>
            {formatMoney(stats?.todayRevenue || 0)}
          </Text>
          <Text style={[styles.revenueDetail, { color: theme.colors.textSecondary }]}>
            {stats?.completedGamesToday || 0} games
          </Text>
        </Card>

        {/* This Week */}
        <Card theme={theme} style={styles.revenueCard}>
          <Text style={[styles.revenueLabel, { color: theme.colors.textSecondary }]}>
            This Week
          </Text>
          <Text style={[styles.revenueAmount, { color: '#2196F3' }]}>
            {formatMoney(stats?.weekRevenue || 0)}
          </Text>
          <Text style={[styles.revenueDetail, { color: theme.colors.textSecondary }]}>
            7 days
          </Text>
        </Card>
      </View>

      <View style={styles.revenueGrid}>
        {/* This Month */}
        <Card theme={theme} style={styles.revenueCard}>
          <Text style={[styles.revenueLabel, { color: theme.colors.textSecondary }]}>
            This Month
          </Text>
          <Text style={[styles.revenueAmount, { color: '#FF9800' }]}>
            {formatMoney(stats?.monthRevenue || 0)}
          </Text>
          <Text style={[styles.revenueDetail, { color: theme.colors.textSecondary }]}>
            30 days
          </Text>
        </Card>

        {/* All Time */}
        <Card theme={theme} style={styles.revenueCard}>
          <Text style={[styles.revenueLabel, { color: theme.colors.textSecondary }]}>
            All Time
          </Text>
          <Text style={[styles.revenueAmount, { color: '#9C27B0' }]}>
            {formatMoney(stats?.totalRevenue || 0)}
          </Text>
          <Text style={[styles.revenueDetail, { color: theme.colors.textSecondary }]}>
            Total
          </Text>
        </Card>
      </View>

      {/* Platform Stats */}
      <Card theme={theme} style={styles.statsCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Platform Stats
        </Text>

        <View style={styles.statRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {stats?.activeGames || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Active Games
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {stats?.totalPlayers || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Total Players
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.colors.primary }]}>
              {stats?.averageGameSize?.toFixed(1) || '0.0'}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>
              Avg Players/Game
            </Text>
          </View>
        </View>
      </Card>

      {/* Revenue Breakdown */}
      <Card theme={theme} style={styles.breakdownCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          💵 Revenue Breakdown
        </Text>

        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: theme.colors.text }]}>
            Platform Fee Rate
          </Text>
          <Text style={[styles.breakdownValue, { color: '#4CAF50' }]}>
            10%
          </Text>
        </View>

        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: theme.colors.text }]}>
            Average Fee/Game
          </Text>
          <Text style={[styles.breakdownValue, { color: theme.colors.primary }]}>
            {formatMoney(
              stats?.completedGamesToday
                ? (stats.todayRevenue / stats.completedGamesToday)
                : 0
            )}
          </Text>
        </View>

        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: theme.colors.text }]}>
            Projected Monthly
          </Text>
          <Text style={[styles.breakdownValue, { color: '#FF9800' }]}>
            {formatMoney((stats?.todayRevenue || 0) * 30)}
          </Text>
        </View>

        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: theme.colors.text }]}>
            Projected Annual
          </Text>
          <Text style={[styles.breakdownValue, { color: '#9C27B0' }]}>
            {formatMoney((stats?.todayRevenue || 0) * 365)}
          </Text>
        </View>
      </Card>

      {/* Example Earnings */}
      <Card theme={theme} style={styles.exampleCard}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          📊 Example: 9-Player $10 Game
        </Text>

        <View style={styles.exampleRow}>
          <Text style={[styles.exampleLabel, { color: theme.colors.textSecondary }]}>
            Total Entry Fees (9 × $10)
          </Text>
          <Text style={[styles.exampleValue, { color: theme.colors.text }]}>
            $90.00
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.exampleRow}>
          <Text style={[styles.exampleLabel, { color: '#4CAF50' }]}>
            Your Platform Fee (10%)
          </Text>
          <Text style={[styles.exampleValue, { color: '#4CAF50', fontWeight: 'bold' }]}>
            $9.00 💰
          </Text>
        </View>

        <View style={styles.exampleRow}>
          <Text style={[styles.exampleLabel, { color: theme.colors.textSecondary }]}>
            Prize Pool (90%)
          </Text>
          <Text style={[styles.exampleValue, { color: theme.colors.textSecondary }]}>
            $81.00
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.exampleBreakdown}>
          <Text style={[styles.exampleSubtitle, { color: theme.colors.text }]}>
            Player Payouts:
          </Text>
          <Text style={[styles.exampleDetail, { color: theme.colors.textSecondary }]}>
            1st: $24.30 · 2nd: $16.20 · 3rd: $10.53
          </Text>
          <Text style={[styles.exampleDetail, { color: theme.colors.textSecondary }]}>
            4th: $8.10 · 5th: $6.48 · 6th: $4.86
          </Text>
          <Text style={[styles.exampleDetail, { color: theme.colors.textSecondary }]}>
            7th: $4.05 · 8th: $3.24 · 9th: $2.43 · 10th: $0.81
          </Text>
        </View>
      </Card>

      <View style={styles.spacing} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  revenueGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  revenueCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  revenueAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  revenueDetail: {
    fontSize: 12,
  },
  statsCard: {
    marginBottom: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  breakdownCard: {
    marginBottom: 12,
    padding: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  breakdownLabel: {
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  exampleCard: {
    marginBottom: 12,
    padding: 16,
  },
  exampleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  exampleLabel: {
    fontSize: 13,
    flex: 1,
  },
  exampleValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  exampleBreakdown: {
    paddingTop: 8,
  },
  exampleSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  exampleDetail: {
    fontSize: 12,
    marginBottom: 3,
  },
  spacing: {
    height: 20,
  },
});
