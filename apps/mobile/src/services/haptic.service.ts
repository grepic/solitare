import { Platform } from 'react-native';

type HapticsModule = typeof import('expo-haptics');

function getHaptics(): HapticsModule | null {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-haptics') as HapticsModule;
  } catch {
    return null;
  }
}

/**
 * Haptic Feedback Service
 * Provides tactile feedback for game interactions
 */
class HapticService {
  private enabled: boolean = true;

  /**
   * Light impact - for card selection
   */
  light() {
    if (!this.enabled) return;
    const Haptics = getHaptics();
    if (!Haptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  /**
   * Medium impact - for card drops
   */
  medium() {
    if (!this.enabled) return;
    const Haptics = getHaptics();
    if (!Haptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  /**
   * Heavy impact - for important actions
   */
  heavy() {
    if (!this.enabled) return;
    const Haptics = getHaptics();
    if (!Haptics) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  /**
   * Success notification - for valid moves
   */
  success() {
    if (!this.enabled) return;
    const Haptics = getHaptics();
    if (!Haptics) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  /**
   * Warning notification - for invalid moves
   */
  warning() {
    if (!this.enabled) return;
    const Haptics = getHaptics();
    if (!Haptics) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  /**
   * Error notification - for errors
   */
  error() {
    if (!this.enabled) return;
    const Haptics = getHaptics();
    if (!Haptics) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  /**
   * Selection feedback - for UI interactions
   */
  selection() {
    if (!this.enabled) return;
    const Haptics = getHaptics();
    if (!Haptics) return;
    Haptics.selectionAsync();
  }

  /**
   * Card picked up
   */
  cardPickup() {
    this.light();
  }

  /**
   * Card dropped successfully
   */
  cardDrop() {
    this.medium();
  }

  /**
   * Card snapped to foundation
   */
  cardSnap() {
    this.success();
  }

  /**
   * Invalid move
   */
  invalidMove() {
    this.error();
  }

  /**
   * Win celebration - multi-tap pattern
   */
  async winCelebration() {
    if (!this.enabled) return;

    const Haptics = getHaptics();
    if (!Haptics) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise(resolve => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await new Promise(resolve => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  /**
   * Button tap
   */
  buttonTap() {
    this.light();
  }

  /**
   * Enable/disable haptic feedback
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }
}

export const hapticService = new HapticService();
