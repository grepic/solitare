import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { Button } from '@solitaire/ui-kit';
import { useThemeStore } from '../../store/theme.store';
import { useAuthStore } from '../../store/auth.store';
import { soundService } from '../../services/sound';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen({ navigation }: any) {
  const { theme, toggleTheme } = useThemeStore();
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
  });
