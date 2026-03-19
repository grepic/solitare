import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/theme.store';
import {
  achievementService,
  Achievement,
  AchievementProgress,
  AchievementCategory,
  AchievementRarity,
} from '../../services/achievement.service';

type FilterType = 'ALL' | AchievementCategory;

export default function AchievementsScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [progress, setProgress] = useState<Map<string, AchievementProgress>>(new Map());
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAchievements();
  }, [filter]);

  const loadAchievements = async () => {
    setLoading(true);
    try {
      await achievementService.initialize();

      let loadedAchievements: Achievement[] = [];
      if (filter === 'ALL') {
        loadedAchievements = achievementService.getAllAchievements();
      } else {
        loadedAchievements = achievementService.getAchievementsByCategory(filter);
      }

      setAchievements(loadedAchievements);

      // Load progress for all achievements
      const progressMap = new Map<string, AchievementProgress>();
      loadedAchievements.forEach((achievement) => {
        const prog = achievementService.getProgress(achievement.id);
        progressMap.set(achievement.id, prog);
      });
      setProgress(progressMap);

      // Load stats
      const achievementStats = achievementService.getStats();
      setStats(achievementStats);
    } catch (error) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAchievements();
    setRefreshing(false);
  };

  const getRarityColor = (rarity: AchievementRarity): string => {
    switch (rarity) {
      case AchievementRarity.LEGENDARY:
        return '#FFD700';
      case AchievementRarity.EPIC:
        return '#9333EA';
      case AchievementRarity.RARE:
        return '#3B82F6';
      case AchievementRarity.COMMON:
        return '#6B7280';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getCategoryIcon = (category: AchievementCategory): string => {
    switch (category) {
      case AchievementCategory.GAMES:
        return '🎮';
      case AchievementCategory.WINS:
        return '🏆';
      case AchievementCategory.SPEED:
        return '⚡';
      case AchievementCategory.STREAK:
        return '🔥';
      case AchievementCategory.EARNINGS:
        return '💰';
      case AchievementCategory.SOCIAL:
        return '👥';
      case AchievementCategory.SPECIAL:
        return '⭐';
      default:
        return '🎯';
    }
  };

  const renderAchievement = ({ item }: { item: Achievement }) => {
    const prog = progress.get(item.id);
    const isUnlocked = prog?.unlocked || false;
    const currentProgress = prog?.progress || 0;
    const progressPercentage = Math.min((currentProgress / item.requirement) * 100, 100);
    const rarityColor = getRarityColor(item.rarity);

    return (
      <View
        style={[
          styles(theme).achievementCard,
          {
            backgroundColor: theme.colors.surface,
            borderLeftColor: rarityColor,
            borderLeftWidth: 4,
            opacity: isUnlocked ? 1 : 0.7,
          },
        ]}
      >
        {/* Left: Icon */}
        <View style={styles(theme).achievementIcon}>
          <Text style={styles(theme).iconText}>{item.icon}</Text>
          {isUnlocked && (
            <View
              style={[styles(theme).unlockedBadge, { backgroundColor: theme.colors.success }]}
            >
              <Text style={styles(theme).unlockedText}>✓</Text>
            </View>
          )}
        </View>

        {/* Middle: Info */}
        <View style={styles(theme).achievementInfo}>
          <Text style={[styles(theme).achievementTitle, { color: theme.colors.text }]}>
            {item.title}
          </Text>
          <Text
            style={[styles(theme).achievementDescription, { color: theme.colors.textSecondary }]}
          >
            {item.description}
          </Text>

          {/* Progress Bar */}
          {!isUnlocked && (
            <View style={styles(theme).progressContainer}>
              <View
                style={[styles(theme).progressBar, { backgroundColor: theme.colors.border }]}
              >
                <LinearGradient
                  colors={[rarityColor, rarityColor + '80']}
                  style={[styles(theme).progressFill, { width: `${progressPercentage}%` }]}
                />
              </View>
              <Text
                style={[styles(theme).progressText, { color: theme.colors.textSecondary }]}
              >
                {currentProgress} / {item.requirement}
              </Text>
            </View>
          )}

          {/* Unlocked Date */}
          {isUnlocked && prog?.unlockedAt && (
            <Text style={[styles(theme).unlockedDate, { color: theme.colors.success }]}>
              Unlocked {new Date(prog.unlockedAt).toLocaleDateString()}
            </Text>
          )}

          {/* Rewards */}
          <View style={styles(theme).rewards}>
            {item.rewardGems && (
              <View style={styles(theme).rewardBadge}>
                <Text style={styles(theme).rewardText}>💎 {item.rewardGems}</Text>
              </View>
            )}
            {item.rewardCoins && (
              <View style={styles(theme).rewardBadge}>
                <Text style={styles(theme).rewardText}>🪙 {item.rewardCoins}</Text>
              </View>
            )}
            <View
              style={[
                styles(theme).rarityBadge,
                { backgroundColor: rarityColor + '30', borderColor: rarityColor },
              ]}
            >
              <Text style={[styles(theme).rarityText, { color: rarityColor }]}>
                {item.rarity}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles(theme).header}
      >
        <Text style={styles(theme).headerTitle}>🏆 Achievements</Text>
        {stats && (
          <View style={styles(theme).headerStats}>
            <View style={styles(theme).statBox}>
              <Text style={styles(theme).statValue}>
                {stats.unlocked}/{stats.total}
              </Text>
              <Text style={styles(theme).statLabel}>Unlocked</Text>
            </View>
            <View style={styles(theme).statBox}>
              <Text style={styles(theme).statValue}>{stats.percentage}%</Text>
              <Text style={styles(theme).statLabel}>Complete</Text>
            </View>
          </View>
        )}

        {/* Overall Progress Bar */}
        {stats && (
          <View style={styles(theme).overallProgressBar}>
            <LinearGradient
              colors={['#FFD700', '#FFA500']}
              style={[
                styles(theme).overallProgressFill,
                { width: `${stats.percentage}%` },
              ]}
            />
          </View>
        )}
      </LinearGradient>

      {/* Category Filter */}
      <View style={styles(theme).filters}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(['ALL', ...Object.values(AchievementCategory)] as FilterType[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles(theme).filterChip,
                {
                  backgroundColor:
                    filter === f ? theme.colors.primary : theme.colors.surface,
                },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles(theme).filterText,
                  {
                    color: filter === f ? '#FFFFFF' : theme.colors.text,
                  },
                ]}
              >
                {f === 'ALL' ? '🎯 All' : `${getCategoryIcon(f)} ${f}`}
              </Text>
              {stats && f !== 'ALL' && stats.byCategory[f] && (
                <View
                  style={[
                    styles(theme).filterBadge,
                    {
                      backgroundColor:
                        filter === f ? '#FFFFFF30' : theme.colors.primary + '30',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles(theme).filterBadgeText,
                      {
                        color: filter === f ? '#FFFFFF' : theme.colors.primary,
                      },
                    ]}
                  >
                    {stats.byCategory[f].unlocked}/{stats.byCategory[f].total}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Achievements List */}
      <FlatList
        data={achievements}
        renderItem={renderAchievement}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles(theme).list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles(theme).emptyState}>
              <Text style={[styles(theme).emptyText, { color: theme.colors.textSecondary }]}>
                No achievements in this category
              </Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      padding: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
    },
    headerTitle: {
      ...theme.typography.h1,
      color: '#FFFFFF',
      fontSize: 28,
      textAlign: 'center',
      marginBottom: theme.spacing.md,
    },
    headerStats: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: theme.spacing.xl,
      marginBottom: theme.spacing.md,
    },
    statBox: {
      alignItems: 'center',
    },
    statValue: {
      ...theme.typography.h2,
      color: '#FFFFFF',
      fontSize: 32,
      fontWeight: 'bold',
    },
    statLabel: {
      ...theme.typography.caption,
      color: 'rgba(255,255,255,0.9)',
      fontSize: 12,
    },
    overallProgressBar: {
      height: 8,
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderRadius: 4,
      overflow: 'hidden',
    },
    overallProgressFill: {
      height: '100%',
      borderRadius: 4,
    },
    filters: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.full,
      marginRight: theme.spacing.sm,
      gap: theme.spacing.xs,
    },
    filterText: {
      ...theme.typography.body,
      fontSize: 13,
      fontWeight: '600',
    },
    filterBadge: {
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: 10,
    },
    filterBadgeText: {
      fontSize: 10,
      fontWeight: '700',
    },
    list: {
      padding: theme.spacing.md,
    },
    achievementCard: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing.md,
    },
    achievementIcon: {
      position: 'relative',
      marginRight: theme.spacing.md,
    },
    iconText: {
      fontSize: 48,
    },
    unlockedBadge: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unlockedText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    achievementInfo: {
      flex: 1,
    },
    achievementTitle: {
      ...theme.typography.bodyBold,
      fontSize: 16,
      marginBottom: 4,
    },
    achievementDescription: {
      ...theme.typography.body,
      fontSize: 13,
      marginBottom: theme.spacing.sm,
    },
    progressContainer: {
      marginBottom: theme.spacing.sm,
    },
    progressBar: {
      height: 6,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    progressText: {
      ...theme.typography.caption,
      fontSize: 11,
    },
    unlockedDate: {
      ...theme.typography.caption,
      fontSize: 11,
      marginBottom: theme.spacing.sm,
      fontWeight: '600',
    },
    rewards: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
      flexWrap: 'wrap',
    },
    rewardBadge: {
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 4,
      backgroundColor: theme.colors.border + '50',
    },
    rewardText: {
      fontSize: 11,
      fontWeight: '600',
    },
    rarityBadge: {
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 4,
      borderWidth: 1,
    },
    rarityText: {
      fontSize: 10,
      fontWeight: '700',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xxxl,
    },
    emptyText: {
      ...theme.typography.body,
      textAlign: 'center',
    },
  });
