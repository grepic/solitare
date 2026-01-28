const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('metro-resolver');
const { createProxyMiddleware } = require('http-proxy-middleware');

const config = getDefaultConfig(__dirname);

// Proxy API + Socket.IO through the Metro dev server so the web app can call
// same-origin `/api/*` without requiring the backend port to be exposed publicly.
// This prevents browser-side CORS/preflight issues that show up as Axios "Network Error".
config.server = config.server || {};
config.server.enhanceMiddleware = (middleware) => {
  const proxy = createProxyMiddleware({
    pathFilter: ['/api', '/socket.io'],
    target: 'http://127.0.0.1:3000',
    changeOrigin: true,
    ws: true,
    secure: false,
    logLevel: 'warn',
  });

  return (req, res, next) => {
    if (req.url && (req.url.startsWith('/api') || req.url.startsWith('/socket.io'))) {
      return proxy(req, res, next);
    }

    return middleware(req, res, next);
  };
};

// Force web builds to resolve `react-native` to `react-native-web`.
// Without this, Metro may try to bundle the real `react-native` package for web,
// which is missing web platform shims and fails at runtime/build time.
const reactNativeWebPath = path.dirname(
  require.resolve('react-native-web/package.json', { paths: [__dirname] })
);

config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  'react-native': reactNativeWebPath,
};

// Some dependencies (or Metro itself) can end up resolving to the real `react-native`
// package during web bundling. When that happens, it fails because RN doesn't ship a
// generic `Platform.js` for the `web` platform.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'react-native' || moduleName.startsWith('react-native/')) {
      return resolve(context, 'react-native-web', platform);
    }
  }

  return resolve(context, moduleName, platform);
};

config.resolver.sourceExts = Array.from(
  new Set([...(config.resolver.sourceExts || []), 'web.js', 'web.ts', 'web.tsx', 'web.jsx'])
);

// Prefer TS/TSX over compiled JS files that exist alongside sources.
// This repo contains many `*.js` artifacts next to `*.ts/tsx`.
const preferredExts = ['web.tsx', 'web.ts', 'web.jsx', 'web.js', 'tsx', 'ts', 'jsx', 'js'];
config.resolver.sourceExts = [
  ...preferredExts,
  ...(config.resolver.sourceExts || []).filter((ext) => !preferredExts.includes(ext)),
];

module.exports = config;
