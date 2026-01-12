/**
 * Seasons & Battle Pass Service
 *
 * Manages seasonal content, battle pass progression, and rewards.
 * Integrates with daily challenges and achievements.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { analyticsService } from './analytics.service';
import { notificationService } from './notification.service';

export interface Season {
  id: string;
  name: string;
  theme: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED';

  // Battle Pass
  battlePass: BattlePass;

  // Season-specific content
  exclusiveRewards: SeasonReward[];
  specialEvents: SeasonEvent[];

  // Metadata
  imageUrl?: string;
  bannerUrl?: string;
}

export interface BattlePass {
  id: string;
  seasonId: string;
  maxTier: number;

  // Tracks
  freeTiers: BattlePassTier[];
  premiumTiers: BattlePassTier[];

  // Pricing
  premiumPrice: number; // In cents
  tierSkipPrice: number; // Price to skip one tier

  // XP requirements
  xpPerTier: number;
  xpBoostMultiplier: number; // For premium users
}

export interface BattlePassTier {
  tier: number;
  xpRequired: number;
  rewards: Reward[];
  isPremiumOnly: boolean;
}

export interface Reward {
  id: string;
  type: 'GEMS' | 'COINS' | 'AVATAR' | 'CARD_BACK' | 'EMOTE' | 'TITLE' | 'XP_BOOST';
  name: string;
  description: string;
  imageUrl?: string;
  value?: number; // For gems/coins
  itemId?: string; // For cosmetic items
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

export interface SeasonReward {
  id: string;
  name: string;
  description: string;
  type: Reward['type'];
  unlockCondition: string; // e.g., "Reach tier 50", "Complete all weekly challenges"
  imageUrl?: string;
}

export interface SeasonEvent {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  type: 'TOURNAMENT' | 'CHALLENGE' | 'BONUS_XP' | 'SPECIAL_GAME_MODE';
  rewards?: Reward[];
}

export interface PlayerSeasonProgress {
  seasonId: string;
  currentTier: number;
  currentXP: number;
  totalXP: number;
  hasPremiumPass: boolean;
  claimedRewards: string[]; // Reward IDs

  // Stats
  gamesPlayed: number;
  wins: number;
  challengesCompleted: number;

  // History
  joinedAt: Date;
  lastPlayedAt?: Date;
}

export interface XPSource {
  type: 'GAME_WIN' | 'GAME_COMPLETE' | 'DAILY_CHALLENGE' | 'WEEKLY_CHALLENGE' | 'ACHIEVEMENT' | 'EVENT';
  amount: number;
  multiplier?: number;
}

// XP Rewards for different actions
export const XP_REWARDS = {
  GAME_WIN: 100,
  GAME_LOSS: 50,
  DAILY_CHALLENGE: 500,
  WEEKLY_CHALLENGE: 2000,
  ACHIEVEMENT_COMMON: 100,
  ACHIEVEMENT_RARE: 250,
  ACHIEVEMENT_EPIC: 500,
  ACHIEVEMENT_LEGENDARY: 1000,
  FIRST_WIN_DAILY: 200,
  PLAY_WITH_FRIEND: 150,
  TOURNAMENT_PARTICIPATION: 300,
  TOURNAMENT_WIN: 1000,
};

class SeasonsService {
  private currentSeason: Season | null = null;
  private playerProgress: PlayerSeasonProgress | null = null;
  private loaded: boolean = false;

  /**
   * Initialize seasons service
   */
  async initialize(): Promise<void> {
    await this.loadCurrentSeason();
    await this.loadPlayerProgress();

    console.log('✅ Seasons service initialized');
  }

  /**
   * Load current active season
   */
  private async loadCurrentSeason(): Promise<void> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get('/seasons/current');
      this.currentSeason = response.data;
      */

      // Fallback: Load from storage
      const stored = await AsyncStorage.getItem('current_season');
      if (stored) {
        this.currentSeason = JSON.parse(stored);
      }

      this.loaded = true;
    } catch (error) {
      console.error('Failed to load current season:', error);
    }
  }

  /**
   * Save current season to storage
   */
  private async saveCurrentSeason(): Promise<void> {
    try {
      if (this.currentSeason) {
        await AsyncStorage.setItem('current_season', JSON.stringify(this.currentSeason));
      }
    } catch (error) {
      console.error('Failed to save current season:', error);
    }
  }

  /**
   * Load player progress for current season
   */
  private async loadPlayerProgress(): Promise<void> {
    try {
      if (!this.currentSeason) return;

      // TODO: Fetch from backend
      /* Example:
      const response = await api.get(`/seasons/${this.currentSeason.id}/progress`);
      this.playerProgress = response.data;
      */

      // Fallback: Load from storage
      const stored = await AsyncStorage.getItem(`season_progress_${this.currentSeason.id}`);
      if (stored) {
        this.playerProgress = JSON.parse(stored);
      } else {
        // Initialize new progress
        this.playerProgress = {
          seasonId: this.currentSeason.id,
          currentTier: 0,
          currentXP: 0,
          totalXP: 0,
          hasPremiumPass: false,
          claimedRewards: [],
          gamesPlayed: 0,
          wins: 0,
          challengesCompleted: 0,
          joinedAt: new Date(),
        };
        await this.savePlayerProgress();
      }
    } catch (error) {
      console.error('Failed to load player progress:', error);
    }
  }

  /**
   * Save player progress to storage
   */
  private async savePlayerProgress(): Promise<void> {
    try {
      if (this.playerProgress && this.currentSeason) {
        await AsyncStorage.setItem(
          `season_progress_${this.currentSeason.id}`,
          JSON.stringify(this.playerProgress)
        );
      }
    } catch (error) {
      console.error('Failed to save player progress:', error);
    }
  }

  /**
   * Get current season
   */
  getCurrentSeason(): Season | null {
    return this.currentSeason;
  }

  /**
   * Get player progress
   */
  getPlayerProgress(): PlayerSeasonProgress | null {
    return this.playerProgress;
  }

  /**
   * Get days remaining in season
   */
  getDaysRemaining(): number {
    if (!this.currentSeason) return 0;

    const now = new Date();
    const end = new Date(this.currentSeason.endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  /**
   * Check if player has premium pass
   */
  hasPremiumPass(): boolean {
    return this.playerProgress?.hasPremiumPass || false;
  }

  /**
   * Purchase premium battle pass
   */
  async purchasePremiumPass(): Promise<boolean> {
    try {
      if (!this.currentSeason || !this.playerProgress) {
        console.error('No active season or progress');
        return false;
      }

      if (this.playerProgress.hasPremiumPass) {
        console.error('Already has premium pass');
        return false;
      }

      // TODO: Process payment via backend
      /* Example:
      await api.post(`/seasons/${this.currentSeason.id}/purchase-premium`);
      */

      // Update locally
      this.playerProgress.hasPremiumPass = true;
      await this.savePlayerProgress();

      // Grant all premium rewards up to current tier
      await this.grantPremiumRewards();

      // Track analytics
      await analyticsService.logPurchase(
        'battle_pass_premium',
        this.currentSeason.battlePass.premiumPrice / 100,
        'USD'
      );

      // Show notification
      await notificationService.sendNotification(
        '🎉 Premium Battle Pass Activated!',
        `Enjoy exclusive rewards and ${this.currentSeason.battlePass.xpBoostMultiplier}x XP boost!`,
        {
          type: 'BATTLE_PASS_PURCHASED',
        }
      );

      console.log(`✅ Premium battle pass purchased for season ${this.currentSeason.id}`);
      return true;
    } catch (error) {
      console.error('Failed to purchase premium pass:', error);
      return false;
    }
  }

  /**
   * Grant all premium rewards up to current tier
   */
  private async grantPremiumRewards(): Promise<void> {
    if (!this.currentSeason || !this.playerProgress) return;

    const currentTier = this.playerProgress.currentTier;

    for (let tier = 0; tier <= currentTier; tier++) {
      const premiumTier = this.currentSeason.battlePass.premiumTiers.find((t) => t.tier === tier);
      if (premiumTier) {
        for (const reward of premiumTier.rewards) {
          if (!this.playerProgress.claimedRewards.includes(reward.id)) {
            await this.claimReward(reward);
          }
        }
      }
    }
  }

  /**
   * Add XP and update tier
   */
  async addXP(source: XPSource['type'], baseAmount: number): Promise<{
    xpGained: number;
    tierUps: number;
    newTier: number;
    rewardsUnlocked: Reward[];
  }> {
    if (!this.currentSeason || !this.playerProgress) {
      throw new Error('No active season');
    }

    // Calculate XP with multipliers
    let xpGained = baseAmount;
    if (this.playerProgress.hasPremiumPass) {
      xpGained *= this.currentSeason.battlePass.xpBoostMultiplier;
    }

    // Update XP
    const oldXP = this.playerProgress.currentXP;
    const oldTier = this.playerProgress.currentTier;

    this.playerProgress.currentXP += xpGained;
    this.playerProgress.totalXP += xpGained;
    this.playerProgress.lastPlayedAt = new Date();

    // Check for tier ups
    const xpPerTier = this.currentSeason.battlePass.xpPerTier;
    const maxTier = this.currentSeason.battlePass.maxTier;

    let tierUps = 0;
    const rewardsUnlocked: Reward[] = [];

    while (
      this.playerProgress.currentXP >= xpPerTier &&
      this.playerProgress.currentTier < maxTier
    ) {
      this.playerProgress.currentXP -= xpPerTier;
      this.playerProgress.currentTier++;
      tierUps++;

      // Get rewards for new tier
      const newTierRewards = this.getTierRewards(this.playerProgress.currentTier);
      rewardsUnlocked.push(...newTierRewards);

      // Auto-claim rewards
      for (const reward of newTierRewards) {
        await this.claimReward(reward);
      }
    }

    await this.savePlayerProgress();

    // Show notification for tier up
    if (tierUps > 0) {
      await notificationService.sendNotification(
        '⬆️ Battle Pass Tier Up!',
        `You reached tier ${this.playerProgress.currentTier}! ${rewardsUnlocked.length} new reward${rewardsUnlocked.length > 1 ? 's' : ''} unlocked!`,
        {
          type: 'BATTLE_PASS_TIER_UP',
          tier: this.playerProgress.currentTier,
        }
      );
    }

    // Track analytics
    await analyticsService.logEvent('battle_pass_xp_gained', {
      source,
      xp_gained: xpGained,
      tier_ups: tierUps,
      new_tier: this.playerProgress.currentTier,
    });

    console.log(`✅ Added ${xpGained} XP (${tierUps} tier ups)`);

    return {
      xpGained,
      tierUps,
      newTier: this.playerProgress.currentTier,
      rewardsUnlocked,
    };
  }

  /**
   * Get rewards for tier
   */
  private getTierRewards(tier: number): Reward[] {
    if (!this.currentSeason || !this.playerProgress) return [];

    const rewards: Reward[] = [];

    // Free tier rewards
    const freeTier = this.currentSeason.battlePass.freeTiers.find((t) => t.tier === tier);
    if (freeTier) {
      rewards.push(...freeTier.rewards);
    }

    // Premium tier rewards (if player has premium)
    if (this.playerProgress.hasPremiumPass) {
      const premiumTier = this.currentSeason.battlePass.premiumTiers.find((t) => t.tier === tier);
      if (premiumTier) {
        rewards.push(...premiumTier.rewards);
      }
    }

    return rewards;
  }

  /**
   * Claim reward
   */
  private async claimReward(reward: Reward): Promise<void> {
    if (!this.playerProgress) return;

    // Check if already claimed
    if (this.playerProgress.claimedRewards.includes(reward.id)) {
      return;
    }

    // TODO: Grant reward via backend
    /* Example:
    await api.post('/seasons/claim-reward', {
      rewardId: reward.id,
    });
    */

    // Mark as claimed
    this.playerProgress.claimedRewards.push(reward.id);
    await this.savePlayerProgress();

    console.log(`✅ Claimed reward: ${reward.name} (${reward.type})`);
  }

  /**
   * Skip tier (with payment)
   */
  async skipTier(): Promise<boolean> {
    try {
      if (!this.currentSeason || !this.playerProgress) {
        console.error('No active season or progress');
        return false;
      }

      const maxTier = this.currentSeason.battlePass.maxTier;
      if (this.playerProgress.currentTier >= maxTier) {
        console.error('Already at max tier');
        return false;
      }

      // TODO: Process payment via backend
      /* Example:
      await api.post(`/seasons/${this.currentSeason.id}/skip-tier`);
      */

      // Update tier
      this.playerProgress.currentTier++;
      this.playerProgress.currentXP = 0;

      // Grant rewards
      const rewards = this.getTierRewards(this.playerProgress.currentTier);
      for (const reward of rewards) {
        await this.claimReward(reward);
      }

      await this.savePlayerProgress();

      // Track analytics
      await analyticsService.logPurchase(
        'battle_pass_tier_skip',
        this.currentSeason.battlePass.tierSkipPrice / 100,
        'USD'
      );

      console.log(`✅ Skipped to tier ${this.playerProgress.currentTier}`);
      return true;
    } catch (error) {
      console.error('Failed to skip tier:', error);
      return false;
    }
  }

  /**
   * Get XP to next tier
   */
  getXPToNextTier(): number {
    if (!this.currentSeason || !this.playerProgress) return 0;

    const xpPerTier = this.currentSeason.battlePass.xpPerTier;
    return xpPerTier - this.playerProgress.currentXP;
  }

  /**
   * Get progress percentage to next tier
   */
  getProgressPercentage(): number {
    if (!this.currentSeason || !this.playerProgress) return 0;

    const xpPerTier = this.currentSeason.battlePass.xpPerTier;
    return (this.playerProgress.currentXP / xpPerTier) * 100;
  }

  /**
   * Get season leaderboard
   */
  async getLeaderboard(limit: number = 100): Promise<any[]> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get(`/seasons/${this.currentSeason?.id}/leaderboard`, {
        params: { limit },
      });
      return response.data;
      */

      return [];
    } catch (error) {
      console.error('Failed to get season leaderboard:', error);
      return [];
    }
  }

  /**
   * Get season history
   */
  async getSeasonHistory(): Promise<Season[]> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get('/seasons/history');
      return response.data;
      */

      return [];
    } catch (error) {
      console.error('Failed to get season history:', error);
      return [];
    }
  }

  /**
   * Refresh season data from server
   */
  async refresh(): Promise<void> {
    await this.loadCurrentSeason();
    await this.loadPlayerProgress();
  }
}

export const seasonsService = new SeasonsService();
