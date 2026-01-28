import { Platform } from 'react-native';

type ExpoAvModule = typeof import('expo-av');

function getExpoAv(): ExpoAvModule | null {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-av') as ExpoAvModule;
  } catch {
    return null;
  }
}

class SoundService {
  private sounds: Map<string, any> = new Map();
  private enabled: boolean = true;

  async loadSounds() {
    const expoAv = getExpoAv();
    if (!expoAv) return;

    try {
      // Load sound effects
      const soundFiles = {
        cardFlip: require('../assets/sounds/card-flip.mp3'),
        cardPlace: require('../assets/sounds/card-place.mp3'),
        cardShuffle: require('../assets/sounds/card-shuffle.mp3'),
        win: require('../assets/sounds/win.mp3'),
        error: require('../assets/sounds/error.mp3'),
        button: require('../assets/sounds/button.mp3'),
      };

      for (const [key, source] of Object.entries(soundFiles)) {
        try {
          const { sound } = await expoAv.Audio.Sound.createAsync(source);
          this.sounds.set(key, sound);
        } catch (err) {
          console.warn(`Failed to load sound: ${key}`);
        }
      }
    } catch (error) {
      console.warn('Sound loading disabled - assets not found');
    }
  }

  async play(soundName: string) {
    if (!this.enabled) return;
    if (Platform.OS === 'web') return;

    const sound = this.sounds.get(soundName);
    if (sound) {
      try {
        await sound.replayAsync();
      } catch (error) {
        console.warn(`Failed to play sound: ${soundName}`);
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async unloadAll() {
    if (Platform.OS === 'web') {
      this.sounds.clear();
      return;
    }

    for (const sound of this.sounds.values()) {
      await sound.unloadAsync();
    }
    this.sounds.clear();
  }
}

export const soundService = new SoundService();

// Note: Sound files should be placed in apps/mobile/src/assets/sounds/
// For now, these will fail gracefully if assets don't exist
