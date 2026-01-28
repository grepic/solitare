import { useThemeStore } from '../store/theme.store';

export const useTheme = () => {
  const { isDark, theme } = useThemeStore();
  
  return {
    isDark,
    theme,
  };
};
