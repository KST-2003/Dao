import axios, { type AxiosRequestConfig } from 'axios';
import { API_BASE } from '@/shared/constants/config';
import { i18n } from '@/shared/i18n';
import { toApiError } from './errors';

/**
 * Single Axios instance. The bearer token lives in memory (populated from SecureStore at boot
 * and at login); a 401 on an authenticated request triggers the registered logout handler.
 */
export const http = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
  headers: { Accept: 'application/json' },
});

let tokenRef: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  tokenRef = token;
}

export function onUnauthorized(handler: () => void): void {
  unauthorizedHandler = handler;
}

http.interceptors.request.use((config) => {
  if (tokenRef) {
    config.headers.set('Authorization', `Bearer ${tokenRef}`);
  }
  config.headers.set('X-Locale', i18n.language || 'en');
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error);
    if (apiError.status === 401 && tokenRef) {
      unauthorizedHandler?.();
    }
    return Promise.reject(apiError);
  },
);

/** Unwraps `{ data }` envelopes. */
export const api = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await http.get<{ data: T }>(url, config)).data.data;
  },
  /** For paginated/meta responses where the caller needs the whole body. */
  async getRaw<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await http.get<T>(url, config)).data;
  },
  async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await http.post<{ data: T }>(url, body, config)).data.data;
  },
  async put<T>(url: string, body?: unknown): Promise<T> {
    return (await http.put<{ data: T }>(url, body)).data.data;
  },
  async patch<T>(url: string, body?: unknown): Promise<T> {
    return (await http.patch<{ data: T }>(url, body)).data.data;
  },
  async delete<T>(url: string): Promise<T> {
    return (await http.delete<{ data: T }>(url)).data.data;
  },
};
