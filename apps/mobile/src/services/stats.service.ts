/**
 * Advanced Stats Service
 *
 * Tracks detailed player statistics and provides insights.
 * Used for stats screen with charts and trends.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface PlayerStats {
  // Overall stats
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  currentStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;

  // Time stats
  averageGameTimeMs: number;
  fastestWinMs: number;
  totalPlayTimeMs: number;

  // Earnings
  totalEarnings: number;
  totalLossAmount: number;
  netProfit: number;
  biggestWin: number;
  biggestLoss: number;

  // Game details
  averageMoves: number;
  perfectGames: number; // Games won without undo
  totalUndos: number;

  // Tier performance
  tierStats: TierStats[];

  // Recent performance
  last7Days: DailyStats[];
  last30Days: DailyStats[];
}

export interface TierStats {
  tier: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  averageTimeMs: number;
  totalEarnings: number;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  gamesPlayed: number;
  wins: number;
  losses: number;
  earnings: number;
}

export interface GameHistoryEntry {
  id: string;
  date: Date;
  tier: string;
  result: 'WIN' | 'LOSS';
  score: number;
  moves: number;
  timeMs: number;
  earnings: number;
  usedUndo: boolean;
}

export interface WinRateTrend {
  period: string; // Week/Month
  winRate: number;
  gamesPlayed: number;
}

export interface EarningsTrend {
  period: string;
  earnings: number;
  profit: number;
}

class StatsService {
  private stats: PlayerStats | null = null;
  private history: GameHistoryEntry[] = [];
  private loaded: boolean = false;

  /**
   * Initialize stats service
   */
  async initialize(): Promise<void> {
    await this.loadStats();
    await this.loadHistory();

    console.log('✅ Stats service initialized');
  }

  /**
   * Load stats from storage
   */
  private async loadStats(): Promise<void> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get('/stats');
      this.stats = response.data;
      */

      // Fallback: Load from storage
      const stored = await AsyncStorage.getItem('player_stats');
      if (stored) {
        this.stats = JSON.parse(stored);
      } else {
        this.stats = this.getDefaultStats();
      }

      this.loaded = true;
    } catch (error) {
      console.error('Failed to load stats:', error);
      this.stats = this.getDefaultStats();
    }
  }

  /**
   * Get default stats structure
   */
  private getDefaultStats(): PlayerStats {
    return {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      winRate: 0,
      currentStreak: 0,
      longestWinStreak: 0,
      longestLossStreak: 0,
      averageGameTimeMs: 0,
      fastestWinMs: 0,
      totalPlayTimeMs: 0,
      totalEarnings: 0,
      totalLossAmount: 0,
      netProfit: 0,
      biggestWin: 0,
      biggestLoss: 0,
      averageMoves: 0,
      perfectGames: 0,
      totalUndos: 0,
      tierStats: [],
      last7Days: [],
      last30Days: [],
    };
  }

  /**
   * Save stats to storage
   */
  private async saveStats(): Promise<void> {
    try {
      if (this.stats) {
        await AsyncStorage.setItem('player_stats', JSON.stringify(this.stats));
      }
    } catch (error) {
      console.error('Failed to save stats:', error);
    }
  }

  /**
   * Load game history
   */
  private async loadHistory(): Promise<void> {
    try {
      // TODO: Fetch from backend with pagination
      /* Example:
      const response = await api.get('/games/history', {
        params: { limit: 100 },
      });
      this.history = response.data;
      */

      const stored = await AsyncStorage.getItem('game_history');
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  /**
   * Save game history
   */
  private async saveHistory(): Promise<void> {
    try {
      // Keep only last 100 games in local storage
      const recentHistory = this.history.slice(0, 100);
      await AsyncStorage.setItem('game_history', JSON.stringify(recentHistory));
    } catch (error) {
      console.error('Failed to save history:', error);
    }
  }

  /**
   * Get player stats
   */
  getStats(): PlayerStats | null {
    return this.stats;
  }

  /**
   * Get game history
   */
  getHistory(limit?: number): GameHistoryEntry[] {
    if (limit) {
      return this.history.slice(0, limit);
    }
    return this.history;
  }

  /**
   * Record game result
   */
  async recordGame(
    tier: string,
    result: 'WIN' | 'LOSS',
    score: number,
    moves: number,
    timeMs: number,
    earnings: number,
    usedUndo: boolean
  ): Promise<void> {
    if (!this.stats) return;

    // Add to history
    const entry: GameHistoryEntry = {
      id: Date.now().toString(),
      date: new Date(),
      tier,
      result,
      score,
      moves,
      timeMs,
      earnings,
      usedUndo,
    };

    this.history.unshift(entry);
    await this.saveHistory();

    // Update overall stats
    this.stats.totalGames++;
    this.stats.totalPlayTimeMs += timeMs;

    if (result === 'WIN') {
      this.stats.totalWins++;
      this.stats.currentStreak++;

      if (this.stats.currentStreak > this.stats.longestWinStreak) {
        this.stats.longestWinStreak = this.stats.currentStreak;
      }

      if (!usedUndo) {
        this.stats.perfectGames++;
      }

      if (!this.stats.fastestWinMs || timeMs < this.stats.fastestWinMs) {
        this.stats.fastestWinMs = timeMs;
      }

      if (earnings > this.stats.biggestWin) {
        this.stats.biggestWin = earnings;
      }

      this.stats.totalEarnings += earnings;
    } else {
      this.stats.totalLosses++;

      // Reset win streak, track loss streak
      if (this.stats.currentStreak < 0) {
        this.stats.currentStreak--;
      } else {
        this.stats.currentStreak = -1;
      }

      if (Math.abs(this.stats.currentStreak) > this.stats.longestLossStreak) {
        this.stats.longestLossStreak = Math.abs(this.stats.currentStreak);
      }

      const loss = Math.abs(earnings); // Assuming negative earnings
      if (loss > this.stats.biggestLoss) {
        this.stats.biggestLoss = loss;
      }

      this.stats.totalLossAmount += loss;
    }

    // Calculate averages
    this.stats.winRate = (this.stats.totalWins / this.stats.totalGames) * 100;
    this.stats.averageGameTimeMs = this.stats.totalPlayTimeMs / this.stats.totalGames;
    this.stats.averageMoves = this.calculateAverageMoves();
    this.stats.netProfit = this.stats.totalEarnings - this.stats.totalLossAmount;

    // Update tier stats
    this.updateTierStats(tier, result, timeMs, earnings);

    // Update daily stats
    this.updateDailyStats(result, earnings);

    await this.saveStats();

    console.log(`📊 Game recorded: ${result} in ${tier}`);
  }

  /**
   * Calculate average moves from history
   */
  private calculateAverageMoves(): number {
    if (this.history.length === 0) return 0;

    const totalMoves = this.history.reduce((sum, game) => sum + game.moves, 0);
    return Math.round(totalMoves / this.history.length);
  }

  /**
   * Update tier-specific stats
   */
  private updateTierStats(
    tier: string,
    result: 'WIN' | 'LOSS',
    timeMs: number,
    earnings: number
  ): void {
    if (!this.stats) return;

    let tierStat = this.stats.tierStats.find((t) => t.tier === tier);

    if (!tierStat) {
      tierStat = {
        tier,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        averageTimeMs: 0,
        totalEarnings: 0,
      };
      this.stats.tierStats.push(tierStat);
    }

    tierStat.gamesPlayed++;
    if (result === 'WIN') {
      tierStat.wins++;
    } else {
      tierStat.losses++;
    }

    tierStat.winRate = (tierStat.wins / tierStat.gamesPlayed) * 100;

    // Update average time
    tierStat.averageTimeMs =
      (tierStat.averageTimeMs * (tierStat.gamesPlayed - 1) + timeMs) / tierStat.gamesPlayed;

    tierStat.totalEarnings += earnings;
  }

  /**
   * Update daily stats
   */
  private updateDailyStats(result: 'WIN' | 'LOSS', earnings: number): void {
    if (!this.stats) return;

    const today = new Date().toISOString().split('T')[0];

    // Update last 7 days
    let todayStats = this.stats.last7Days.find((d) => d.date === today);
    if (!todayStats) {
      todayStats = {
        date: today,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        earnings: 0,
      };
      this.stats.last7Days.unshift(todayStats);
      this.stats.last7Days = this.stats.last7Days.slice(0, 7);
    }

    todayStats.gamesPlayed++;
    if (result === 'WIN') {
      todayStats.wins++;
    } else {
      todayStats.losses++;
    }
    todayStats.earnings += earnings;

    // Update last 30 days (same logic)
    let todayStats30 = this.stats.last30Days.find((d) => d.date === today);
    if (!todayStats30) {
      todayStats30 = {
        date: today,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        earnings: 0,
      };
      this.stats.last30Days.unshift(todayStats30);
      this.stats.last30Days = this.stats.last30Days.slice(0, 30);
    }

    todayStats30.gamesPlayed++;
    if (result === 'WIN') {
      todayStats30.wins++;
    } else {
      todayStats30.losses++;
    }
    todayStats30.earnings += earnings;
  }

  /**
   * Get win rate trend (weekly)
   */
  getWinRateTrend(): WinRateTrend[] {
    if (!this.stats) return [];

    // Group by week
    const weeks: { [key: string]: { wins: number; total: number } } = {};

    this.history.forEach((game) => {
      const date = new Date(game.date);
      const week = this.getWeekString(date);

      if (!weeks[week]) {
        weeks[week] = { wins: 0, total: 0 };
      }

      weeks[week].total++;
      if (game.result === 'WIN') {
        weeks[week].wins++;
      }
    });

    // Convert to array and sort
    const trend: WinRateTrend[] = Object.entries(weeks)
      .map(([period, data]) => ({
        period,
        winRate: (data.wins / data.total) * 100,
        gamesPlayed: data.total,
      }))
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-12); // Last 12 weeks

    return trend;
  }

  /**
   * Get earnings trend (monthly)
   */
  getEarningsTrend(): EarningsTrend[] {
    if (!this.stats) return [];

    // Group by month
    const months: { [key: string]: { earnings: number; spent: number } } = {};

    this.history.forEach((game) => {
      const date = new Date(game.date);
      const month = this.getMonthString(date);

      if (!months[month]) {
        months[month] = { earnings: 0, spent: 0 };
      }

      if (game.result === 'WIN') {
        months[month].earnings += game.earnings;
      } else {
        months[month].spent += Math.abs(game.earnings);
      }
    });

    // Convert to array and sort
    const trend: EarningsTrend[] = Object.entries(months)
      .map(([period, data]) => ({
        period,
        earnings: data.earnings,
        profit: data.earnings - data.spent,
      }))
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-6); // Last 6 months

    return trend;
  }

  /**
   * Get week string (YYYY-Www)
   */
  private getWeekString(date: Date): string {
    const year = date.getFullYear();
    const onejan = new Date(year, 0, 1);
    const week = Math.ceil(((date.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  /**
   * Get month string (YYYY-MM)
   */
  private getMonthString(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  /**
   * Get head-to-head record against specific opponent
   */
  async getHeadToHead(opponentId: string): Promise<{
    wins: number;
    losses: number;
    winRate: number;
  } | null> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get(`/stats/head-to-head/${opponentId}`);
      return response.data;
      */

      return null;
    } catch (error) {
      console.error('Failed to get head-to-head stats:', error);
      return null;
    }
  }

  /**
   * Get performance by day of week
   */
  getPerformanceByDayOfWeek(): { day: string; winRate: number; gamesPlayed: number }[] {
    const dayStats: { [key: number]: { wins: number; total: number } } = {};

    this.history.forEach((game) => {
      const day = new Date(game.date).getDay(); // 0 = Sunday

      if (!dayStats[day]) {
        dayStats[day] = { wins: 0, total: 0 };
      }

      dayStats[day].total++;
      if (game.result === 'WIN') {
        dayStats[day].wins++;
      }
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return dayNames.map((day, index) => {
      const stats = dayStats[index] || { wins: 0, total: 0 };
      return {
        day,
        winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
        gamesPlayed: stats.total,
      };
    });
  }

  /**
   * Get performance by time of day
   */
  getPerformanceByTimeOfDay(): { hour: number; winRate: number; gamesPlayed: number }[] {
    const hourStats: { [key: number]: { wins: number; total: number } } = {};

    this.history.forEach((game) => {
      const hour = new Date(game.date).getHours();

      if (!hourStats[hour]) {
        hourStats[hour] = { wins: 0, total: 0 };
      }

      hourStats[hour].total++;
      if (game.result === 'WIN') {
        hourStats[hour].wins++;
      }
    });

    return Array.from({ length: 24 }, (_, hour) => {
      const stats = hourStats[hour] || { wins: 0, total: 0 };
      return {
        hour,
        winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0,
        gamesPlayed: stats.total,
      };
    });
  }

  /**
   * Refresh stats from backend
   */
  async refresh(): Promise<void> {
    await this.loadStats();
    await this.loadHistory();
  }
}

export const statsService = new StatsService();
