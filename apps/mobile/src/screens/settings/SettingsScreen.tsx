import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Button } from '@solitaire/ui-kit';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';
import { soundService } from '../../services/sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }: any) {
  const { theme, mode, setThemeMode } = useThemeStore();
  const { logout } = useAuthStore();

  const [soundEnabled, setSoundEnabled] = useState(soundService.isEnabled());
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const handleSoundToggle = async (value: boolean) => {
    setSoundEnabled(value);
    soundService.setEnabled(value);
    await AsyncStorage.setItem('soundEnabled', JSON.stringify(value));
  };

  const handleMusicToggle = async (value: boolean) => {
    setMusicEnabled(value);
    await AsyncStorage.setItem('musicEnabled', JSON.stringify(value));
  };

  const handleNotificationsToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(value));
  };

  const handleVibrationToggle = async (value: boolean) => {
    setVibrationEnabled(value);
    await AsyncStorage.setItem('vibrationEnabled', JSON.stringify(value));
  };

  const handleLogout = async () => {
    await logout();
    navigation.replace('Login');
  };

  return (
    <ScrollView
      style={[styles(theme).container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles(theme).content}
    >
      <Text style={[styles(theme).title, { color: theme.colors.text }]}>Settings</Text>

      {/* Appearance */}
      <View style={styles(theme).section}>
        <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>Appearance</Text>

        <View style={styles(theme).themeSelector}>
          {(['light', 'dark', 'system'] as const).map((themeMode) => (
            <TouchableOpacity
              key={themeMode}
              style={[
                styles(theme).themeOption,
                mode === themeMode && styles(theme).themeOptionActive,
                {
                  backgroundColor: mode === themeMode
                    ? theme.colors.primary
                    : theme.colors.surface
                }
              ]}
              onPress={() => setThemeMode(themeMode)}
            >
              <Text
                style={[
                  styles(theme).themeOptionText,
                  {
                    color: mode === themeMode ? '#FFFFFF' : theme.colors.text,
                  },
                ]}
              >
                {themeMode === 'light' && '☀️ Light'}
                {themeMode === 'dark' && '🌙 Dark'}
                {themeMode === 'system' && '⚙️ System'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles(theme).themeDescription, { color: theme.colors.textSecondary }]}>
          {mode === 'system'
            ? 'Theme will match your device settings'
            : `Using ${mode} theme`}
        </Text>
      </View>

      {/* Audio Settings */}
      <View style={styles(theme).section}>
        <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>Audio</Text>

        <View style={styles(theme).setting}>
          <Text style={[styles(theme).settingLabel, { color: theme.colors.text }]}>Sound Effects</Text>
          <Switch value={soundEnabled} onValueChange={handleSoundToggle} />
        </View>

        <View style={styles(theme).setting}>
          <Text style={[styles(theme).settingLabel, { color: theme.colors.text }]}>Music</Text>
          <Switch value={musicEnabled} onValueChange={handleMusicToggle} />
        </View>
      </View>

      {/* Notifications */}
      <View style={styles(theme).section}>
        <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>Notifications</Text>

        <View style={styles(theme).setting}>
          <Text style={[styles(theme).settingLabel, { color: theme.colors.text }]}>Push Notifications</Text>
          <Switch value={notificationsEnabled} onValueChange={handleNotificationsToggle} />
        </View>

        <View style={styles(theme).setting}>
          <Text style={[styles(theme).settingLabel, { color: theme.colors.text }]}>Vibration</Text>
          <Switch value={vibrationEnabled} onValueChange={handleVibrationToggle} />
        </View>
      </View>

      {/* Account */}
      <View style={styles(theme).section}>
        <Text style={[styles(theme).sectionTitle, { color: theme.colors.text }]}>Account</Text>

        <Button
          title="Age Verification"
          onPress={() => navigation.navigate('AgeVerification')}
          variant="ghost"
          theme={theme}
        />

        <Button
          title="Privacy Policy"
          onPress={() => navigation.navigate('PrivacyPolicy')}
          variant="ghost"
          theme={theme}
        />

        <Button
          title="Terms of Service"
          onPress={() => navigation.navigate('TermsOfService')}
          variant="ghost"
          theme={theme}
        />

        <Button
          title="Responsible Gaming"
          onPress={() => navigation.navigate('ResponsibleGaming')}
          variant="ghost"
          theme={theme}
        />
      </View>

      {/* Logout */}
      <Button title="Logout" onPress={handleLogout} variant="danger" theme={theme} />

      <Text style={[styles(theme).version, { color: theme.colors.textSecondary }]}>Version 1.0.0</Text>
    </ScrollView>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      padding: theme.spacing.xl,
    },
    title: {
      ...theme.typography.h1,
      marginBottom: theme.spacing.xxl,
    },
    section: {
      marginBottom: theme.spacing.xxl,
    },
    sectionTitle: {
      ...theme.typography.h2,
      marginBottom: theme.spacing.md,
    },
    setting: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    settingLabel: {
      ...theme.typography.body,
    },
    version: {
      ...theme.typography.caption,
      textAlign: 'center',
      marginTop: theme.spacing.xxl,
    },
    themeSelector: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    themeOption: {
      flex: 1,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeOptionActive: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    themeOptionText: {
      ...theme.typography.body,
      fontWeight: '600',
      fontSize: 14,
      textAlign: 'center',
    },
    themeDescription: {
      ...theme.typography.caption,
      fontSize: 12,
      textAlign: 'center',
    },
  });
