import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/theme.store';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'success' | 'error' | 'warning' | 'neutral';
  size?: 'small' | 'medium' | 'large';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
}) => {
  const { theme } = useThemeStore();

  return (
    <View style={[styles(theme, variant).badge, sizeStyles[size]]}>
      <Text style={[styles(theme, variant).text, textSizeStyles[size]]}>{children}</Text>
    </View>
  );
};

const styles = (theme: any, variant: string) => {
  const colors = {
    primary: { bg: theme.colors.primary, text: '#FFFFFF' },
    success: { bg: theme.colors.success, text: '#FFFFFF' },
    error: { bg: theme.colors.error, text: '#FFFFFF' },
    warning: { bg: theme.colors.warning, text: '#000000' },
    neutral: { bg: theme.colors.surface, text: theme.colors.text },
  };

  return StyleSheet.create({
    badge: {
      backgroundColor: colors[variant as keyof typeof colors].bg,
      borderRadius: theme.radius.full,
      paddingHorizontal: 12,
      paddingVertical: 4,
      alignSelf: 'flex-start',
    },
    text: {
      color: colors[variant as keyof typeof colors].text,
      fontWeight: '600',
    },
  });
};

const sizeStyles = StyleSheet.create({
  small: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  medium: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  large: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
});

const textSizeStyles = StyleSheet.create({
  small: {
    fontSize: 12,
  },
  medium: {
    fontSize: 14,
  },
  large: {
    fontSize: 16,
  },
});
