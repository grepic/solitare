import { Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';

/**
 * Sound Manager for game audio
 * Handles card sounds, win celebration, and background music
 */
class SoundService {
  private sounds: Map<string, Sound> = new Map();
  private enabled: boolean = true;
  private volume: number = 1.0;

  // Sound IDs
  static readonly CARD_FLIP = 'card_flip';
  static readonly CARD_SNAP = 'card_snap';
  static readonly CARD_SLIDE = 'card_slide';
  static readonly WIN_FANFARE = 'win_fanfare';
  static readonly BUTTON_TAP = 'button_tap';
  static readonly ERROR_BUZZ = 'error_buzz';
  static readonly DRAW_CARD = 'draw_card';
  static readonly FOUNDATION_DROP = 'foundation_drop';

  async initialize() {
    // Set audio mode
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

    // Preload sounds (using synthesized sounds for now)
    // In production, replace with actual audio files
    await this.loadSounds();
  }

  private async loadSounds() {
    // For now, we'll use simple beep sounds
    // TODO: Replace with actual sound files in apps/mobile/assets/sounds/

    // Example of how to load actual sound files:
    // const { sound } = await Audio.Sound.createAsync(
    //   require('../../assets/sounds/card_flip.mp3')
    // );
    // this.sounds.set(SoundService.CARD_FLIP, sound);
  }

  /**
   * Play a sound effect
   */
  async play(soundId: string, volume?: number) {
    if (!this.enabled) return;

    const sound = this.sounds.get(soundId);
    if (sound) {
      try {
        await sound.setPositionAsync(0);
        await sound.setVolumeAsync(volume ?? this.volume);
        await sound.playAsync();
      } catch (error) {
        console.warn('Failed to play sound:', soundId, error);
      }
    } else {
      // Fallback: play system sound
      this.playSystemSound(soundId);
    }
  }

  /**
   * Play system sound as fallback
   */
  private playSystemSound(soundId: string) {
    // Use expo-haptics as audio fallback for now
    // This creates a "feel" even without sound files
  }

  /**
   * Play card flip sound
   */
  playCardFlip() {
    this.play(SoundService.CARD_FLIP, 0.5);
  }

  /**
   * Play card snap sound (when card locks into place)
   */
  playCardSnap() {
    this.play(SoundService.CARD_SNAP, 0.6);
  }

  /**
   * Play card slide sound (during drag)
   */
  playCardSlide() {
    this.play(SoundService.CARD_SLIDE, 0.3);
  }

  /**
   * Play win fanfare
   */
  playWinFanfare() {
    this.play(SoundService.WIN_FANFARE, 1.0);
  }

  /**
   * Play button tap
   */
  playButtonTap() {
    this.play(SoundService.BUTTON_TAP, 0.4);
  }

  /**
   * Play error buzz (invalid move)
   */
  playErrorBuzz() {
    this.play(SoundService.ERROR_BUZZ, 0.5);
  }

  /**
   * Play draw card sound
   */
  playDrawCard() {
    this.play(SoundService.DRAW_CARD, 0.5);
  }

  /**
   * Play foundation drop sound (successful foundation placement)
   */
  playFoundationDrop() {
    this.play(SoundService.FOUNDATION_DROP, 0.7);
  }

  /**
   * Enable/disable all sounds
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Set global volume (0.0 - 1.0)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Cleanup all sounds
   */
  async cleanup() {
    for (const sound of this.sounds.values()) {
      await sound.unloadAsync();
    }
    this.sounds.clear();
  }
}

export const soundService = new SoundService();
