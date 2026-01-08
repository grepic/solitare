import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Theme } from '../theme';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onHide: () => void;
  theme: Theme;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onHide,
  theme,
}) => {
  const translateY = React.useRef(new Animated.Value(-100)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide());
  };

  if (!visible) return null;

  const colors = {
    success: { bg: theme.colors.success, icon: '✓' },
    error: { bg: theme.colors.error, icon: '✕' },
    warning: { bg: theme.colors.warning, icon: '⚠' },
    info: { bg: theme.colors.info, icon: 'ⓘ' },
  };

  return (
    <Animated.View
      style={[
        styles(theme).container,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <TouchableOpacity
        style={[styles(theme).toast, { backgroundColor: colors[type].bg }]}
        onPress={hideToast}
        activeOpacity={0.9}
      >
        <Text style={styles(theme).icon}>{colors[type].icon}</Text>
        <Text style={styles(theme).message}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 60,
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      zIndex: 9999,
    },
    toast: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderRadius: theme.radius.lg,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    icon: {
      fontSize: 20,
      color: '#FFFFFF',
      marginRight: theme.spacing.md,
    },
    message: {
      flex: 1,
      ...theme.typography.body,
      color: '#FFFFFF',
    },
  });
