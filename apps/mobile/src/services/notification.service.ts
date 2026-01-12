/**
 * Push Notification Service
 *
 * Handles push notifications using Expo Notifications.
 * Supports local and remote notifications.
 *
 * TODO: Install expo-notifications package:
 * npm install expo-notifications expo-device expo-constants
 */

import { Platform } from 'react-native';
// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';
// import Constants from 'expo-constants';

// Placeholder types until expo-notifications is installed
type NotificationRequest = any;
type NotificationResponse = any;

class NotificationService {
  private pushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize notification service
   * Request permissions and register device
   */
  async initialize(): Promise<void> {
    console.log('📲 Initializing notification service...');

    /* TODO: Uncomment after installing expo-notifications

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Register for push notifications
    this.pushToken = await this.registerForPushNotifications();

    if (this.pushToken) {
      console.log('✅ Push token:', this.pushToken);
      // TODO: Send token to backend
      await this.sendTokenToBackend(this.pushToken);
    }

    // Listen for notifications
    this.notificationListener = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived
    );

    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse
    );

    */

    console.log('⚠️ expo-notifications not installed. Install with:');
    console.log('  npm install expo-notifications expo-device expo-constants');
  }

  /**
   * Register device for push notifications
   */
  private async registerForPushNotifications(): Promise<string | null> {
    /* TODO: Uncomment after installing expo-notifications

    if (!Device.isDevice) {
      console.warn('⚠️ Push notifications only work on physical devices');
      return null;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('⚠️ Failed to get push notification permissions');
      return null;
    }

    // Get push token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId,
    });

    // Android-specific channel setup
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token.data;
    */

    return null;
  }

  /**
   * Send push token to backend
   */
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      // TODO: Send to your backend API
      console.log('📤 Sending push token to backend:', token);

      /* Example:
      await api.post('/users/push-token', {
        token,
        platform: Platform.OS,
      });
      */
    } catch (error) {
      console.error('❌ Failed to send push token:', error);
    }
  }

  /**
   * Handle notification received while app is foregrounded
   */
  private handleNotificationReceived = (notification: NotificationRequest) => {
    console.log('📬 Notification received:', notification);

    // TODO: Custom handling based on notification type
    const data = notification.request.content.data;

    switch (data?.type) {
      case 'MATCH_FOUND':
        // Navigate to game screen
        break;
      case 'YOUR_TURN':
        // Show reminder
        break;
      case 'MATCH_ENDED':
        // Show results
        break;
      default:
        // Generic notification
        break;
    }
  };

  /**
   * Handle notification tap (app opened from notification)
   */
  private handleNotificationResponse = (response: NotificationResponse) => {
    console.log('👆 Notification tapped:', response);

    const data = response.notification.request.content.data;

    // TODO: Navigate to appropriate screen based on notification type
    switch (data?.type) {
      case 'MATCH_FOUND':
        // Navigate to Game screen with matchId
        // navigation.navigate('Game', { matchId: data.matchId });
        break;
      case 'MATCH_ENDED':
        // Navigate to Replay screen
        // navigation.navigate('Replay', { matchId: data.matchId });
        break;
      default:
        break;
    }
  };

  /**
   * Schedule local notification
   *
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Optional data payload
   * @param trigger - When to show (seconds from now, or specific time)
   */
  async scheduleNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    trigger: number | Date = 0
  ): Promise<void> {
    /* TODO: Uncomment after installing expo-notifications

    const triggerConfig = typeof trigger === 'number'
      ? { seconds: trigger }
      : { date: trigger };

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: triggerConfig,
    });

    */

    console.log(`📅 Would schedule notification: "${title}" - "${body}"`);
  }

  /**
   * Send immediate local notification
   */
  async sendNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    await this.scheduleNotification(title, body, data, 0);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    /* TODO: Uncomment after installing expo-notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    */
    console.log('🗑️ Would cancel all notifications');
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    /* TODO: Uncomment after installing expo-notifications
    return await Notifications.getBadgeCountAsync();
    */
    return 0;
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    /* TODO: Uncomment after installing expo-notifications
    await Notifications.setBadgeCountAsync(count);
    */
    console.log(`📛 Would set badge count to ${count}`);
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  /**
   * Cleanup notification service
   */
  cleanup(): void {
    /* TODO: Uncomment after installing expo-notifications

    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }

    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }

    */

    console.log('🧹 Notification service cleaned up');
  }

  /**
   * Get push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }
}

export const notificationService = new NotificationService();

// Notification types for backend
export enum NotificationType {
  MATCH_FOUND = 'MATCH_FOUND',
  YOUR_TURN = 'YOUR_TURN',
  MATCH_ENDED = 'MATCH_ENDED',
  DAILY_CHALLENGE = 'DAILY_CHALLENGE',
  ACHIEVEMENT_UNLOCKED = 'ACHIEVEMENT_UNLOCKED',
  WALLET_DEPOSIT = 'WALLET_DEPOSIT',
  WALLET_WITHDRAWAL = 'WALLET_WITHDRAWAL',
  TOURNAMENT_STARTING = 'TOURNAMENT_STARTING',
  LEADERBOARD_RANK = 'LEADERBOARD_RANK',
}
