/**
 * Achievement System
 *
 * Tracks player achievements, unlocks, and rewards.
 * Integrates with analytics and notifications.
 */

import { analyticsService } from './analytics.service';
import { notificationService } from './notification.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export enum AchievementCategory {
  GAMES = 'GAMES',
  WINS = 'WINS',
  SPEED = 'SPEED',
  STREAK = 'STREAK',
  EARNINGS = 'EARNINGS',
  SOCIAL = 'SOCIAL',
  SPECIAL = 'SPECIAL',
}

export enum AchievementRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  requirement: number;
  rewardGems?: number;
  rewardCoins?: number;
  hidden?: boolean;
}

export interface AchievementProgress {
  achievementId: string;
  progress: number;
  unlocked: boolean;
  unlockedAt?: Date;
}

// Achievement definitions
export const ACHIEVEMENTS: Achievement[] = [
  // Games Played
  {
    id: 'first_game',
    title: 'First Steps',
    description: 'Complete your first game',
    icon: '🎯',
    category: AchievementCategory.GAMES,
    rarity: AchievementRarity.COMMON,
    requirement: 1,
    rewardGems: 10,
  },
  {
    id: 'games_10',
    title: 'Getting Started',
    description: 'Play 10 games',
    icon: '🎮',
    category: AchievementCategory.GAMES,
    rarity: AchievementRarity.COMMON,
    requirement: 10,
    rewardGems: 25,
  },
  {
    id: 'games_50',
    title: 'Regular Player',
    description: 'Play 50 games',
    icon: '🎲',
    category: AchievementCategory.GAMES,
    rarity: AchievementRarity.RARE,
    requirement: 50,
    rewardGems: 100,
  },
  {
    id: 'games_100',
    title: 'Veteran',
    description: 'Play 100 games',
    icon: '🎖️',
    category: AchievementCategory.GAMES,
    rarity: AchievementRarity.EPIC,
    requirement: 100,
    rewardGems: 250,
  },
  {
    id: 'games_500',
    title: 'Master Player',
    description: 'Play 500 games',
    icon: '👑',
    category: AchievementCategory.GAMES,
    rarity: AchievementRarity.LEGENDARY,
    requirement: 500,
    rewardGems: 1000,
  },

  // Wins
  {
    id: 'first_win',
    title: 'Victory!',
    description: 'Win your first game',
    icon: '🏆',
    category: AchievementCategory.WINS,
    rarity: AchievementRarity.COMMON,
    requirement: 1,
    rewardGems: 20,
  },
  {
    id: 'wins_10',
    title: 'Champion',
    description: 'Win 10 games',
    icon: '🥇',
    category: AchievementCategory.WINS,
    rarity: AchievementRarity.RARE,
    requirement: 10,
    rewardGems: 100,
  },
  {
    id: 'wins_50',
    title: 'Grand Champion',
    description: 'Win 50 games',
    icon: '🏅',
    category: AchievementCategory.WINS,
    rarity: AchievementRarity.EPIC,
    requirement: 50,
    rewardGems: 300,
  },
  {
    id: 'wins_100',
    title: 'Legend',
    description: 'Win 100 games',
    icon: '⭐',
    category: AchievementCategory.WINS,
    rarity: AchievementRarity.LEGENDARY,
    requirement: 100,
    rewardGems: 1000,
  },

  // Speed
  {
    id: 'speed_60',
    title: 'Speed Demon',
    description: 'Win a game in under 60 seconds',
    icon: '⚡',
    category: AchievementCategory.SPEED,
    rarity: AchievementRarity.RARE,
    requirement: 1,
    rewardGems: 150,
  },
  {
    id: 'speed_45',
    title: 'Lightning Fast',
    description: 'Win a game in under 45 seconds',
    icon: '🌩️',
    category: AchievementCategory.SPEED,
    rarity: AchievementRarity.EPIC,
    requirement: 1,
    rewardGems: 300,
  },
  {
    id: 'speed_30',
    title: 'Speedrunner',
    description: 'Win a game in under 30 seconds',
    icon: '🚀',
    category: AchievementCategory.SPEED,
    rarity: AchievementRarity.LEGENDARY,
    requirement: 1,
    rewardGems: 500,
  },

  // Win Streak
  {
    id: 'streak_3',
    title: 'On Fire',
    description: 'Win 3 games in a row',
    icon: '🔥',
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.RARE,
    requirement: 3,
    rewardGems: 100,
  },
  {
    id: 'streak_5',
    title: 'Unstoppable',
    description: 'Win 5 games in a row',
    icon: '💥',
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.EPIC,
    requirement: 5,
    rewardGems: 250,
  },
  {
    id: 'streak_10',
    title: 'Dominator',
    description: 'Win 10 games in a row',
    icon: '👊',
    category: AchievementCategory.STREAK,
    rarity: AchievementRarity.LEGENDARY,
    requirement: 10,
    rewardGems: 1000,
  },

  // Earnings
  {
    id: 'earn_1000',
    title: 'Money Maker',
    description: 'Earn $10 in total winnings',
    icon: '💰',
    category: AchievementCategory.EARNINGS,
    rarity: AchievementRarity.RARE,
    requirement: 1000, // cents
    rewardGems: 100,
  },
  {
    id: 'earn_10000',
    title: 'High Roller',
    description: 'Earn $100 in total winnings',
    icon: '💎',
    category: AchievementCategory.EARNINGS,
    rarity: AchievementRarity.EPIC,
    requirement: 10000,
    rewardGems: 500,
  },
  {
    id: 'earn_100000',
    title: 'Whale',
    description: 'Earn $1000 in total winnings',
    icon: '🐋',
    category: AchievementCategory.EARNINGS,
    rarity: AchievementRarity.LEGENDARY,
    requirement: 100000,
    rewardGems: 2000,
  },

  // Social
  {
    id: 'refer_1',
    title: 'Recruiter',
    description: 'Refer your first friend',
    icon: '👥',
    category: AchievementCategory.SOCIAL,
    rarity: AchievementRarity.COMMON,
    requirement: 1,
    rewardGems: 50,
  },
  {
    id: 'refer_5',
    title: 'Influencer',
    description: 'Refer 5 friends',
    icon: '📢',
    category: AchievementCategory.SOCIAL,
    rarity: AchievementRarity.RARE,
    requirement: 5,
    rewardGems: 250,
  },
  {
    id: 'refer_10',
    title: 'Ambassador',
    description: 'Refer 10 friends',
    icon: '🌟',
    category: AchievementCategory.SOCIAL,
    rarity: AchievementRarity.EPIC,
    requirement: 10,
    rewardGems: 1000,
  },

  // Special
  {
    id: 'perfect_game',
    title: 'Perfectionist',
    description: 'Win without using undo',
    icon: '💯',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.EPIC,
    requirement: 1,
    rewardGems: 200,
  },
  {
    id: 'all_tiers',
    title: 'Completionist',
    description: 'Win at least once in every tier',
    icon: '🎭',
    category: AchievementCategory.SPECIAL,
    rarity: AchievementRarity.LEGENDARY,
    requirement: 5, // Number of tiers
    rewardGems: 500,
  },
];

class AchievementService {
  private progress: Map<string, AchievementProgress> = new Map();
  private loaded: boolean = false;

  /**
   * Initialize achievement service
   */
  async initialize(): Promise<void> {
    await this.loadProgress();
  }

  /**
   * Load progress from storage
   */
  private async loadProgress(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('achievement_progress');
      if (stored) {
        const data = JSON.parse(stored);
        this.progress = new Map(Object.entries(data));
      }
      this.loaded = true;
      console.log('✅ Achievement progress loaded');
    } catch (error) {
      console.error('Failed to load achievement progress:', error);
    }
  }

  /**
   * Save progress to storage
   */
  private async saveProgress(): Promise<void> {
    try {
      const data = Object.fromEntries(this.progress);
      await AsyncStorage.setItem('achievement_progress', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save achievement progress:', error);
    }
  }

  /**
   * Get achievement by ID
   */
  getAchievement(id: string): Achievement | undefined {
    return ACHIEVEMENTS.find(a => a.id === id);
  }

  /**
   * Get all achievements
   */
  getAllAchievements(): Achievement[] {
    return ACHIEVEMENTS.filter(a => !a.hidden);
  }

  /**
   * Get achievements by category
   */
  getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return ACHIEVEMENTS.filter(a => a.category === category && !a.hidden);
  }

  /**
   * Get progress for achievement
   */
  getProgress(achievementId: string): AchievementProgress {
    if (!this.progress.has(achievementId)) {
      return {
        achievementId,
        progress: 0,
        unlocked: false,
      };
    }
    return this.progress.get(achievementId)!;
  }

  /**
   * Get all progress
   */
  getAllProgress(): AchievementProgress[] {
    return ACHIEVEMENTS.map(a => this.getProgress(a.id));
  }

  /**
   * Update progress for achievement
   */
  async updateProgress(achievementId: string, progress: number): Promise<boolean> {
    const achievement = this.getAchievement(achievementId);
    if (!achievement) return false;

    const current = this.getProgress(achievementId);

    // Already unlocked
    if (current.unlocked) return false;

    // Update progress
    current.progress = Math.min(progress, achievement.requirement);

    // Check if unlocked
    if (current.progress >= achievement.requirement) {
      return await this.unlockAchievement(achievementId);
    }

    this.progress.set(achievementId, current);
    await this.saveProgress();
    return false;
  }

  /**
   * Increment progress
   */
  async incrementProgress(achievementId: string, amount: number = 1): Promise<boolean> {
    const current = this.getProgress(achievementId);
    return await this.updateProgress(achievementId, current.progress + amount);
  }

  /**
   * Unlock achievement
   */
  private async unlockAchievement(achievementId: string): Promise<boolean> {
    const achievement = this.getAchievement(achievementId);
    if (!achievement) return false;

    const current = this.getProgress(achievementId);
    if (current.unlocked) return false;

    // Mark as unlocked
    current.unlocked = true;
    current.unlockedAt = new Date();
    current.progress = achievement.requirement;

    this.progress.set(achievementId, current);
    await this.saveProgress();

    // Track unlock
    await analyticsService.logAchievementUnlock(achievementId);

    // Show notification
    await notificationService.sendNotification(
      '🏆 Achievement Unlocked!',
      `${achievement.title}: ${achievement.description}`,
      {
        type: 'ACHIEVEMENT_UNLOCKED',
        achievementId,
      }
    );

    // Grant rewards
    if (achievement.rewardGems || achievement.rewardCoins) {
      await this.grantRewards(achievement);
    }

    // Sync to backend
    await this.syncToBackend(achievementId);

    console.log(`🏆 Achievement unlocked: ${achievement.title}`);
    return true;
  }

  /**
   * Grant achievement rewards
   */
  private async grantRewards(achievement: Achievement): Promise<void> {
    try {
      // TODO: Grant rewards via API
      console.log(`💎 Granted rewards for ${achievement.id}:`, {
        gems: achievement.rewardGems,
        coins: achievement.rewardCoins,
      });

      /* Example:
      await api.post('/achievements/claim-reward', {
        achievementId: achievement.id,
      });
      */
    } catch (error) {
      console.error('Failed to grant rewards:', error);
    }
  }

  /**
   * Sync achievement unlock to backend
   */
  private async syncToBackend(achievementId: string): Promise<void> {
    try {
      // TODO: Sync to backend
      /* Example:
      await api.post('/achievements/unlock', {
        achievementId,
        unlockedAt: new Date(),
      });
      */
    } catch (error) {
      console.error('Failed to sync achievement:', error);
    }
  }

  /**
   * Check for new achievements after game
   */
  async checkAfterGame(stats: {
    gamesPlayed: number;
    wins: number;
    currentStreak: number;
    completionTimeMs: number;
    totalEarnings: number;
    usedUndo: boolean;
  }): Promise<void> {
    // Games played
    await this.updateProgress('first_game', stats.gamesPlayed);
    await this.updateProgress('games_10', stats.gamesPlayed);
    await this.updateProgress('games_50', stats.gamesPlayed);
    await this.updateProgress('games_100', stats.gamesPlayed);
    await this.updateProgress('games_500', stats.gamesPlayed);

    // Wins
    await this.updateProgress('first_win', stats.wins);
    await this.updateProgress('wins_10', stats.wins);
    await this.updateProgress('wins_50', stats.wins);
    await this.updateProgress('wins_100', stats.wins);

    // Speed (only if won)
    if (stats.completionTimeMs) {
      if (stats.completionTimeMs < 60000) {
        await this.incrementProgress('speed_60');
      }
      if (stats.completionTimeMs < 45000) {
        await this.incrementProgress('speed_45');
      }
      if (stats.completionTimeMs < 30000) {
        await this.incrementProgress('speed_30');
      }
    }

    // Streak
    await this.updateProgress('streak_3', stats.currentStreak);
    await this.updateProgress('streak_5', stats.currentStreak);
    await this.updateProgress('streak_10', stats.currentStreak);

    // Earnings
    await this.updateProgress('earn_1000', stats.totalEarnings);
    await this.updateProgress('earn_10000', stats.totalEarnings);
    await this.updateProgress('earn_100000', stats.totalEarnings);

    // Perfect game
    if (!stats.usedUndo) {
      await this.incrementProgress('perfect_game');
    }
  }

  /**
   * Get completion percentage
   */
  getCompletionPercentage(): number {
    const total = ACHIEVEMENTS.filter(a => !a.hidden).length;
    const unlocked = Array.from(this.progress.values()).filter(p => p.unlocked).length;
    return Math.round((unlocked / total) * 100);
  }

  /**
   * Get stats
   */
  getStats(): {
    total: number;
    unlocked: number;
    percentage: number;
    byCategory: Record<AchievementCategory, { total: number; unlocked: number }>;
  } {
    const total = ACHIEVEMENTS.filter(a => !a.hidden).length;
    const unlocked = Array.from(this.progress.values()).filter(p => p.unlocked).length;

    const byCategory: Record<AchievementCategory, { total: number; unlocked: number }> = {} as any;

    for (const category of Object.values(AchievementCategory)) {
      const categoryAchievements = this.getAchievementsByCategory(category);
      const categoryUnlocked = categoryAchievements.filter(a =>
        this.getProgress(a.id).unlocked
      ).length;

      byCategory[category] = {
        total: categoryAchievements.length,
        unlocked: categoryUnlocked,
      };
    }

    return {
      total,
      unlocked,
      percentage: this.getCompletionPercentage(),
      byCategory,
    };
  }
}

export const achievementService = new AchievementService();
