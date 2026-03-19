import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useThemeStore } from '../store/theme.store';

import HomeScreen from '../screens/main/HomeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  const { theme } = useThemeStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: () => '🏠',
        }}
      />
      <Tab.Screen
        name="TournamentsTab"
        getComponent={() => require('../screens/tournaments/TournamentsScreen').default}
        options={{
          tabBarLabel: 'Tournaments',
          tabBarIcon: () => '🏆',
        }}
      />
      <Tab.Screen
        name="SeasonsTab"
        getComponent={() => require('../screens/seasons/SeasonsScreen').default}
        options={{
          tabBarLabel: 'Battle Pass',
          tabBarIcon: () => '⭐',
        }}
      />
      <Tab.Screen
        name="FriendsTab"
        getComponent={() => require('../screens/friends/FriendsScreen').default}
        options={{
          tabBarLabel: 'Friends',
          tabBarIcon: () => '👥',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: () => '👤',
        }}
      />
    </Tab.Navigator>
  );
}
