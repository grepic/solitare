import { create } from 'zustand';
import { AuthResponse } from '@solitaire/shared';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

type SecureStoreModule = typeof import('expo-secure-store');

function getSecureStore(): SecureStoreModule {
  // Important: don't import/require expo-secure-store on web.
  // Some Expo modules try to call into native constants during initialization.
  // On web that can throw (e.g. ExponentConstants.getConstants is undefined).
  return require('expo-secure-store') as SecureStoreModule;
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore
    }
    return;
  }

  const SecureStore = getSecureStore();
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  const SecureStore = getSecureStore();
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }

  const SecureStore = getSecureStore();
  await SecureStore.deleteItemAsync(key);
}

interface AuthState {
  user: AuthResponse['user'] | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setAuth: (data: AuthResponse) => Promise<void>;
  clearAuth: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (data: AuthResponse) => {
    await setItem('accessToken', data.tokens.accessToken);
    await setItem('refreshToken', data.tokens.refreshToken);

    set({
      user: data.user,
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  clearAuth: async () => {
    await deleteItem('accessToken');
    await deleteItem('refreshToken');

    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  loadAuth: async () => {
    const accessToken = await getItem('accessToken');
    const refreshToken = await getItem('refreshToken');

    if (accessToken && refreshToken) {
      set({
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      set({ isLoading: false });
    }
  },
}));
