import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '../../store/theme.store';
import {
  seasonsService,
  Season,
  PlayerSeasonProgress,
  Reward,
  BattlePassTier,
} from '../../services/seasons.service';

type TabType = 'rewards' | 'challenges' | 'leaderboard';

export default function SeasonsScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const [season, setSeason] = useState<Season | null>(null);
  const [progress, setProgress] = useState<PlayerSeasonProgress | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('rewards');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSeasonData();
  }, []);

  const loadSeasonData = async () => {
    setLoading(true);
    try {
      await seasonsService.initialize();
      const currentSeason = seasonsService.getCurrentSeason();
      const playerProgress = seasonsService.getPlayerProgress();

      setSeason(currentSeason);
      setProgress(playerProgress);
    } catch (error) {
      console.error('Failed to load season data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await seasonsService.refresh();
    await loadSeasonData();
    setRefreshing(false);
  };

  const handlePurchasePremium = async () => {
    if (!season) return;

    Alert.alert(
      'Purchase Premium Pass',
      `Unlock all premium rewards and ${season.battlePass.xpBoostMultiplier}x XP boost for $${(season.battlePass.premiumPrice / 100).toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Purchase',
          onPress: async () => {
            const success = await seasonsService.purchasePremiumPass();
            if (success) {
              await loadSeasonData();
            }
          },
        },
      ]
    );
  };

  const handleSkipTier = async () => {
    if (!season) return;

    Alert.alert(
      'Skip Tier',
      `Skip to next tier for $${(season.battlePass.tierSkipPrice / 100).toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            const success = await seasonsService.skipTier();
            if (success) {
              await loadSeasonData();
            }
          },
        },
      ]
    );
  };

  const getRarityColor = (rarity: Reward['rarity']): string => {
    switch (rarity) {
      case 'LEGENDARY':
        return '#FFD700';
      case 'EPIC':
        return '#9333EA';
      case 'RARE':
        return '#3B82F6';
      case 'COMMON':
        return '#6B7280';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getRewardIcon = (type: Reward['type']): string => {
    switch (type) {
      case 'GEMS':
        return '💎';
      case 'COINS':
        return '🪙';
      case 'AVATAR':
        return '👤';
      case 'CARD_BACK':
        return '🎴';
      case 'EMOTE':
        return '😊';
      case 'TITLE':
        return '🏅';
      case 'XP_BOOST':
        return '⚡';
      default:
        return '🎁';
    }
  };

  const renderReward = (reward: Reward, isPremium: boolean, isLocked: boolean) => {
    const isClaimed = progress?.claimedRewards.includes(reward.id);

    return (
      <View
        key={reward.id}
        style={[
          styles(theme).rewardCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: getRarityColor(reward.rarity),
            borderWidth: 2,
            opacity: isLocked ? 0.5 : 1,
          },
        ]}
      >
        {isPremium && (
          <View style={[styles(theme).premiumBadge, { backgroundColor: theme.colors.warning }]}>
            <Text style={styles(theme).premiumBadgeText}>PREMIUM</Text>
          </View>
        )}

        {reward.imageUrl ? (
          <Image source={{ uri: reward.imageUrl }} style={styles(theme).rewardImage} />
        ) : (
          <Text style={styles(theme).rewardIcon}>{getRewardIcon(reward.type)}</Text>
        )}

        <Text
          style={[styles(theme).rewardName, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {reward.name}
        </Text>

        <View
          style={[
            styles(theme).rarityBadge,
            { backgroundColor: getRarityColor(reward.rarity) + '30' },
          ]}
        >
          <Text style={[styles(theme).rarityText, { color: getRarityColor(reward.rarity) }]}>
            {reward.rarity}
          </Text>
        </View>

        {isClaimed && (
          <View style={[styles(theme).claimedBadge, { backgroundColor: theme.colors.success }]}>
            <Text style={styles(theme).claimedText}>✓ Claimed</Text>
          </View>
        )}

        {isLocked && (
          <View style={styles(theme).lockedOverlay}>
            <Text style={styles(theme).lockedIcon}>🔒</Text>
          </View>
        )}
      </View>
    );
  };

  const renderTierRow = (tier: number) => {
    if (!season || !progress) return null;

    const isUnlocked = tier <= progress.currentTier;
    const isCurrent = tier === progress.currentTier;

    const freeTier = season.battlePass.freeTiers.find((t) => t.tier === tier);
    const premiumTier = season.battlePass.premiumTiers.find((t) => t.tier === tier);

    return (
      <View key={tier} style={styles(theme).tierRow}>
        {/* Tier Number */}
        <View
          style={[
            styles(theme).tierBadge,
            {
              backgroundColor: isCurrent
                ? theme.colors.primary
                : isUnlocked
                ? theme.colors.success
                : theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles(theme).tierNumber,
              { color: isUnlocked ? '#FFFFFF' : theme.colors.textSecondary },
            ]}
          >
            {tier}
          </Text>
        </View>

        {/* Free Rewards */}
        <View style={styles(theme).tierRewards}>
          {freeTier?.rewards.map((reward) => renderReward(reward, false, !isUnlocked))}
        </View>

        {/* Premium Rewards */}
        <View style={styles(theme).tierRewards}>
          {premiumTier?.rewards.map((reward) =>
            renderReward(reward, true, !isUnlocked || !progress.hasPremiumPass)
          )}
        </View>
      </View>
    );
  };

  const renderRewardsTab = () => {
    if (!season || !progress) return null;

    const tiers = Array.from({ length: season.battlePass.maxTier + 1 }, (_, i) => i);

    return (
      <View style={styles(theme).rewardsContainer}>
        {/* Track Labels */}
        <View style={styles(theme).trackLabels}>
          <View style={styles(theme).tierBadge} />
          <View style={[styles(theme).trackLabel, { flex: 1 }]}>
            <Text style={[styles(theme).trackLabelText, { color: theme.colors.text }]}>
              Free Track
            </Text>
          </View>
          <View style={[styles(theme).trackLabel, { flex: 1 }]}>
            <LinearGradient
              colors={[theme.colors.warning, theme.colors.primary]}
              style={styles(theme).premiumTrackLabel}
            >
              <Text style={styles(theme).premiumTrackText}>Premium Track ⭐</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Tiers List */}
        <FlatList
          data={tiers}
          renderItem={({ item }) => renderTierRow(item)}
          keyExtractor={(item) => item.toString()}
          contentContainerStyle={styles(theme).tiersList}
        />
      </View>
    );
  };

  const renderChallengesTab = () => {
    if (!season) return null;

    return (
      <ScrollView contentContainerStyle={styles(theme).challengesContainer}>
        <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>
          Season Events
        </Text>
        {season.specialEvents.map((event) => (
          <View
            key={event.id}
            style={[styles(theme).eventCard, { backgroundColor: theme.colors.surface }]}
          >
            <Text style={[styles(theme).eventName, { color: theme.colors.text }]}>
              {event.name}
            </Text>
            <Text style={[styles(theme).eventDescription, { color: theme.colors.textSecondary }]}>
              {event.description}
            </Text>
            <View style={styles(theme).eventDates}>
              <Text style={[styles(theme).eventDate, { color: theme.colors.textSecondary }]}>
                {new Date(event.startDate).toLocaleDateString()} -{' '}
                {new Date(event.endDate).toLocaleDateString()}
              </Text>
            </View>
            {event.rewards && event.rewards.length > 0 && (
              <View style={styles(theme).eventRewards}>
                {event.rewards.map((reward) => (
                  <Text key={reward.id} style={{ fontSize: 20 }}>
                    {getRewardIcon(reward.type)}
                  </Text>
                ))}
              </View>
            )}
          </View>
        ))}

        <Text
          style={[styles(theme).sectionTitle, { color: theme.colors.text, marginTop: theme.spacing.xl }]}
        >
          Exclusive Rewards
        </Text>
        {season.exclusiveRewards.map((reward) => (
          <View
            key={reward.id}
            style={[styles(theme).exclusiveCard, { backgroundColor: theme.colors.surface }]}
          >
            <Text style={{ fontSize: 32 }}>{getRewardIcon(reward.type)}</Text>
            <View style={styles(theme).exclusiveInfo}>
              <Text style={[styles(theme).exclusiveName, { color: theme.colors.text }]}>
                {reward.name}
              </Text>
              <Text
                style={[styles(theme).exclusiveCondition, { color: theme.colors.textSecondary }]}
              >
                {reward.unlockCondition}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    );
  };

  const renderLeaderboardTab = () => {
    return (
      <View style={styles(theme).leaderboardContainer}>
        <Text style={[styles(theme).emptyText, { color: theme.colors.textSecondary }]}>
          Season leaderboard coming soon...
        </Text>
      </View>
    );
  };

  if (loading || !season || !progress) {
    return (
      <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles(theme).loadingText, { color: theme.colors.textSecondary }]}>
          Loading season...
        </Text>
      </View>
    );
  }

  const daysRemaining = seasonsService.getDaysRemaining();
  const xpToNextTier = seasonsService.getXPToNextTier();
  const progressPercentage = seasonsService.getProgressPercentage();
  const hasPremium = seasonsService.hasPremiumPass();

  return (
    <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles(theme).header}
      >
        <Text style={styles(theme).seasonName}>{season.name}</Text>
        <Text style={styles(theme).seasonTheme}>{season.theme}</Text>
        <Text style={styles(theme).seasonDays}>{daysRemaining} days remaining</Text>
      </LinearGradient>

      {/* Current Progress */}
      <View style={[styles(theme).progressSection, { backgroundColor: theme.colors.surface }]}>
        <View style={styles(theme).progressHeader}>
          <View style={styles(theme).tierInfo}>
            <Text style={[styles(theme).currentTierLabel, { color: theme.colors.textSecondary }]}>
              Current Tier
            </Text>
            <Text style={[styles(theme).currentTier, { color: theme.colors.text }]}>
              {progress.currentTier}
            </Text>
          </View>

          <View style={styles(theme).xpInfo}>
            <Text style={[styles(theme).xpLabel, { color: theme.colors.textSecondary }]}>
              XP to next tier
            </Text>
            <Text style={[styles(theme).xpValue, { color: theme.colors.text }]}>
              {xpToNextTier} XP
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[styles(theme).progressBar, { backgroundColor: theme.colors.border }]}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.success]}
            style={[styles(theme).progressFill, { width: `${progressPercentage}%` }]}
          />
        </View>

        {/* Stats */}
        <View style={styles(theme).stats}>
          <View style={styles(theme).statItem}>
            <Text style={[styles(theme).statValue, { color: theme.colors.text }]}>
              {progress.gamesPlayed}
            </Text>
            <Text style={[styles(theme).statLabel, { color: theme.colors.textSecondary }]}>
              Games
            </Text>
          </View>
          <View style={styles(theme).statItem}>
            <Text style={[styles(theme).statValue, { color: theme.colors.text }]}>
              {progress.wins}
            </Text>
            <Text style={[styles(theme).statLabel, { color: theme.colors.textSecondary }]}>
              Wins
            </Text>
          </View>
          <View style={styles(theme).statItem}>
            <Text style={[styles(theme).statValue, { color: theme.colors.text }]}>
              {progress.challengesCompleted}
            </Text>
            <Text style={[styles(theme).statLabel, { color: theme.colors.textSecondary }]}>
              Challenges
            </Text>
          </View>
        </View>
      </View>

      {/* Premium CTA */}
      {!hasPremium && (
        <TouchableOpacity
          style={[styles(theme).premiumCta]}
          onPress={handlePurchasePremium}
        >
          <LinearGradient
            colors={[theme.colors.warning, theme.colors.primary]}
            style={styles(theme).premiumCtaGradient}
          >
            <View style={styles(theme).premiumCtaContent}>
              <Text style={styles(theme).premiumCtaTitle}>⭐ Upgrade to Premium</Text>
              <Text style={styles(theme).premiumCtaSubtitle}>
                Unlock all rewards + {season.battlePass.xpBoostMultiplier}x XP boost
              </Text>
            </View>
            <Text style={styles(theme).premiumCtaPrice}>
              ${(season.battlePass.premiumPrice / 100).toFixed(2)}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={styles(theme).tabs}>
        {(['rewards', 'challenges', 'leaderboard'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles(theme).tab,
              activeTab === tab && styles(theme).tabActive,
              {
                backgroundColor: activeTab === tab ? theme.colors.primary : 'transparent',
              },
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles(theme).tabText,
                {
                  color: activeTab === tab ? '#FFFFFF' : theme.colors.textSecondary,
                },
              ]}
            >
              {tab === 'rewards' && 'Rewards'}
              {tab === 'challenges' && 'Challenges'}
              {tab === 'leaderboard' && 'Leaderboard'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles(theme).tabContent}>
        {activeTab === 'rewards' && renderRewardsTab()}
        {activeTab === 'challenges' && renderChallengesTab()}
        {activeTab === 'leaderboard' && renderLeaderboardTab()}
      </View>

      {/* Quick Actions */}
      {hasPremium && progress.currentTier < season.battlePass.maxTier && (
        <View style={[styles(theme).bottomActions, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            style={[styles(theme).skipTierButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleSkipTier}
          >
            <Text style={styles(theme).skipTierText}>
              Skip Tier - ${(season.battlePass.tierSkipPrice / 100).toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}
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
      alignItems: 'center',
    },
    seasonName: {
      ...theme.typography.h1,
      color: '#FFFFFF',
      marginBottom: 4,
    },
    seasonTheme: {
      ...theme.typography.body,
      color: 'rgba(255,255,255,0.9)',
      marginBottom: theme.spacing.sm,
    },
    seasonDays: {
      ...theme.typography.caption,
      color: 'rgba(255,255,255,0.8)',
      fontSize: 12,
    },
    progressSection: {
      padding: theme.spacing.lg,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.md,
    },
    tierInfo: {
      alignItems: 'center',
    },
    currentTierLabel: {
      ...theme.typography.caption,
      fontSize: 12,
      marginBottom: 4,
    },
    currentTier: {
      ...theme.typography.h1,
      fontSize: 32,
    },
    xpInfo: {
      alignItems: 'flex-end',
    },
    xpLabel: {
      ...theme.typography.caption,
      fontSize: 12,
      marginBottom: 4,
    },
    xpValue: {
      ...theme.typography.bodyBold,
      fontSize: 18,
    },
    progressBar: {
      height: 12,
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: theme.spacing.lg,
    },
    progressFill: {
      height: '100%',
      borderRadius: 6,
    },
    stats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      ...theme.typography.h2,
      fontSize: 24,
      marginBottom: 4,
    },
    statLabel: {
      ...theme.typography.caption,
      fontSize: 12,
    },
    premiumCta: {
      marginHorizontal: theme.spacing.lg,
      marginVertical: theme.spacing.md,
      borderRadius: theme.radius.xl,
      overflow: 'hidden',
    },
    premiumCtaGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: theme.spacing.lg,
    },
    premiumCtaContent: {
      flex: 1,
    },
    premiumCtaTitle: {
      ...theme.typography.h3,
      color: '#FFFFFF',
      fontSize: 18,
      marginBottom: 4,
    },
    premiumCtaSubtitle: {
      ...theme.typography.body,
      color: 'rgba(255,255,255,0.9)',
      fontSize: 13,
    },
    premiumCtaPrice: {
      ...theme.typography.h2,
      color: '#FFFFFF',
      fontSize: 24,
    },
    tabs: {
      flexDirection: 'row',
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    tab: {
      flex: 1,
      paddingVertical: theme.spacing.sm,
      alignItems: 'center',
      borderRadius: theme.radius.md,
    },
    tabActive: {},
    tabText: {
      ...theme.typography.bodyBold,
      fontSize: 14,
    },
    tabContent: {
      flex: 1,
    },
    rewardsContainer: {
      flex: 1,
    },
    trackLabels: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    trackLabel: {
      alignItems: 'center',
    },
    trackLabelText: {
      ...theme.typography.bodyBold,
      fontSize: 13,
    },
    premiumTrackLabel: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.md,
    },
    premiumTrackText: {
      ...theme.typography.bodyBold,
      fontSize: 13,
      color: '#FFFFFF',
    },
    tiersList: {
      padding: theme.spacing.md,
    },
    tierRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    tierBadge: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tierNumber: {
      ...theme.typography.h3,
      fontSize: 18,
    },
    tierRewards: {
      flex: 1,
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    rewardCard: {
      width: 80,
      padding: theme.spacing.sm,
      borderRadius: theme.radius.md,
      alignItems: 'center',
    },
    premiumBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      paddingVertical: 2,
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    premiumBadgeText: {
      color: '#FFFFFF',
      fontSize: 8,
      fontWeight: '700',
    },
    rewardImage: {
      width: 48,
      height: 48,
      marginBottom: theme.spacing.xs,
    },
    rewardIcon: {
      fontSize: 32,
      marginBottom: theme.spacing.xs,
    },
    rewardName: {
      ...theme.typography.caption,
      fontSize: 10,
      textAlign: 'center',
      marginBottom: theme.spacing.xs,
    },
    rarityBadge: {
      paddingVertical: 2,
      paddingHorizontal: 4,
      borderRadius: 4,
    },
    rarityText: {
      fontSize: 8,
      fontWeight: '700',
    },
    claimedBadge: {
      position: 'absolute',
      bottom: 2,
      left: 2,
      right: 2,
      paddingVertical: 2,
      borderRadius: 4,
    },
    claimedText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '700',
      textAlign: 'center',
    },
    lockedOverlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: theme.radius.md,
    },
    lockedIcon: {
      fontSize: 24,
    },
    challengesContainer: {
      padding: theme.spacing.lg,
    },
    sectionTitle: {
      ...theme.typography.h2,
      fontSize: 18,
      marginBottom: theme.spacing.md,
    },
    eventCard: {
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing.md,
    },
    eventName: {
      ...theme.typography.bodyBold,
      fontSize: 16,
      marginBottom: theme.spacing.sm,
    },
    eventDescription: {
      ...theme.typography.body,
      fontSize: 14,
      marginBottom: theme.spacing.sm,
    },
    eventDates: {
      marginBottom: theme.spacing.sm,
    },
    eventDate: {
      ...theme.typography.caption,
      fontSize: 12,
    },
    eventRewards: {
      flexDirection: 'row',
      gap: theme.spacing.xs,
    },
    exclusiveCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      marginBottom: theme.spacing.md,
    },
    exclusiveInfo: {
      flex: 1,
      marginLeft: theme.spacing.md,
    },
    exclusiveName: {
      ...theme.typography.bodyBold,
      fontSize: 15,
      marginBottom: 4,
    },
    exclusiveCondition: {
      ...theme.typography.caption,
      fontSize: 12,
    },
    leaderboardContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bottomActions: {
      padding: theme.spacing.md,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    skipTierButton: {
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
    },
    skipTierText: {
      color: '#FFFFFF',
      ...theme.typography.bodyBold,
      fontSize: 15,
    },
    emptyText: {
      ...theme.typography.body,
      textAlign: 'center',
    },
    loadingText: {
      ...theme.typography.body,
      textAlign: 'center',
      marginTop: theme.spacing.xxxl,
    },
  });
