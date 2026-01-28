import React from 'react';
import { createAppStackNavigator } from './createAppStackNavigator';

import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createAppStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
