// Expo Webpack config override.
// We use this to proxy API + Socket.IO to the local NestJS backend inside the dev container.

const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Ensure devServer exists so proxy config is always applied.
  // Without this, Expo's default dev server can fall back to serving index.html
  // for /api routes, which breaks login with an opaque "Network Error".
  config.devServer = config.devServer || {};
  config.devServer.proxy = {
    ...(config.devServer.proxy || {}),
    '/api': {
      target: 'http://127.0.0.1:3000',
      changeOrigin: true,
      secure: false,
    },
    '/socket.io': {
      target: 'http://127.0.0.1:3000',
      changeOrigin: true,
      ws: true,
      secure: false,
    },
  };

  return config;
};
