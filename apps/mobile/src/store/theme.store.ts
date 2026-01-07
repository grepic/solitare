import { create } from 'zustand';
import { lightTheme, darkTheme, Theme } from '@solitaire/ui-kit';

interface ThemeState {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: lightTheme,
  isDark: false,

  toggleTheme: () =>
    set((state) => ({
      isDark: !state.isDark,
      theme: !state.isDark ? darkTheme : lightTheme,
    })),
}));
