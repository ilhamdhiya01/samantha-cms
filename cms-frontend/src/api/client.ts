import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4001';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30_000,
});

export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const stored = localStorage.getItem('cms_token');
  if (stored && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${stored}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('cms_token');
      if (location.pathname !== '/login') {
        location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

// ApiResponse unwrap helpers
export interface ApiOk<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}
export interface ApiErr {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

export function unwrap<T>(payload: ApiOk<T> | ApiErr): T {
  if ((payload as ApiErr).success === false) {
    throw new Error((payload as ApiErr).error.message);
  }
  return (payload as ApiOk<T>).data;
}
