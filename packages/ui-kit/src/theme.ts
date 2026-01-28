export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
} as const;

export const lightColors = {
  // Primary
  primary: '#6366F1',
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',

  // Background
  background: '#FFFFFF',
  surface: '#F8F9FA',
  surfaceHover: '#F1F3F5',

  // Text
  text: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  // Borders
  border: '#E5E7EB',
  borderFocus: '#6366F1',

  // Status
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  modalBackground: 'rgba(0, 0, 0, 0.75)',

  // Card colors
  cardBackground: '#FFFFFF',
  cardShadow: 'rgba(0, 0, 0, 0.1)',

  // Game colors
  cardRed: '#DC2626',
  cardBlack: '#1F2937',
  tableauGreen: '#059669',
};

export const darkColors: typeof lightColors = {
  // Primary
  primary: '#818CF8',
  primaryDark: '#6366F1',
  primaryLight: '#A5B4FC',

  // Background
  background: '#111827',
  surface: '#1F2937',
  surfaceHover: '#374151',

  // Text
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',

  // Borders
  border: '#374151',
  borderFocus: '#818CF8',

  // Status
  success: '#10B981',
  successLight: '#064E3B',
  error: '#EF4444',
  errorLight: '#7F1D1D',
  warning: '#F59E0B',
  warningLight: '#78350F',
  info: '#3B82F6',
  infoLight: '#1E3A8A',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.75)',
  modalBackground: 'rgba(0, 0, 0, 0.9)',

  // Card colors
  cardBackground: '#1F2937',
  cardShadow: 'rgba(0, 0, 0, 0.3)',

  // Game colors
  cardRed: '#F87171',
  cardBlack: '#F9FAFB',
  tableauGreen: '#047857',
};

export type Theme = {
  colors: typeof lightColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  isDark: boolean;
};

export const lightTheme: Theme = {
  colors: lightColors,
  spacing,
  radius,
  typography,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: darkColors,
  spacing,
  radius,
  typography,
  isDark: true,
};
