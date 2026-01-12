/**
 * Daily Challenge Service
 *
 * Generates daily challenges with unique seeds.
 * Tracks completion, streaks, and leaderboards.
 * Integrates with notifications and rewards.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyticsService } from './analytics.service';
import { notificationService } from './notification.service';
import api from './api';

export interface DailyChallenge {
  id: string;
  date: string; // YYYY-MM-DD
  seed: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  expiresAt: Date;
  rewards: {
    gems: number;
    coins: number;
    streakBonus?: number;
  };
}

export interface DailyChallengeProgress {
  challengeId: string;
  completed: boolean;
  completedAt?: Date;
  score: number;
  moves: number;
  timeMs: number;
  rank?: number;
}

export interface DailyChallengeStreak {
  current: number;
  longest: number;
  lastCompletedDate: string; // YYYY-MM-DD
}

export interface DailyChallengeLeaderboard {
  challengeId: string;
  entries: DailyChallengeLeaderboardEntry[];
  userRank?: number;
  totalParticipants: number;
}

export interface DailyChallengeLeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  moves: number;
  timeMs: number;
  rank: number;
}

class DailyChallengeService {
  private currentChallenge: DailyChallenge | null = null;
  private progress: Map<string, DailyChallengeProgress> = new Map();
  private streak: DailyChallengeStreak = {
    current: 0,
    longest: 0,
    lastCompletedDate: '',
  };
  private loaded: boolean = false;

  /**
   * Initialize daily challenge service
   */
  async initialize(): Promise<void> {
    await this.loadProgress();
    await this.loadStreak();
    await this.loadTodayChallenge();

    // Schedule notification for tomorrow's challenge
    await this.scheduleNextChallengeNotification();

    console.log('✅ Daily challenge service initialized');
  }

  /**
   * Load progress from storage
   */
  private async loadProgress(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('daily_challenge_progress');
      if (stored) {
        const data = JSON.parse(stored);
        this.progress = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Failed to load daily challenge progress:', error);
    }
  }

  /**
   * Save progress to storage
   */
  private async saveProgress(): Promise<void> {
    try {
      const data = Object.fromEntries(this.progress);
      await AsyncStorage.setItem('daily_challenge_progress', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save daily challenge progress:', error);
    }
  }

  /**
   * Load streak from storage
   */
  private async loadStreak(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('daily_challenge_streak');
      if (stored) {
        this.streak = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load daily challenge streak:', error);
    }
  }

  /**
   * Save streak to storage
   */
  private async saveStreak(): Promise<void> {
    try {
      await AsyncStorage.setItem('daily_challenge_streak', JSON.stringify(this.streak));
    } catch (error) {
      console.error('Failed to save daily challenge streak:', error);
    }
  }

  /**
   * Load today's challenge from backend or generate locally
   */
  private async loadTodayChallenge(): Promise<void> {
    try {
      const today = this.getTodayDateString();

      // TODO: Fetch from backend
      /* Example:
      const response = await api.get('/daily-challenges/today');
      this.currentChallenge = response.data;
      */

      // Fallback: Generate locally
      this.currentChallenge = this.generateLocalChallenge(today);

      console.log(`📅 Today's challenge loaded: ${this.currentChallenge.id}`);
    } catch (error) {
      console.error('Failed to load daily challenge:', error);

      // Generate local challenge as fallback
      const today = this.getTodayDateString();
      this.currentChallenge = this.generateLocalChallenge(today);
    }
  }

  /**
   * Generate local challenge (fallback when offline)
   */
  private generateLocalChallenge(date: string): DailyChallenge {
    // Use date as seed for consistent daily challenges
    const seed = this.dateToSeed(date);
    const difficulty = this.getDifficultyForDay(date);

    const expiresAt = new Date(date);
    expiresAt.setDate(expiresAt.getDate() + 1);
    expiresAt.setHours(0, 0, 0, 0);

    return {
      id: `dc-${date}`,
      date,
      seed,
      difficulty,
      expiresAt,
      rewards: {
        gems: difficulty === 'EASY' ? 25 : difficulty === 'MEDIUM' ? 50 : 100,
        coins: difficulty === 'EASY' ? 100 : difficulty === 'MEDIUM' ? 250 : 500,
      },
    };
  }

  /**
   * Convert date string to seed number
   */
  private dateToSeed(dateString: string): number {
    // Convert YYYY-MM-DD to number seed
    const parts = dateString.split('-').map(Number);
    return parts[0] * 10000 + parts[1] * 100 + parts[2];
  }

  /**
   * Get difficulty based on day of week
   */
  private getDifficultyForDay(dateString: string): 'EASY' | 'MEDIUM' | 'HARD' {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();

    // Monday-Wednesday: Easy
    if (dayOfWeek >= 1 && dayOfWeek <= 3) {
      return 'EASY';
    }
    // Thursday-Friday: Medium
    if (dayOfWeek >= 4 && dayOfWeek <= 5) {
      return 'MEDIUM';
    }
    // Saturday-Sunday: Hard
    return 'HARD';
  }

  /**
   * Get today's date string (YYYY-MM-DD)
   */
  private getTodayDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Get current challenge
   */
  getCurrentChallenge(): DailyChallenge | null {
    // Check if challenge is expired
    if (this.currentChallenge) {
      if (new Date() > this.currentChallenge.expiresAt) {
        // Challenge expired, load new one
        this.loadTodayChallenge();
      }
    }

    return this.currentChallenge;
  }

  /**
   * Check if today's challenge is completed
   */
  isTodayChallengeCompleted(): boolean {
    if (!this.currentChallenge) return false;

    const progress = this.progress.get(this.currentChallenge.id);
    return progress?.completed || false;
  }

  /**
   * Get progress for challenge
   */
  getProgress(challengeId: string): DailyChallengeProgress | null {
    return this.progress.get(challengeId) || null;
  }

  /**
   * Get current streak
   */
  getStreak(): DailyChallengeStreak {
    // Update streak status
    this.updateStreakStatus();
    return this.streak;
  }

  /**
   * Update streak status based on last completion
   */
  private updateStreakStatus(): void {
    const today = this.getTodayDateString();
    const yesterday = this.getYesterdayDateString();

    // If last completion was not today or yesterday, reset streak
    if (
      this.streak.lastCompletedDate !== today &&
      this.streak.lastCompletedDate !== yesterday
    ) {
      if (this.streak.current > 0) {
        console.log(`🔥 Streak broken: ${this.streak.current} days`);
        this.streak.current = 0;
        this.saveStreak();
      }
    }
  }

  /**
   * Get yesterday's date string
   */
  private getYesterdayDateString(): string {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }

  /**
   * Complete daily challenge
   */
  async completeChallenge(
    score: number,
    moves: number,
    timeMs: number
  ): Promise<void> {
    if (!this.currentChallenge) {
      throw new Error('No active challenge');
    }

    const challengeId = this.currentChallenge.id;

    // Check if already completed
    if (this.isTodayChallengeCompleted()) {
      console.log('⚠️ Challenge already completed today');
      return;
    }

    // Save progress
    const progress: DailyChallengeProgress = {
      challengeId,
      completed: true,
      completedAt: new Date(),
      score,
      moves,
      timeMs,
    };

    this.progress.set(challengeId, progress);
    await this.saveProgress();

    // Update streak
    await this.updateStreak();

    // Track analytics
    await analyticsService.logEvent('daily_challenge_complete', {
      challenge_id: challengeId,
      difficulty: this.currentChallenge.difficulty,
      score,
      moves,
      time_seconds: Math.round(timeMs / 1000),
      streak: this.streak.current,
    });

    // Grant rewards
    await this.grantRewards();

    // Submit to leaderboard
    await this.submitToLeaderboard(score, moves, timeMs);

    // Show notification
    await notificationService.sendNotification(
      '🎉 Daily Challenge Complete!',
      `Great job! ${this.streak.current} day streak!`,
      {
        type: 'DAILY_CHALLENGE',
        challengeId,
      }
    );

    console.log(`✅ Daily challenge completed: ${challengeId}`);
  }

  /**
   * Update streak
   */
  private async updateStreak(): Promise<void> {
    const today = this.getTodayDateString();
    const yesterday = this.getYesterdayDateString();

    // If last completion was yesterday, increment streak
    if (this.streak.lastCompletedDate === yesterday) {
      this.streak.current += 1;
    }
    // If last completion was not today, start new streak
    else if (this.streak.lastCompletedDate !== today) {
      this.streak.current = 1;
    }

    // Update longest streak
    if (this.streak.current > this.streak.longest) {
      this.streak.longest = this.streak.current;
    }

    this.streak.lastCompletedDate = today;
    await this.saveStreak();

    console.log(`🔥 Streak updated: ${this.streak.current} days`);
  }

  /**
   * Grant challenge rewards
   */
  private async grantRewards(): Promise<void> {
    if (!this.currentChallenge) return;

    const rewards = this.currentChallenge.rewards;

    // Calculate streak bonus (5% per day, max 50%)
    const streakMultiplier = Math.min(1 + (this.streak.current * 0.05), 1.5);
    const totalGems = Math.round(rewards.gems * streakMultiplier);
    const totalCoins = Math.round(rewards.coins * streakMultiplier);

    console.log(`💎 Rewards granted:`, {
      gems: totalGems,
      coins: totalCoins,
      streak: this.streak.current,
      multiplier: streakMultiplier,
    });

    // TODO: Grant via API
    /* Example:
    await api.post('/daily-challenges/claim-reward', {
      challengeId: this.currentChallenge.id,
    });
    */
  }

  /**
   * Submit score to leaderboard
   */
  private async submitToLeaderboard(
    score: number,
    moves: number,
    timeMs: number
  ): Promise<void> {
    if (!this.currentChallenge) return;

    try {
      // TODO: Submit to backend
      /* Example:
      const response = await api.post('/daily-challenges/leaderboard', {
        challengeId: this.currentChallenge.id,
        score,
        moves,
        timeMs,
      });

      const progress = this.progress.get(this.currentChallenge.id);
      if (progress) {
        progress.rank = response.data.rank;
        this.progress.set(this.currentChallenge.id, progress);
        await this.saveProgress();
      }
      */

      console.log(`📊 Score submitted to leaderboard`);
    } catch (error) {
      console.error('Failed to submit to leaderboard:', error);
    }
  }

  /**
   * Get leaderboard for challenge
   */
  async getLeaderboard(
    challengeId?: string
  ): Promise<DailyChallengeLeaderboard | null> {
    const id = challengeId || this.currentChallenge?.id;
    if (!id) return null;

    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get(`/daily-challenges/${id}/leaderboard`);
      return response.data;
      */

      // Fallback: Mock data
      return {
        challengeId: id,
        entries: [],
        totalParticipants: 0,
      };
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      return null;
    }
  }

  /**
   * Get challenge history
   */
  async getHistory(limit: number = 30): Promise<DailyChallengeProgress[]> {
    const history: DailyChallengeProgress[] = [];

    for (const [_, progress] of this.progress) {
      if (progress.completed) {
        history.push(progress);
      }
    }

    // Sort by completion date (newest first)
    history.sort((a, b) => {
      if (!a.completedAt || !b.completedAt) return 0;
      return b.completedAt.getTime() - a.completedAt.getTime();
    });

    return history.slice(0, limit);
  }

  /**
   * Get calendar data (for calendar view)
   */
  async getCalendarData(month: number, year: number): Promise<Record<string, boolean>> {
    const calendar: Record<string, boolean> = {};

    // Generate all dates in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const challengeId = `dc-${dateString}`;
      const progress = this.progress.get(challengeId);

      calendar[dateString] = progress?.completed || false;
    }

    return calendar;
  }

  /**
   * Schedule notification for next challenge
   */
  private async scheduleNextChallengeNotification(): Promise<void> {
    // Schedule notification for 9 AM tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    await notificationService.scheduleNotification(
      '🎯 New Daily Challenge!',
      'A new daily challenge is available. Complete it to maintain your streak!',
      {
        type: 'DAILY_CHALLENGE',
      },
      tomorrow
    );
  }

  /**
   * Get stats
   */
  getStats(): {
    totalCompleted: number;
    currentStreak: number;
    longestStreak: number;
    completionRate: number;
  } {
    const today = this.getTodayDateString();
    const firstChallengeDate = this.getFirstChallengeDate();

    // Calculate days since first challenge
    const daysSinceFirst = firstChallengeDate
      ? this.getDaysBetween(firstChallengeDate, today)
      : 0;

    // Count completed challenges
    let totalCompleted = 0;
    for (const [_, progress] of this.progress) {
      if (progress.completed) {
        totalCompleted++;
      }
    }

    // Calculate completion rate
    const completionRate =
      daysSinceFirst > 0 ? (totalCompleted / daysSinceFirst) * 100 : 0;

    return {
      totalCompleted,
      currentStreak: this.streak.current,
      longestStreak: this.streak.longest,
      completionRate: Math.round(completionRate),
    };
  }

  /**
   * Get first challenge date
   */
  private getFirstChallengeDate(): string | null {
    let oldest: string | null = null;

    for (const [challengeId, progress] of this.progress) {
      if (progress.completed) {
        // Extract date from challengeId (format: dc-YYYY-MM-DD)
        const date = challengeId.replace('dc-', '');
        if (!oldest || date < oldest) {
          oldest = date;
        }
      }
    }

    return oldest;
  }

  /**
   * Get days between two dates
   */
  private getDaysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}

export const dailyChallengeService = new DailyChallengeService();
