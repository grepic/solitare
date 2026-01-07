import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Theme } from '../theme';

interface CardProps {
  children: React.ReactNode;
  theme: Theme;
  style?: ViewStyle;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({ children, theme, style, padding }) => {
  return (
    <View
      style={[
        styles(theme).card,
        padding !== undefined && { padding },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: theme.colors.cardBackground,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.lg,
      shadowColor: theme.colors.cardShadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
  });
