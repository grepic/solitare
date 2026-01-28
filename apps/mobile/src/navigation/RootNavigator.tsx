import React from 'react';
import { useAuthStore } from '../store/auth.store';
import { createAppStackNavigator } from './createAppStackNavigator';

import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';

const Stack = createAppStackNavigator();

export default function RootNavigator() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen
            name="Game"
            getComponent={() => require('../games/solitaire').SolitaireGameScreen}
            options={{
              presentation: 'fullScreenModal',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="LobbyBrowser"
            getComponent={() => require('../screens/main/LobbyBrowserScreen').LobbyBrowserScreen}
            options={{ headerShown: true, title: 'Game Lobbies' }}
          />
          <Stack.Screen
            name="CreateGame"
            getComponent={() => require('../screens/main/CreateGameScreen').CreateGameScreen}
            options={{ headerShown: true, title: 'Create Game' }}
          />
          <Stack.Screen
            name="AdminDashboard"
            getComponent={() => require('../screens/admin/AdminDashboardScreen').AdminDashboardScreen}
            options={{ headerShown: true, title: '💰 Platform Revenue' }}
          />
          <Stack.Screen
            name="Settings"
            getComponent={() => require('../screens/settings/SettingsScreen').default}
            options={{ headerShown: true, title: 'Settings' }}
          />
          <Stack.Screen
            name="AgeVerification"
            getComponent={() => require('../screens/settings/AgeVerificationScreen').default}
            options={{ headerShown: true, title: 'Age Verification' }}
          />
          <Stack.Screen
            name="Leaderboard"
            getComponent={() => require('../screens/leaderboard/LeaderboardScreen').default}
            options={{ headerShown: true, title: 'Leaderboard' }}
          />
          <Stack.Screen
            name="Replay"
            getComponent={() => require('../screens/replay/ReplayScreen').default}
            options={{ headerShown: true, title: 'Match Replay' }}
          />
          <Stack.Screen
            name="TermsOfService"
            getComponent={() => require('../screens/legal/TermsOfServiceScreen').default}
            options={{ headerShown: true, title: 'Terms of Service' }}
          />
          <Stack.Screen
            name="PrivacyPolicy"
            getComponent={() => require('../screens/legal/PrivacyPolicyScreen').default}
            options={{ headerShown: true, title: 'Privacy Policy' }}
          />
          <Stack.Screen
            name="ResponsibleGaming"
            getComponent={() => require('../screens/legal/ResponsibleGamingScreen').default}
            options={{ headerShown: true, title: 'Responsible Gaming' }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}
