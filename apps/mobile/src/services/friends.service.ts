/**
 * Friends System Service
 *
 * Manages friend relationships, friend requests, and social features.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { analyticsService } from './analytics.service';
import { notificationService } from './notification.service';

export interface Friend {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  status: 'ONLINE' | 'OFFLINE' | 'IN_GAME';
  lastSeen?: Date;
  friendsSince: Date;
  stats?: {
    totalGames: number;
    wins: number;
    winRate: number;
  };
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromAvatar?: string;
  toUserId: string;
  message?: string;
  createdAt: Date;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}

export interface FriendSearchResult {
  userId: string;
  username: string;
  avatar?: string;
  mutualFriends: number;
  isFriend: boolean;
  hasPendingRequest: boolean;
}

class FriendsService {
  private friends: Friend[] = [];
  private friendRequests: FriendRequest[] = [];
  private blockedUsers: string[] = [];
  private loaded: boolean = false;

  /**
   * Initialize friends service
   */
  async initialize(): Promise<void> {
    await this.loadFriends();
    await this.loadFriendRequests();
    await this.loadBlockedUsers();

    console.log('✅ Friends service initialized');
  }

  /**
   * Load friends list
   */
  private async loadFriends(): Promise<void> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get('/friends');
      this.friends = response.data;
      */

      // Fallback: Load from storage
      const stored = await AsyncStorage.getItem('friends_list');
      if (stored) {
        this.friends = JSON.parse(stored);
      }

      this.loaded = true;
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  }

  /**
   * Save friends to storage
   */
  private async saveFriends(): Promise<void> {
    try {
      await AsyncStorage.setItem('friends_list', JSON.stringify(this.friends));
    } catch (error) {
      console.error('Failed to save friends:', error);
    }
  }

  /**
   * Load friend requests
   */
  private async loadFriendRequests(): Promise<void> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get('/friends/requests');
      this.friendRequests = response.data;
      */

      const stored = await AsyncStorage.getItem('friend_requests');
      if (stored) {
        this.friendRequests = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load friend requests:', error);
    }
  }

  /**
   * Save friend requests to storage
   */
  private async saveFriendRequests(): Promise<void> {
    try {
      await AsyncStorage.setItem('friend_requests', JSON.stringify(this.friendRequests));
    } catch (error) {
      console.error('Failed to save friend requests:', error);
    }
  }

  /**
   * Load blocked users
   */
  private async loadBlockedUsers(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('blocked_users');
      if (stored) {
        this.blockedUsers = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load blocked users:', error);
    }
  }

  /**
   * Save blocked users to storage
   */
  private async saveBlockedUsers(): Promise<void> {
    try {
      await AsyncStorage.setItem('blocked_users', JSON.stringify(this.blockedUsers));
    } catch (error) {
      console.error('Failed to save blocked users:', error);
    }
  }

  /**
   * Get all friends
   */
  getFriends(): Friend[] {
    return this.friends;
  }

  /**
   * Get online friends
   */
  getOnlineFriends(): Friend[] {
    return this.friends.filter((f) => f.status === 'ONLINE' || f.status === 'IN_GAME');
  }

  /**
   * Get friend by ID
   */
  getFriend(userId: string): Friend | null {
    return this.friends.find((f) => f.userId === userId) || null;
  }

  /**
   * Check if user is friend
   */
  isFriend(userId: string): boolean {
    return this.friends.some((f) => f.userId === userId);
  }

  /**
   * Get pending friend requests (received)
   */
  getPendingRequests(): FriendRequest[] {
    return this.friendRequests.filter((r) => r.status === 'PENDING');
  }

  /**
   * Get sent friend requests
   */
  getSentRequests(): FriendRequest[] {
    // TODO: Track sent requests
    return [];
  }

  /**
   * Send friend request
   */
  async sendFriendRequest(userId: string, message?: string): Promise<boolean> {
    try {
      // Check if already friends
      if (this.isFriend(userId)) {
        console.warn('User is already a friend');
        return false;
      }

      // Check if blocked
      if (this.blockedUsers.includes(userId)) {
        console.warn('User is blocked');
        return false;
      }

      // TODO: Send to backend
      /* Example:
      const response = await api.post('/friends/request', {
        toUserId: userId,
        message,
      });
      */

      // Track analytics
      await analyticsService.logEvent('friend_request_sent', { to_user: userId });

      console.log(`✅ Friend request sent to user ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to send friend request:', error);
      return false;
    }
  }

  /**
   * Accept friend request
   */
  async acceptFriendRequest(requestId: string): Promise<boolean> {
    try {
      const request = this.friendRequests.find((r) => r.id === requestId);
      if (!request) {
        console.error('Friend request not found');
        return false;
      }

      // TODO: Accept on backend
      /* Example:
      await api.post(`/friends/request/${requestId}/accept`);
      */

      // Update request status
      request.status = 'ACCEPTED';
      await this.saveFriendRequests();

      // Add to friends list
      const newFriend: Friend = {
        id: requestId,
        userId: request.fromUserId,
        username: request.fromUsername,
        avatar: request.fromAvatar,
        status: 'OFFLINE',
        friendsSince: new Date(),
      };

      this.friends.push(newFriend);
      await this.saveFriends();

      // Send notification to other user
      await notificationService.sendNotification(
        '🤝 Friend Request Accepted!',
        `${request.fromUsername} is now your friend!`,
        {
          type: 'FRIEND_ACCEPTED',
          userId: request.fromUserId,
        }
      );

      // Track analytics
      await analyticsService.logEvent('friend_request_accepted', {
        from_user: request.fromUserId,
      });

      console.log(`✅ Friend request accepted from ${request.fromUsername}`);
      return true;
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      return false;
    }
  }

  /**
   * Decline friend request
   */
  async declineFriendRequest(requestId: string): Promise<boolean> {
    try {
      const request = this.friendRequests.find((r) => r.id === requestId);
      if (!request) {
        console.error('Friend request not found');
        return false;
      }

      // TODO: Decline on backend
      /* Example:
      await api.post(`/friends/request/${requestId}/decline`);
      */

      // Update request status
      request.status = 'DECLINED';
      await this.saveFriendRequests();

      // Track analytics
      await analyticsService.logEvent('friend_request_declined', {
        from_user: request.fromUserId,
      });

      console.log(`✅ Friend request declined from ${request.fromUsername}`);
      return true;
    } catch (error) {
      console.error('Failed to decline friend request:', error);
      return false;
    }
  }

  /**
   * Remove friend
   */
  async removeFriend(userId: string): Promise<boolean> {
    try {
      // TODO: Remove on backend
      /* Example:
      await api.delete(`/friends/${userId}`);
      */

      // Remove from local list
      this.friends = this.friends.filter((f) => f.userId !== userId);
      await this.saveFriends();

      // Track analytics
      await analyticsService.logEvent('friend_removed', { user_id: userId });

      console.log(`✅ Friend removed: ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to remove friend:', error);
      return false;
    }
  }

  /**
   * Block user
   */
  async blockUser(userId: string): Promise<boolean> {
    try {
      // TODO: Block on backend
      /* Example:
      await api.post('/users/block', { userId });
      */

      // Add to blocked list
      if (!this.blockedUsers.includes(userId)) {
        this.blockedUsers.push(userId);
        await this.saveBlockedUsers();
      }

      // Remove from friends if friend
      await this.removeFriend(userId);

      // Track analytics
      await analyticsService.logEvent('user_blocked', { user_id: userId });

      console.log(`✅ User blocked: ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to block user:', error);
      return false;
    }
  }

  /**
   * Unblock user
   */
  async unblockUser(userId: string): Promise<boolean> {
    try {
      // TODO: Unblock on backend
      /* Example:
      await api.post('/users/unblock', { userId });
      */

      // Remove from blocked list
      this.blockedUsers = this.blockedUsers.filter((id) => id !== userId);
      await this.saveBlockedUsers();

      // Track analytics
      await analyticsService.logEvent('user_unblocked', { user_id: userId });

      console.log(`✅ User unblocked: ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to unblock user:', error);
      return false;
    }
  }

  /**
   * Search for users
   */
  async searchUsers(query: string): Promise<FriendSearchResult[]> {
    try {
      // TODO: Search on backend
      /* Example:
      const response = await api.get('/users/search', {
        params: { q: query, limit: 20 },
      });
      return response.data;
      */

      return [];
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }

  /**
   * Get suggested friends (based on mutual friends, recent opponents, etc.)
   */
  async getSuggestedFriends(): Promise<FriendSearchResult[]> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get('/friends/suggestions');
      return response.data;
      */

      return [];
    } catch (error) {
      console.error('Failed to get suggested friends:', error);
      return [];
    }
  }

  /**
   * Invite friend to game
   */
  async inviteToGame(friendId: string, gameType: string): Promise<boolean> {
    try {
      // TODO: Send invitation via backend
      /* Example:
      await api.post('/friends/invite', {
        friendId,
        gameType,
      });
      */

      // Track analytics
      await analyticsService.logEvent('friend_invited_to_game', {
        friend_id: friendId,
        game_type: gameType,
      });

      console.log(`✅ Game invitation sent to friend ${friendId}`);
      return true;
    } catch (error) {
      console.error('Failed to invite friend:', error);
      return false;
    }
  }

  /**
   * Get friend activity (recent games, achievements, etc.)
   */
  async getFriendActivity(friendId: string): Promise<any[]> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get(`/friends/${friendId}/activity`);
      return response.data;
      */

      return [];
    } catch (error) {
      console.error('Failed to get friend activity:', error);
      return [];
    }
  }

  /**
   * Update friend status (when they come online/offline)
   */
  updateFriendStatus(friendId: string, status: Friend['status']): void {
    const friend = this.friends.find((f) => f.userId === friendId);
    if (friend) {
      friend.status = status;
      if (status === 'OFFLINE') {
        friend.lastSeen = new Date();
      }
      this.saveFriends();
    }
  }

  /**
   * Get blocked users
   */
  getBlockedUsers(): string[] {
    return this.blockedUsers;
  }

  /**
   * Check if user is blocked
   */
  isBlocked(userId: string): boolean {
    return this.blockedUsers.includes(userId);
  }

  /**
   * Refresh friends list from server
   */
  async refresh(): Promise<void> {
    await this.loadFriends();
    await this.loadFriendRequests();
  }

  /**
   * Get friend stats comparison
   */
  async getFriendComparison(friendId: string): Promise<{
    you: any;
    friend: any;
    comparison: {
      winRateDiff: number;
      totalGamesDiff: number;
      streakDiff: number;
    };
  } | null> {
    try {
      // TODO: Fetch from backend
      /* Example:
      const response = await api.get(`/friends/${friendId}/compare`);
      return response.data;
      */

      return null;
    } catch (error) {
      console.error('Failed to get friend comparison:', error);
      return null;
    }
  }
}

export const friendsService = new FriendsService();
