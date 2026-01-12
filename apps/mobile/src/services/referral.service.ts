/**
 * Referral System Service
 *
 * Handles referral codes, tracking, and rewards.
 * Supports social sharing and analytics.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share, Platform } from 'react-native';
import { analyticsService } from './analytics.service';
import { notificationService } from './notification.service';
import api from './api';

export interface ReferralCode {
  code: string;
  userId: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalEarnings: number;
  lifetimeValue: number;
}

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId?: string;
  code: string;
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED';
  createdAt: Date;
  completedAt?: Date;
  reward: {
    referrerGems: number;
    referredGems: number;
    referrerCoins: number;
    referredCoins: number;
  };
}

export interface ReferralReward {
  type: 'SIGN_UP' | 'FIRST_DEPOSIT' | 'FIRST_GAME' | 'MILESTONE';
  gems: number;
  coins: number;
  description: string;
}

// Referral reward tiers
export const REFERRAL_REWARDS = {
  // When referred user signs up
  SIGN_UP: {
    referrer: { gems: 50, coins: 200 },
    referred: { gems: 100, coins: 500 },
  },
  // When referred user makes first deposit
  FIRST_DEPOSIT: {
    referrer: { gems: 200, coins: 1000 },
    referred: { gems: 0, coins: 0 },
  },
  // When referred user plays first game
  FIRST_GAME: {
    referrer: { gems: 25, coins: 100 },
    referred: { gems: 0, coins: 0 },
  },
  // Milestone bonuses
  MILESTONES: [
    { count: 5, gems: 500, coins: 2500 },
    { count: 10, gems: 1500, coins: 7500 },
    { count: 25, gems: 5000, coins: 25000 },
    { count: 50, gems: 15000, coins: 75000 },
    { count: 100, gems: 50000, coins: 250000 },
  ],
};

class ReferralService {
  private referralCode: ReferralCode | null = null;
  private stats: ReferralStats | null = null;
  private referrals: Referral[] = [];
  private loaded: boolean = false;

  /**
   * Initialize referral service
   */
  async initialize(): Promise<void> {
    await this.loadReferralCode();
    await this.loadStats();
    await this.loadReferrals();

    console.log('✅ Referral service initialized');
  }

  /**
   * Load referral code from storage
   */
  private async loadReferralCode(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('referral_code');
      if (stored) {
        this.referralCode = JSON.parse(stored);
      }

      // If no code, generate one
      if (!this.referralCode) {
        await this.generateReferralCode();
      }
    } catch (error) {
      console.error('Failed to load referral code:', error);
    }
  }

  /**
   * Save referral code to storage
   */
  private async saveReferralCode(): Promise<void> {
    try {
      if (this.referralCode) {
        await AsyncStorage.setItem('referral_code', JSON.stringify(this.referralCode));
      }
    } catch (error) {
      console.error('Failed to save referral code:', error);
    }
  }

  /**
   * Load stats from backend or storage
   */
  private async loadStats(): Promise<void> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get('/referrals/stats');
      this.stats = response.data;
      */

      // Fallback: Load from storage
      const stored = await AsyncStorage.getItem('referral_stats');
      if (stored) {
        this.stats = JSON.parse(stored);
      } else {
        this.stats = {
          totalReferrals: 0,
          successfulReferrals: 0,
          pendingReferrals: 0,
          totalEarnings: 0,
          lifetimeValue: 0,
        };
      }
    } catch (error) {
      console.error('Failed to load referral stats:', error);
      this.stats = {
        totalReferrals: 0,
        successfulReferrals: 0,
        pendingReferrals: 0,
        totalEarnings: 0,
        lifetimeValue: 0,
      };
    }
  }

  /**
   * Save stats to storage
   */
  private async saveStats(): Promise<void> {
    try {
      if (this.stats) {
        await AsyncStorage.setItem('referral_stats', JSON.stringify(this.stats));
      }
    } catch (error) {
      console.error('Failed to save referral stats:', error);
    }
  }

  /**
   * Load referrals from backend
   */
  private async loadReferrals(): Promise<void> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get('/referrals');
      this.referrals = response.data;
      */

      this.referrals = [];
    } catch (error) {
      console.error('Failed to load referrals:', error);
    }
  }

  /**
   * Generate referral code
   */
  private async generateReferralCode(): Promise<void> {
    try {
      // TODO: Generate on backend for uniqueness
      /* Example:
      const response = await api.post('/referrals/generate-code');
      this.referralCode = response.data;
      */

      // Fallback: Generate locally
      const code = this.generateRandomCode();
      this.referralCode = {
        code,
        userId: 'local', // Replace with actual user ID
        createdAt: new Date(),
      };

      await this.saveReferralCode();
      console.log(`✅ Referral code generated: ${code}`);
    } catch (error) {
      console.error('Failed to generate referral code:', error);
    }
  }

  /**
   * Generate random alphanumeric code
   */
  private generateRandomCode(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Get user's referral code
   */
  getReferralCode(): string | null {
    return this.referralCode?.code || null;
  }

  /**
   * Get referral link
   */
  getReferralLink(): string {
    const code = this.getReferralCode();
    if (!code) return '';

    // TODO: Replace with actual app deep link
    const baseUrl = 'https://yourgame.com/join';
    return `${baseUrl}?ref=${code}`;
  }

  /**
   * Get referral stats
   */
  getStats(): ReferralStats | null {
    return this.stats;
  }

  /**
   * Get all referrals
   */
  getReferrals(): Referral[] {
    return this.referrals;
  }

  /**
   * Share referral code
   */
  async shareReferralCode(): Promise<void> {
    const code = this.getReferralCode();
    if (!code) {
      console.error('No referral code available');
      return;
    }

    const link = this.getReferralLink();
    const message = `Join me on Solitaire! Use my referral code ${code} and we both get rewards! ${link}`;

    try {
      const result = await Share.share({
        message,
        url: Platform.OS === 'ios' ? link : undefined,
        title: 'Join Solitaire',
      });

      if (result.action === Share.sharedAction) {
        // Track share event
        await analyticsService.logShare('referral_code', result.activityType || 'unknown', code);

        console.log('✅ Referral code shared');
      }
    } catch (error) {
      console.error('Failed to share referral code:', error);
    }
  }

  /**
   * Apply referral code (for new users)
   */
  async applyReferralCode(code: string): Promise<boolean> {
    try {
      // TODO: Submit to backend
      /* Example:
      const response = await api.post('/referrals/apply', { code });

      if (response.data.success) {
        // Show reward notification
        await notificationService.sendNotification(
          '🎁 Welcome Bonus!',
          `You received ${response.data.reward.gems} gems and ${response.data.reward.coins} coins!`,
          { type: 'REFERRAL_REWARD' }
        );

        return true;
      }
      */

      // Track analytics
      await analyticsService.logEvent('referral_code_applied', { code });

      console.log(`✅ Referral code applied: ${code}`);
      return true;
    } catch (error) {
      console.error('Failed to apply referral code:', error);
      return false;
    }
  }

  /**
   * Check for referral rewards
   * Call this after significant user actions
   */
  async checkForRewards(action: 'SIGN_UP' | 'FIRST_DEPOSIT' | 'FIRST_GAME'): Promise<void> {
    try {
      // TODO: Backend checks and grants rewards
      /* Example:
      const response = await api.post('/referrals/check-rewards', { action });

      if (response.data.reward) {
        await notificationService.sendNotification(
          '🎁 Referral Reward!',
          response.data.reward.message,
          { type: 'REFERRAL_REWARD' }
        );
      }
      */

      console.log(`✅ Checked for referral rewards: ${action}`);
    } catch (error) {
      console.error('Failed to check for rewards:', error);
    }
  }

  /**
   * Track referral milestone
   */
  async checkMilestone(): Promise<void> {
    if (!this.stats) return;

    const successfulCount = this.stats.successfulReferrals;

    // Check if user hit a milestone
    const milestone = REFERRAL_REWARDS.MILESTONES.find(m => m.count === successfulCount);

    if (milestone) {
      // Grant milestone reward
      await notificationService.sendNotification(
        '🎉 Referral Milestone!',
        `You've referred ${successfulCount} friends! Here's ${milestone.gems} gems and ${milestone.coins} coins!`,
        {
          type: 'REFERRAL_REWARD',
          milestone: successfulCount,
        }
      );

      // Track analytics
      await analyticsService.logEvent('referral_milestone', {
        count: successfulCount,
        gems: milestone.gems,
        coins: milestone.coins,
      });

      console.log(`🎉 Referral milestone reached: ${successfulCount}`);
    }
  }

  /**
   * Get progress to next milestone
   */
  getNextMilestone(): { count: number; gems: number; coins: number; progress: number } | null {
    if (!this.stats) return null;

    const successfulCount = this.stats.successfulReferrals;

    // Find next milestone
    const nextMilestone = REFERRAL_REWARDS.MILESTONES.find(m => m.count > successfulCount);

    if (!nextMilestone) {
      return null;
    }

    const progress = (successfulCount / nextMilestone.count) * 100;

    return {
      count: nextMilestone.count,
      gems: nextMilestone.gems,
      coins: nextMilestone.coins,
      progress: Math.round(progress),
    };
  }

  /**
   * Refresh stats from backend
   */
  async refreshStats(): Promise<void> {
    await this.loadStats();
    await this.loadReferrals();
    await this.checkMilestone();
  }

  /**
   * Get leaderboard (top referrers)
   */
  async getLeaderboard(limit: number = 100): Promise<any[]> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get('/referrals/leaderboard', {
        params: { limit },
      });
      return response.data;
      */

      return [];
    } catch (error) {
      console.error('Failed to load referral leaderboard:', error);
      return [];
    }
  }

  /**
   * Copy referral code to clipboard
   */
  async copyToClipboard(): Promise<void> {
    const code = this.getReferralCode();
    if (!code) return;

    try {
      // TODO: Use Clipboard API
      /* Example:
      import Clipboard from '@react-native-clipboard/clipboard';
      Clipboard.setString(code);
      */

      // Track analytics
      await analyticsService.logEvent('referral_code_copied', { code });

      console.log(`✅ Referral code copied: ${code}`);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }

  /**
   * Get referral FAQ
   */
  getFAQ(): { question: string; answer: string }[] {
    return [
      {
        question: 'How do referrals work?',
        answer:
          'Share your unique referral code with friends. When they sign up using your code, you both get rewards!',
      },
      {
        question: 'What rewards do I get?',
        answer:
          'You get 50 gems and 200 coins when a friend signs up. Additional bonuses when they make their first deposit or play their first game!',
      },
      {
        question: 'What rewards does my friend get?',
        answer: 'Your friend gets 100 gems and 500 coins as a welcome bonus!',
      },
      {
        question: 'Are there milestone bonuses?',
        answer:
          'Yes! Earn extra rewards at 5, 10, 25, 50, and 100 referrals. Up to 50,000 gems and 250,000 coins!',
      },
      {
        question: 'How do I share my code?',
        answer:
          'Tap the share button to send your code via social media, messaging apps, or copy it to your clipboard.',
      },
      {
        question: 'Can I refer unlimited friends?',
        answer: 'Yes! There is no limit to how many friends you can refer.',
      },
    ];
  }
}

export const referralService = new ReferralService();
