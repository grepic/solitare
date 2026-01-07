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

const getEnvVars = () => {
  if (__DEV__) {
    return ENV.dev;
  }
  return ENV.prod;
};

export default getEnvVars();
