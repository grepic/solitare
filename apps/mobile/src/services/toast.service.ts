/**
 * Toast Notification Service
 *
 * Provides user-friendly toast messages for success, error, info, and warning states.
 * Use this instead of Alert.alert() for better UX.
 */

import { Alert } from 'react-native';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  title?: string;
  message: string;
  duration?: number;
  type?: ToastType;
}

class ToastService {
  /**
   * Show success toast
   */
  success(message: string, title?: string) {
    this.show({
      type: 'success',
      title: title || 'Success',
      message,
      duration: 3000,
    });
  }

  /**
   * Show error toast
   */
  error(message: string, title?: string) {
    this.show({
      type: 'error',
      title: title || 'Error',
      message,
      duration: 4000,
    });
  }

  /**
   * Show info toast
   */
  info(message: string, title?: string) {
    this.show({
      type: 'info',
      title: title || 'Info',
      message,
      duration: 3000,
    });
  }

  /**
   * Show warning toast
   */
  warning(message: string, title?: string) {
    this.show({
      type: 'warning',
      title: title || 'Warning',
      message,
      duration: 3500,
    });
  }

  /**
   * Show generic toast
   *
   * TODO: Replace Alert.alert with actual toast library
   * Recommended: react-native-toast-message or react-native-flash-message
   */
  private show(options: ToastOptions) {
    const { title, message, type } = options;

    // Get emoji based on type
    const emoji = this.getEmoji(type || 'info');

    // Temporary implementation using Alert
    // TODO: Replace with proper toast library
    Alert.alert(
      `${emoji} ${title}`,
      message,
      [{ text: 'OK' }],
      { cancelable: true }
    );

    // Future implementation with toast library:
    /*
    Toast.show({
      type: type || 'info',
      text1: title,
      text2: message,
      position: 'bottom',
      visibilityTime: options.duration || 3000,
      autoHide: true,
      topOffset: 30,
      bottomOffset: 40,
    });
    */
  }

  /**
   * Get emoji for toast type
   */
  private getEmoji(type: ToastType): string {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  }

  /**
   * Show network error toast with retry option
   */
  networkError(onRetry?: () => void) {
    if (onRetry) {
      Alert.alert(
        '🌐 Network Error',
        'Unable to connect. Please check your internet connection.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: onRetry },
        ]
      );
    } else {
      this.error('Unable to connect. Please check your internet connection.', 'Network Error');
    }
  }

  /**
   * Show session expired toast
   */
  sessionExpired(onLogin: () => void) {
    Alert.alert(
      '🔒 Session Expired',
      'Your session has expired. Please log in again.',
      [{ text: 'Log In', onPress: onLogin }]
    );
  }
}

export const toastService = new ToastService();
