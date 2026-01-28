import { Platform } from 'react-native';
import Constants from 'expo-constants';

const ENV = {
  dev: {
    API_URL: 'http://localhost:3000/api',
    WS_URL: 'http://localhost:3000',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_your_key',
  },
  staging: {
    API_URL: 'https://api-staging.solitaire-smash.com/api',
    WS_URL: 'https://api-staging.solitaire-smash.com',
    STRIPE_PUBLISHABLE_KEY: 'pk_test_your_key',
  },
  prod: {
    API_URL: 'https://api.solitaire-smash.com/api',
    WS_URL: 'https://api.solitaire-smash.com',
    STRIPE_PUBLISHABLE_KEY: 'pk_live_your_key',
  },
};

function getNativeDevAutoUrls(): { API_URL?: string; WS_URL?: string } | undefined {
  if (!__DEV__) return undefined;
  if (Platform.OS === 'web') return undefined;

  try {
    // Expo Dev/Go usually exposes a hostUri like "192.168.0.10:8081".
    const anyConstants: any = Constants as any;
    const hostUri: string | undefined =
      (Constants.expoConfig as any)?.hostUri ||
      (anyConstants.manifest as any)?.debuggerHost ||
      anyConstants?.manifest2?.extra?.expoClient?.hostUri ||
      anyConstants?.expoConfig?.hostUri;

    if (!hostUri) return undefined;

    const host = hostUri.split(':')[0];
    if (!host) return undefined;

    return {
      API_URL: `http://${host}:3000/api`,
      WS_URL: `http://${host}:3000`,
    };
  } catch {
    return undefined;
  }
}

function getWebAutoUrls(): { API_URL?: string; WS_URL?: string } | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const { protocol, hostname, origin } = window.location;

    // Local dev: prefer same-origin and rely on the web dev server proxy.
    // This avoids needing the API port (3000) to be separately reachable from the browser.
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return {
        API_URL: `${origin}/api`,
        WS_URL: origin,
      };
    }

    // Dev containers / Codespaces: the forwarded port may be private, which breaks
    // browser XHR/fetch due to preflight/auth (often surfacing as "Network Error").
    // Prefer same-origin URLs and rely on the web dev server proxy.
    if (
      __DEV__ &&
      (hostname.endsWith('.app.github.dev') ||
        hostname.endsWith('.githubpreview.dev') ||
        hostname.endsWith('.github.dev'))
    ) {
      return {
        API_URL: `${origin}/api`,
        WS_URL: origin,
      };
    }

    // Pattern A (suffix port): <name>-8081.app.github.dev
    // Derive the API host by swapping the port segment.
    // Common dev container setup: Expo web on 8081, API forwarded on 8085.
    const suffixPort = hostname.match(/^(.*)-(\d+)\.(.+)$/);
    if (suffixPort) {
      const prefix = suffixPort[1];
      const port = suffixPort[2];
      const domain = suffixPort[3];

      const apiPort = port === '8081' ? '8085' : '3000';
      const apiHost = `${prefix}-${apiPort}.${domain}`;

      return {
        API_URL: `${protocol}//${apiHost}/api`,
        WS_URL: `${protocol}//${apiHost}`,
      };
    }

    // Pattern B (prefix port): 8081-<name>.githubpreview.dev / 8081-<id>.app.github.dev
    // Derive the API host by swapping the leading port.
    // Common dev container setup: Expo web on 8081, API forwarded on 8085.
    const prefixPort = hostname.match(/^(\d+)-(.*)$/);
    if (prefixPort) {
      const port = prefixPort[1];
      const rest = prefixPort[2];
      const apiPort = port === '8081' ? '8085' : '3000';
      const apiHost = `${apiPort}-${rest}`;

      return {
        API_URL: `${protocol}//${apiHost}/api`,
        WS_URL: `${protocol}//${apiHost}`,
      };
    }

    return undefined;
  } catch {
    return undefined;
  }
}

const getEnvVars = () => {
  const base = __DEV__ ? ENV.dev : ENV.prod;

  // Web-only: allow runtime overrides via query params.
  // Useful in dev containers / port forwarding where `localhost` may not point to the API.
  const webQueryOverrides:
    | {
        API_URL?: string;
        WS_URL?: string;
        STRIPE_PUBLISHABLE_KEY?: string;
      }
    | undefined =
    typeof window !== 'undefined'
      ? (() => {
          try {
            const params = new URLSearchParams(window.location.search);
            const apiUrl = params.get('apiUrl') || params.get('api') || undefined;
            const wsUrl = params.get('wsUrl') || params.get('ws') || undefined;
            const stripeKey = params.get('stripeKey') || undefined;

            return {
              API_URL: apiUrl || undefined,
              WS_URL: wsUrl || undefined,
              STRIPE_PUBLISHABLE_KEY: stripeKey || undefined,
            };
          } catch {
            return undefined;
          }
        })()
      : undefined;

  const webAutoUrls = getWebAutoUrls();
  const nativeAutoUrls = getNativeDevAutoUrls();

  // Expo only exposes environment variables prefixed with EXPO_PUBLIC_ to the JS runtime.
  // This is the recommended way to point the app at a reachable backend when running on
  // a physical device or remote dev container (where http://localhost is not the API).
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const wsUrl = process.env.EXPO_PUBLIC_WS_URL;
  const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  // Pick URLs.
  // - For web, prefer query overrides and auto-derived URLs before EXPO_PUBLIC_*.
  // - For native dev, prefer EXPO_PUBLIC_* and Expo-derived host IP.
  // This avoids common dev issues:
  // - using an unreachable machine IP
  // - mixed-content blocking when the page is https but API is http
  let resolvedApiUrl =
    Platform.OS === 'web'
      ? webQueryOverrides?.API_URL || webAutoUrls?.API_URL || apiUrl || base.API_URL
      : apiUrl || nativeAutoUrls?.API_URL || base.API_URL;

  let resolvedWsUrl =
    Platform.OS === 'web'
      ? webQueryOverrides?.WS_URL || webAutoUrls?.WS_URL || wsUrl || base.WS_URL
      : wsUrl || nativeAutoUrls?.WS_URL || base.WS_URL;

  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (resolvedApiUrl.startsWith('http://') && !resolvedApiUrl.includes('localhost')) {
      resolvedApiUrl = `https://${resolvedApiUrl.slice('http://'.length)}`;
    }
    if (resolvedWsUrl.startsWith('http://') && !resolvedWsUrl.includes('localhost')) {
      resolvedWsUrl = `https://${resolvedWsUrl.slice('http://'.length)}`;
    }
  }

  return {
    ...base,
    API_URL: resolvedApiUrl,
    WS_URL: resolvedWsUrl,
    STRIPE_PUBLISHABLE_KEY:
      webQueryOverrides?.STRIPE_PUBLISHABLE_KEY || stripeKey || base.STRIPE_PUBLISHABLE_KEY,
  };
};

export default getEnvVars();
