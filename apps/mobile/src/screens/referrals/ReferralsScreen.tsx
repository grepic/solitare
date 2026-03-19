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
  referralService,
  ReferralStats,
  REFERRAL_REWARDS,
} from '../../services/referral.service';

export default function ReferralsScreen({ navigation }: any) {
  const { theme } = useThemeStore();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<string>('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [nextMilestone, setNextMilestone] = useState<any>(null);
  const [faq, setFaq] = useState<{ question: string; answer: string }[]>([]);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    setLoading(true);
    try {
      await referralService.initialize();

      const code = referralService.getReferralCode();
      setReferralCode(code);

      const link = referralService.getReferralLink();
      setReferralLink(link);

      const referralStats = referralService.getStats();
      setStats(referralStats);

      const milestone = referralService.getNextMilestone();
      setNextMilestone(milestone);

      const faqData = referralService.getFAQ();
      setFaq(faqData);
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await referralService.refreshStats();
    await loadReferralData();
    setRefreshing(false);
  };

  const handleShare = async () => {
    await referralService.shareReferralCode();
  };

  const handleCopy = async () => {
    await referralService.copyToClipboard();
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  if (loading) {
    return (
      <View style={[styles(theme).container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles(theme).loadingText, { color: theme.colors.textSecondary }]}>
          Loading referral data...
        </Text>
      </View>
    );
  }

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
        <Text style={styles(theme).headerTitle}>🎁 Refer Friends</Text>
        <Text style={styles(theme).headerSubtitle}>
          Share your code and earn rewards together!
        </Text>
      </LinearGradient>

      {/* Referral Code Card */}
      <View style={[styles(theme).codeCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles(theme).codeLabel, { color: theme.colors.textSecondary }]}>
          Your Referral Code
        </Text>
        <View style={[styles(theme).codeBox, { borderColor: theme.colors.primary }]}>
          <Text style={[styles(theme).codeText, { color: theme.colors.primary }]}>
            {referralCode || 'Loading...'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles(theme).actions}>
          <TouchableOpacity
            style={[styles(theme).shareButton, { backgroundColor: theme.colors.primary }]}
            onPress={handleShare}
          >
            <Text style={styles(theme).shareButtonText}>📤 Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles(theme).copyButton, { borderColor: theme.colors.primary }]}
            onPress={handleCopy}
          >
            <Text style={[styles(theme).copyButtonText, { color: theme.colors.primary }]}>
              📋 Copy
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles(theme).linkText, { color: theme.colors.textSecondary }]}>
          {referralLink}
        </Text>
      </View>

      {/* Stats Card */}
      {stats && (
        <View style={[styles(theme).statsCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>
            📊 Your Stats
          </Text>

          <View style={styles(theme).statsGrid}>
            <View style={styles(theme).statBox}>
              <Text style={[styles(theme).statValue, { color: theme.colors.text }]}>
                {stats.successfulReferrals}
              </Text>
              <Text style={[styles(theme).statLabel, { color: theme.colors.textSecondary }]}>
                Successful
              </Text>
            </View>

            <View style={styles(theme).statBox}>
              <Text style={[styles(theme).statValue, { color: theme.colors.warning }]}>
                {stats.pendingReferrals}
              </Text>
              <Text style={[styles(theme).statLabel, { color: theme.colors.textSecondary }]}>
                Pending
              </Text>
            </View>

            <View style={styles(theme).statBox}>
              <Text style={[styles(theme).statValue, { color: theme.colors.success }]}>
                {stats.totalEarnings}
              </Text>
              <Text style={[styles(theme).statLabel, { color: theme.colors.textSecondary }]}>
                Earned
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Next Milestone */}
      {nextMilestone && (
        <View style={[styles(theme).milestoneCard, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>
            🎯 Next Milestone
          </Text>

          <View style={styles(theme).milestoneInfo}>
            <Text style={[styles(theme).milestoneCount, { color: theme.colors.primary }]}>
              {nextMilestone.count} Referrals
            </Text>
            <View style={styles(theme).milestoneRewards}>
              <View style={styles(theme).milestoneReward}>
                <Text style={styles(theme).rewardIcon}>💎</Text>
                <Text style={[styles(theme).rewardValue, { color: theme.colors.text }]}>
                  {nextMilestone.gems}
                </Text>
              </View>
              <View style={styles(theme).milestoneReward}>
                <Text style={styles(theme).rewardIcon}>🪙</Text>
                <Text style={[styles(theme).rewardValue, { color: theme.colors.text }]}>
                  {nextMilestone.coins}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles(theme).progressBar, { backgroundColor: theme.colors.border }]}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.success]}
              style={[
                styles(theme).progressFill,
                { width: `${nextMilestone.progress}%` },
              ]}
            />
          </View>
          <Text style={[styles(theme).progressText, { color: theme.colors.textSecondary }]}>
            {stats?.successfulReferrals || 0} / {nextMilestone.count} ({nextMilestone.progress}%)
          </Text>
        </View>
      )}

      {/* All Milestones */}
      <View style={[styles(theme).milestonesCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>
          🏆 All Milestones
        </Text>

        {REFERRAL_REWARDS.MILESTONES.map((milestone, index) => {
          const isCompleted = (stats?.successfulReferrals || 0) >= milestone.count;
          const isCurrent = nextMilestone && nextMilestone.count === milestone.count;

          return (
            <View
              key={index}
              style={[
                styles(theme).milestoneRow,
                {
                  backgroundColor: isCompleted
                    ? theme.colors.success + '20'
                    : isCurrent
                    ? theme.colors.primary + '10'
                    : 'transparent',
                  borderColor: isCurrent ? theme.colors.primary : theme.colors.border,
                },
              ]}
            >
              <View style={styles(theme).milestoneLeft}>
                <Text
                  style={[
                    styles(theme).milestoneNumber,
                    { color: isCompleted ? theme.colors.success : theme.colors.text },
                  ]}
                >
                  {isCompleted ? '✓' : milestone.count}
                </Text>
                <Text
                  style={[
                    styles(theme).milestoneLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {milestone.count} referrals
                </Text>
              </View>

              <View style={styles(theme).milestoneRight}>
                <Text style={[styles(theme).milestoneRewardText, { color: theme.colors.text }]}>
                  💎 {milestone.gems} + 🪙 {milestone.coins}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Rewards Breakdown */}
      <View style={[styles(theme).rewardsCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>
          💰 Rewards Breakdown
        </Text>

        <View style={styles(theme).rewardBreakdown}>
          <View style={styles(theme).rewardRow}>
            <Text style={[styles(theme).rewardTitle, { color: theme.colors.text }]}>
              🎉 Friend Signs Up
            </Text>
            <Text style={[styles(theme).rewardAmount, { color: theme.colors.success }]}>
              💎 {REFERRAL_REWARDS.SIGN_UP.referrer.gems} + 🪙 {REFERRAL_REWARDS.SIGN_UP.referrer.coins}
            </Text>
          </View>

          <View style={styles(theme).rewardRow}>
            <Text style={[styles(theme).rewardTitle, { color: theme.colors.text }]}>
              💳 Friend Makes First Deposit
            </Text>
            <Text style={[styles(theme).rewardAmount, { color: theme.colors.success }]}>
              💎 {REFERRAL_REWARDS.FIRST_DEPOSIT.referrer.gems} + 🪙 {REFERRAL_REWARDS.FIRST_DEPOSIT.referrer.coins}
            </Text>
          </View>

          <View style={styles(theme).rewardRow}>
            <Text style={[styles(theme).rewardTitle, { color: theme.colors.text }]}>
              🎮 Friend Plays First Game
            </Text>
            <Text style={[styles(theme).rewardAmount, { color: theme.colors.success }]}>
              💎 {REFERRAL_REWARDS.FIRST_GAME.referrer.gems} + 🪙 {REFERRAL_REWARDS.FIRST_GAME.referrer.coins}
            </Text>
          </View>
        </View>
      </View>

      {/* FAQ */}
      <View style={[styles(theme).faqCard, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>
          ❓ Frequently Asked Questions
        </Text>

        {faq.map((item, index) => (
          <View key={index} style={styles(theme).faqItem}>
            <TouchableOpacity
              style={styles(theme).faqQuestion}
              onPress={() => toggleFAQ(index)}
            >
              <Text style={[styles(theme).faqQuestionText, { color: theme.colors.text }]}>
                {item.question}
              </Text>
              <Text style={[styles(theme).faqIcon, { color: theme.colors.textSecondary }]}>
                {expandedFAQ === index ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {expandedFAQ === index && (
              <Text style={[styles(theme).faqAnswer, { color: theme.colors.textSecondary }]}>
                {item.answer}
              </Text>
            )}
          </View>
        ))}
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
    codeCard: {
      margin: theme.spacing.lg,
      padding: theme.spacing.xl,
      borderRadius: theme.radius.xl,
      alignItems: 'center',
    },
    codeLabel: {
      ...theme.typography.caption,
      fontSize: 12,
      marginBottom: theme.spacing.sm,
      textTransform: 'uppercase',
    },
    codeBox: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    codeText: {
      ...theme.typography.h1,
      fontSize: 32,
      fontWeight: 'bold',
      letterSpacing: 4,
    },
    actions: {
      flexDirection: 'row',
      gap: theme.spacing.md,
      width: '100%',
      marginBottom: theme.spacing.md,
    },
    shareButton: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
    },
    shareButtonText: {
      color: '#FFFFFF',
      ...theme.typography.bodyBold,
      fontSize: 16,
    },
    copyButton: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
      borderWidth: 2,
    },
    copyButtonText: {
      ...theme.typography.bodyBold,
      fontSize: 16,
    },
    linkText: {
      ...theme.typography.caption,
      fontSize: 11,
      textAlign: 'center',
    },
    statsCard: {
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
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statBox: {
      alignItems: 'center',
    },
    statValue: {
      ...theme.typography.h2,
      fontSize: 32,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    statLabel: {
      ...theme.typography.caption,
      fontSize: 12,
    },
    milestoneCard: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.xl,
      borderRadius: theme.radius.xl,
    },
    milestoneInfo: {
      alignItems: 'center',
      marginBottom: theme.spacing.md,
    },
    milestoneCount: {
      ...theme.typography.h2,
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: theme.spacing.sm,
    },
    milestoneRewards: {
      flexDirection: 'row',
      gap: theme.spacing.xl,
    },
    milestoneReward: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    rewardIcon: {
      fontSize: 20,
    },
    rewardValue: {
      ...theme.typography.bodyBold,
      fontSize: 18,
    },
    progressBar: {
      height: 12,
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: theme.spacing.sm,
    },
    progressFill: {
      height: '100%',
      borderRadius: 6,
    },
    progressText: {
      ...theme.typography.caption,
      fontSize: 12,
      textAlign: 'center',
    },
    milestonesCard: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.xl,
      borderRadius: theme.radius.xl,
    },
    milestoneRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      marginBottom: theme.spacing.sm,
    },
    milestoneLeft: {
      alignItems: 'center',
    },
    milestoneNumber: {
      ...theme.typography.h3,
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 2,
    },
    milestoneLabel: {
      ...theme.typography.caption,
      fontSize: 11,
    },
    milestoneRight: {},
    milestoneRewardText: {
      ...theme.typography.bodyBold,
      fontSize: 14,
    },
    rewardsCard: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
      padding: theme.spacing.xl,
      borderRadius: theme.radius.xl,
    },
    rewardBreakdown: {
      gap: theme.spacing.md,
    },
    rewardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      backgroundColor: theme.colors.border + '30',
      borderRadius: theme.radius.md,
    },
    rewardTitle: {
      ...theme.typography.body,
      fontSize: 14,
      flex: 1,
    },
    rewardAmount: {
      ...theme.typography.bodyBold,
      fontSize: 13,
    },
    faqCard: {
      marginHorizontal: theme.spacing.lg,
      padding: theme.spacing.xl,
      borderRadius: theme.radius.xl,
    },
    faqItem: {
      marginBottom: theme.spacing.md,
    },
    faqQuestion: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    faqQuestionText: {
      ...theme.typography.bodyBold,
      fontSize: 14,
      flex: 1,
    },
    faqIcon: {
      fontSize: 12,
      marginLeft: theme.spacing.sm,
    },
    faqAnswer: {
      ...theme.typography.body,
      fontSize: 13,
      lineHeight: 20,
      paddingTop: theme.spacing.sm,
    },
    loadingText: {
      ...theme.typography.body,
      textAlign: 'center',
      marginTop: theme.spacing.xxxl,
    },
  });
