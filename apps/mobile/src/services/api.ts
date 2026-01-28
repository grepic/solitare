import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/auth.store';
import { toastService } from './toast.service';
import ENV from '../config/env';

const REQUEST_TIMEOUT_MS = Platform.OS === 'web' ? 8000 : 15000;

const api = axios.create({
  baseURL: ENV.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: REQUEST_TIMEOUT_MS,
});

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

/**
 * Calculate exponential backoff delay
 */
function getRetryDelay(retryCount: number): number {
  return RETRY_DELAY * Math.pow(2, retryCount);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: AxiosError): boolean {
  const method = error.config?.method?.toLowerCase();
  const url = error.config?.url ?? '';

  // Avoid retrying non-idempotent requests (e.g. login POST) and auth endpoints.
  // Retries can create confusing UX (long spinners) and can loop if the API is unreachable.
  if (url.includes('/auth/')) return false;
  if (method && method !== 'get' && method !== 'head' && method !== 'options') return false;

  if (!error.response) {
    // Network errors are retryable
    return true;
  }

  const status = error.response.status;

  // Retry on specific status codes
  return (
    status === 408 || // Request Timeout
    status === 429 || // Too Many Requests
    status === 500 || // Internal Server Error
    status === 502 || // Bad Gateway
    status === 503 || // Service Unavailable
    status === 504    // Gateway Timeout
  );
}

/**
 * Retry request with exponential backoff
 */
async function retryRequest(
  config: AxiosRequestConfig,
  retryCount: number = 0
): Promise<any> {
  try {
    return await api(config);
  } catch (error) {
    const axiosError = error as AxiosError;

    if (retryCount < MAX_RETRIES && isRetryableError(axiosError)) {
      const delay = getRetryDelay(retryCount);
      console.log(`🔄 Retrying request (attempt ${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms`);

      await new Promise(resolve => setTimeout(resolve, delay));
      return retryRequest(config, retryCount + 1);
    }

    throw error;
  }
}

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

    // Handle 401 Unauthorized (refresh token)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          const { data } = await axios.post(`${ENV.API_URL}/auth/refresh`, {
            refreshToken,
          });

          useAuthStore.getState().setAuth({
            user: useAuthStore.getState().user!,
            tokens: data,
          });

          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          useAuthStore.getState().clearAuth();
          toastService.error('Session expired. Please log in again.');
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, log out
        useAuthStore.getState().clearAuth();
        toastService.error('Session expired. Please log in again.');
        return Promise.reject(error);
      }
    }

    // Handle retryable errors
    // NOTE: _retryCount may be 0 (falsy). Only enter on first time when it's undefined.
    if (isRetryableError(error) && (originalRequest._retryCount === undefined || originalRequest._retryCount === null)) {
      originalRequest._retryCount = 0;

      try {
        return await retryRequest(originalRequest, 0);
      } catch (retryError) {
        // All retries failed
        console.error('❌ All retries failed:', retryError);
      }
    }

    // Handle specific error codes
    if (error.response) {
      const status = error.response.status;
      const message = (error.response.data as any)?.message || error.message;

      switch (status) {
        case 400:
          toastService.error(message || 'Invalid request');
          break;
        case 403:
          toastService.error('Access denied');
          break;
        case 404:
          toastService.error('Resource not found');
          break;
        case 429:
          toastService.warning('Too many requests. Please slow down.');
          break;
        case 500:
          toastService.error('Server error. Please try again later.');
          break;
        case 503:
          toastService.error('Service temporarily unavailable');
          break;
        default:
          if (status >= 500) {
            toastService.error('Server error. Please try again.');
          }
      }
    } else if (error.request) {
      // Network error (no response received)
      console.error('❌ Network error:', error.message);
      toastService.networkError(() => {
        // Retry the original request
        if (originalRequest) {
          retryRequest(originalRequest, 0);
        }
      });
    } else {
      // Something else happened
      console.error('❌ Error:', error.message);
      toastService.error(error.message || 'Something went wrong');
    }

    return Promise.reject(error);
  },
);

export default api;
