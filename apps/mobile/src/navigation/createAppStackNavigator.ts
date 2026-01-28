import { Platform } from 'react-native';

// On web, native-stack can render blank or misbehave because it relies on native
// primitives. Use the JS-based stack navigator instead.
export function createAppStackNavigator() {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createStackNavigator } = require('@react-navigation/stack');
    return createStackNavigator();
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createNativeStackNavigator } = require('@react-navigation/native-stack');
  return createNativeStackNavigator();
}
