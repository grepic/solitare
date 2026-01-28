import { Platform } from 'react-native';
import api from './api';

import type {
  Notification as ExpoNotification,
  NotificationResponse as ExpoNotificationResponse,
  Subscription as ExpoNotificationSubscription,
} from 'expo-notifications';

type NotificationModule = typeof import('expo-notifications');
type DeviceModule = typeof import('expo-device');

type NotificationSubscription = Pick<ExpoNotificationSubscription, 'remove'>;

let cachedNotifications: NotificationModule | null = null;
let cachedDevice: DeviceModule | null = null;
let didConfigureHandler = false;

function getNotifications(): NotificationModule | null {
  if (Platform.OS === 'web') return null;
  if (cachedNotifications) return cachedNotifications;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cachedNotifications = require('expo-notifications');
    return cachedNotifications;
  } catch {
    return null;
  }
}

function getDevice(): DeviceModule | null {
  if (Platform.OS === 'web') return null;
  if (cachedDevice) return cachedDevice;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    cachedDevice = require('expo-device');
    return cachedDevice;
  } catch {
    return null;
  }
}

function ensureNotificationHandlerConfigured(): void {
  const Notifications = getNotifications();
  if (!Notifications) return;
  if (didConfigureHandler) return;
  didConfigureHandler = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const Notifications = getNotifications();
  const Device = getDevice();
  if (!Notifications || !Device) return null;

  ensureNotificationHandlerConfigured();

  if (!Device.isDevice) {
    console.log('Push notifications only work on physical devices');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission for push notifications denied');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id', // Replace with actual Expo project ID
    });

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

export async function savePushToken(token: string) {
  try {
    await api.post('/me/push-token', { token });
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

export async function scheduleLocalNotification(title: string, body: string, data?: any) {
  const Notifications = getNotifications();
  if (!Notifications) return;

  ensureNotificationHandlerConfigured();

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Show immediately
  });
}

export function addNotificationReceivedListener(
  listener: (notification: ExpoNotification) => void
) {
  const Notifications = getNotifications();
  if (!Notifications) return { remove: () => undefined } satisfies NotificationSubscription;

  ensureNotificationHandlerConfigured();

  return Notifications.addNotificationReceivedListener(listener);
}

export function addNotificationResponseReceivedListener(
  listener: (response: ExpoNotificationResponse) => void
) {
  const Notifications = getNotifications();
  if (!Notifications) return { remove: () => undefined } satisfies NotificationSubscription;

  ensureNotificationHandlerConfigured();

  return Notifications.addNotificationResponseReceivedListener(listener);
}
