import { create } from 'zustand';
import { lightTheme, darkTheme, Theme } from '@solitaire/ui-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  isDark: boolean;
  mode: ThemeMode;
  systemColorScheme: ColorSchemeName;

  // Actions
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setSystemColorScheme: (scheme: ColorSchemeName) => void;
  initialize: () => Promise<void>;
}

const THEME_STORAGE_KEY = '@theme_mode';

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: lightTheme,
  isDark: false,
  mode: 'system',
  systemColorScheme: Appearance.getColorScheme(),

  toggleTheme: () => {
    const { isDark } = get();
    const newMode: ThemeMode = isDark ? 'light' : 'dark';

    set({
      isDark: !isDark,
      theme: !isDark ? darkTheme : lightTheme,
      mode: newMode,
    });

    // Save to storage
    AsyncStorage.setItem(THEME_STORAGE_KEY, newMode).catch(console.error);
  },

  setThemeMode: (mode: ThemeMode) => {
    const { systemColorScheme } = get();

    let isDark: boolean;
    if (mode === 'system') {
      isDark = systemColorScheme === 'dark';
    } else {
      isDark = mode === 'dark';
    }

    set({
      mode,
      isDark,
      theme: isDark ? darkTheme : lightTheme,
    });

    // Save to storage
    AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch(console.error);
  },

  setSystemColorScheme: (scheme: ColorSchemeName) => {
    const { mode } = get();

    set({ systemColorScheme: scheme });

    // If using system mode, update theme accordingly
    if (mode === 'system') {
      const isDark = scheme === 'dark';
      set({
        isDark,
        theme: isDark ? darkTheme : lightTheme,
      });
    }
  },

  initialize: async () => {
    try {
      // Load saved preference
      const savedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      const mode = (savedMode as ThemeMode) || 'system';

      // Get system color scheme
      const systemColorScheme = Appearance.getColorScheme();

      // Determine if dark mode
      let isDark: boolean;
      if (mode === 'system') {
        isDark = systemColorScheme === 'dark';
      } else {
        isDark = mode === 'dark';
      }

      set({
        mode,
        systemColorScheme,
        isDark,
        theme: isDark ? darkTheme : lightTheme,
      });

      console.log(`✅ Theme initialized: mode=${mode}, isDark=${isDark}`);
    } catch (error) {
      console.error('Failed to initialize theme:', error);
    }
  },
}));
