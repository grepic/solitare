import React from 'react';
import { View, TextInput, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../theme';

interface InputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  theme: Theme;
  style?: ViewStyle;
  inputStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  label,
  error,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  theme,
  style,
  inputStyle,
}) => {
  return (
    <View style={[styles(theme).container, style]}>
      {label && <Text style={styles(theme).label}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textTertiary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[
          styles(theme).input,
          Boolean(error) && styles(theme).inputError,
          inputStyle,
        ]}
      />
      {error && <Text style={styles(theme).error}>{error}</Text>}
    </View>
  );
};

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    },
    label: {
      ...theme.typography.caption,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    input: {
      ...theme.typography.body,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      padding: theme.spacing.md,
      color: theme.colors.text,
    },
    inputError: {
      borderColor: theme.colors.error,
    },
    error: {
      ...theme.typography.small,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
    },
  });
