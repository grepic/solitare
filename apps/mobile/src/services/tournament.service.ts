/**
 * Tournament System Service
 *
 * Manages tournaments, brackets, and competitive events.
 * Supports various tournament formats.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { analyticsService } from './analytics.service';
import { notificationService } from './notification.service';

export type TournamentFormat = 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION' | 'ROUND_ROBIN' | 'SWISS';
export type TournamentStatus = 'UPCOMING' | 'REGISTRATION' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface Tournament {
  id: string;
  name: string;
  description: string;
  format: TournamentFormat;
  status: TournamentStatus;

  // Timing
  registrationStart: Date;
  registrationEnd: Date;
  startTime: Date;
  endTime?: Date;

  // Participants
  minParticipants: number;
  maxParticipants: number;
  currentParticipants: number;
  participants: TournamentParticipant[];

  // Prize pool
  entryFee: number; // In cents
  prizePool: number;
  prizeDistribution: PrizeDistribution[];

  // Rules
  tier: string;
  rounds: number;
  timeLimit?: number; // Time limit per game in seconds

  // Metadata
  imageUrl?: string;
  isSponsored: boolean;
  sponsorName?: string;
  createdBy: string;
}

export interface TournamentParticipant {
  userId: string;
  username: string;
  avatar?: string;
  rank: number;
  seed: number;
  wins: number;
  losses: number;
  eliminated: boolean;
  currentRound: number;
}

export interface PrizeDistribution {
  position: number;
  amount: number;
  percentage: number;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: number;
  matchNumber: number;
  player1?: TournamentParticipant;
  player2?: TournamentParticipant;
  winner?: string; // userId
  score?: {
    player1: number;
    player2: number;
  };
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  startTime?: Date;
  endTime?: Date;
}

export interface TournamentBracket {
  tournamentId: string;
  format: TournamentFormat;
  rounds: TournamentMatch[][];
  currentRound: number;
}

export interface TournamentStanding {
  userId: string;
  username: string;
  avatar?: string;
  rank: number;
  wins: number;
  losses: number;
  points: number;
  buchholz?: number; // For Swiss format
}

class TournamentService {
  private tournaments: Map<string, Tournament> = new Map();
  private brackets: Map<string, TournamentBracket> = new Map();
  private userTournaments: string[] = []; // Tournament IDs user is registered for
  private loaded: boolean = false;

  /**
   * Initialize tournament service
   */
  async initialize(): Promise<void> {
    await this.loadTournaments();
    await this.loadUserTournaments();

    console.log('✅ Tournament service initialized');
  }

  /**
   * Load tournaments
   */
  private async loadTournaments(): Promise<void> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get('/tournaments', {
        params: { status: 'UPCOMING,REGISTRATION,IN_PROGRESS' },
      });
      response.data.forEach((tournament: Tournament) => {
        this.tournaments.set(tournament.id, tournament);
      });
      */

      // Fallback: Load from storage
      const stored = await AsyncStorage.getItem('tournaments');
      if (stored) {
        const tournaments: Tournament[] = JSON.parse(stored);
        tournaments.forEach((t) => {
          this.tournaments.set(t.id, t);
        });
      }

      this.loaded = true;
    } catch (error) {
      console.error('Failed to load tournaments:', error);
    }
  }

  /**
   * Save tournaments to storage
   */
  private async saveTournaments(): Promise<void> {
    try {
      const tournaments = Array.from(this.tournaments.values());
      await AsyncStorage.setItem('tournaments', JSON.stringify(tournaments));
    } catch (error) {
      console.error('Failed to save tournaments:', error);
    }
  }

  /**
   * Load user's registered tournaments
   */
  private async loadUserTournaments(): Promise<void> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get('/tournaments/my');
      this.userTournaments = response.data.map((t: Tournament) => t.id);
      */

      const stored = await AsyncStorage.getItem('user_tournaments');
      if (stored) {
        this.userTournaments = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load user tournaments:', error);
    }
  }

  /**
   * Save user tournaments
   */
  private async saveUserTournaments(): Promise<void> {
    try {
      await AsyncStorage.setItem('user_tournaments', JSON.stringify(this.userTournaments));
    } catch (error) {
      console.error('Failed to save user tournaments:', error);
    }
  }

  /**
   * Get all active tournaments
   */
  getTournaments(): Tournament[] {
    return Array.from(this.tournaments.values()).sort((a, b) => {
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }

  /**
   * Get tournaments by status
   */
  getTournamentsByStatus(status: TournamentStatus): Tournament[] {
    return this.getTournaments().filter((t) => t.status === status);
  }

  /**
   * Get tournament by ID
   */
  getTournament(tournamentId: string): Tournament | null {
    return this.tournaments.get(tournamentId) || null;
  }

  /**
   * Get user's registered tournaments
   */
  getUserTournaments(): Tournament[] {
    return this.userTournaments
      .map((id) => this.tournaments.get(id))
      .filter((t): t is Tournament => t !== undefined);
  }

  /**
   * Check if user is registered for tournament
   */
  isRegistered(tournamentId: string): boolean {
    return this.userTournaments.includes(tournamentId);
  }

  /**
   * Register for tournament
   */
  async registerForTournament(tournamentId: string): Promise<boolean> {
    try {
      const tournament = this.tournaments.get(tournamentId);
      if (!tournament) {
        console.error('Tournament not found');
        return false;
      }

      // Check if registration is open
      if (tournament.status !== 'REGISTRATION') {
        console.error('Registration is not open');
        return false;
      }

      // Check if tournament is full
      if (tournament.currentParticipants >= tournament.maxParticipants) {
        console.error('Tournament is full');
        return false;
      }

      // Check if already registered
      if (this.isRegistered(tournamentId)) {
        console.error('Already registered');
        return false;
      }

      // TODO: Register on backend
      /* Example:
      await api.post(`/tournaments/${tournamentId}/register`);
      */

      // Update locally
      this.userTournaments.push(tournamentId);
      await this.saveUserTournaments();

      tournament.currentParticipants++;
      await this.saveTournaments();

      // Schedule notification for tournament start
      const notificationTime = new Date(tournament.startTime);
      notificationTime.setMinutes(notificationTime.getMinutes() - 15); // 15 min before

      await notificationService.scheduleNotification(
        '🏆 Tournament Starting Soon!',
        `${tournament.name} starts in 15 minutes!`,
        {
          type: 'TOURNAMENT_STARTING',
          tournamentId,
        },
        notificationTime
      );

      // Track analytics
      await analyticsService.logEvent('tournament_registered', {
        tournament_id: tournamentId,
        tournament_name: tournament.name,
        entry_fee: tournament.entryFee,
      });

      console.log(`✅ Registered for tournament ${tournament.name}`);
      return true;
    } catch (error) {
      console.error('Failed to register for tournament:', error);
      return false;
    }
  }

  /**
   * Unregister from tournament
   */
  async unregisterFromTournament(tournamentId: string): Promise<boolean> {
    try {
      const tournament = this.tournaments.get(tournamentId);
      if (!tournament) {
        console.error('Tournament not found');
        return false;
      }

      // Check if tournament has started
      if (tournament.status === 'IN_PROGRESS' || tournament.status === 'COMPLETED') {
        console.error('Cannot unregister from started tournament');
        return false;
      }

      // TODO: Unregister on backend
      /* Example:
      await api.delete(`/tournaments/${tournamentId}/register`);
      */

      // Update locally
      this.userTournaments = this.userTournaments.filter((id) => id !== tournamentId);
      await this.saveUserTournaments();

      tournament.currentParticipants--;
      await this.saveTournaments();

      // Track analytics
      await analyticsService.logEvent('tournament_unregistered', {
        tournament_id: tournamentId,
      });

      console.log(`✅ Unregistered from tournament ${tournament.name}`);
      return true;
    } catch (error) {
      console.error('Failed to unregister from tournament:', error);
      return false;
    }
  }

  /**
   * Get tournament bracket
   */
  async getBracket(tournamentId: string): Promise<TournamentBracket | null> {
    try {
      // Check cache
      if (this.brackets.has(tournamentId)) {
        return this.brackets.get(tournamentId)!;
      }

      // TODO: Fetch from backend
      /* Example:
      const response = await api.get(`/tournaments/${tournamentId}/bracket`);
      const bracket = response.data;
      this.brackets.set(tournamentId, bracket);
      return bracket;
      */

      return null;
    } catch (error) {
      console.error('Failed to get bracket:', error);
      return null;
    }
  }

  /**
   * Get tournament standings
   */
  async getStandings(tournamentId: string): Promise<TournamentStanding[]> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get(`/tournaments/${tournamentId}/standings`);
      return response.data;
      */

      return [];
    } catch (error) {
      console.error('Failed to get standings:', error);
      return [];
    }
  }

  /**
   * Get user's current match
   */
  async getCurrentMatch(tournamentId: string): Promise<TournamentMatch | null> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get(`/tournaments/${tournamentId}/my-match`);
      return response.data;
      */

      return null;
    } catch (error) {
      console.error('Failed to get current match:', error);
      return null;
    }
  }

  /**
   * Report match result
   */
  async reportMatchResult(
    tournamentId: string,
    matchId: string,
    winnerId: string,
    score: { player1: number; player2: number }
  ): Promise<boolean> {
    try {
      // TODO: Report to backend
      /* Example:
      await api.post(`/tournaments/${tournamentId}/matches/${matchId}/result`, {
        winnerId,
        score,
      });
      */

      // Track analytics
      await analyticsService.logEvent('tournament_match_completed', {
        tournament_id: tournamentId,
        match_id: matchId,
      });

      console.log(`✅ Match result reported for tournament ${tournamentId}`);
      return true;
    } catch (error) {
      console.error('Failed to report match result:', error);
      return false;
    }
  }

  /**
   * Get tournament history
   */
  async getHistory(limit: number = 10): Promise<Tournament[]> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get('/tournaments/history', {
        params: { limit },
      });
      return response.data;
      */

      return [];
    } catch (error) {
      console.error('Failed to get tournament history:', error);
      return [];
    }
  }

  /**
   * Get tournament prize money won by user
   */
  async getTotalWinnings(): Promise<number> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get('/tournaments/winnings');
      return response.data.total;
      */

      return 0;
    } catch (error) {
      console.error('Failed to get winnings:', error);
      return 0;
    }
  }

  /**
   * Create tournament (for premium users)
   */
  async createTournament(tournament: Partial<Tournament>): Promise<string | null> {
    try {
      // TODO: Create on backend
      /* Example:
      const response = await api.post('/tournaments', tournament);
      const newTournament = response.data;
      this.tournaments.set(newTournament.id, newTournament);
      await this.saveTournaments();
      return newTournament.id;
      */

      // Track analytics
      await analyticsService.logEvent('tournament_created', {
        name: tournament.name,
        format: tournament.format,
        entry_fee: tournament.entryFee,
      });

      return null;
    } catch (error) {
      console.error('Failed to create tournament:', error);
      return null;
    }
  }

  /**
   * Refresh tournaments from server
   */
  async refresh(): Promise<void> {
    await this.loadTournaments();
    await this.loadUserTournaments();
  }

  /**
   * Get recommended tournaments for user
   */
  async getRecommended(): Promise<Tournament[]> {
    try {
      // TODO: Fetch from backend (based on user skill level, preferences)
      /* Example:
      const response = await api.get('/tournaments/recommended');
      return response.data;
      */

      // Fallback: Return upcoming tournaments
      return this.getTournamentsByStatus('REGISTRATION').slice(0, 5);
    } catch (error) {
      console.error('Failed to get recommended tournaments:', error);
      return [];
    }
  }
}

export const tournamentService = new TournamentService();
