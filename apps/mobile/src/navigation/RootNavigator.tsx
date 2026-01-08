import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/auth.store';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import GameScreen from '../screens/game/GameScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import AgeVerificationScreen from '../screens/settings/AgeVerificationScreen';
import LeaderboardScreen from '../screens/leaderboard/LeaderboardScreen';
import ReplayScreen from '../screens/replay/ReplayScreen';
import TermsOfServiceScreen from '../screens/legal/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../screens/legal/PrivacyPolicyScreen';
import ResponsibleGamingScreen from '../screens/legal/ResponsibleGamingScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="Game"
            component={GameScreen}
            options={{
              presentation: 'fullScreenModal',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="Settings" component={SettingsScreen} options={{ headerShown: true, title: 'Settings' }} />
          <Stack.Screen name="AgeVerification" component={AgeVerificationScreen} options={{ headerShown: true, title: 'Age Verification' }} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ headerShown: true, title: 'Leaderboard' }} />
          <Stack.Screen name="Replay" component={ReplayScreen} options={{ headerShown: true, title: 'Match Replay' }} />
          <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} options={{ headerShown: true, title: 'Terms of Service' }} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ headerShown: true, title: 'Privacy Policy' }} />
          <Stack.Screen name="ResponsibleGaming" component={ResponsibleGamingScreen} options={{ headerShown: true, title: 'Responsible Gaming' }} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
