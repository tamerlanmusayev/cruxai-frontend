import axios, { AxiosInstance } from 'axios';
import { serviceOptions } from './service';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Shared axios instance for the generated SDK (mirrors fe-booking). */
const axiosInstance: AxiosInstance = axios.create({ baseURL: API_URL });

// Attach the anonymous session token to every request.
axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('cruxai_token');
    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Surface the API's error message (not axios's generic "Request failed…").
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    const msg =
      error?.response?.data?.message ??
      error?.message ??
      'Request failed';
    return Promise.reject(new Error(Array.isArray(msg) ? msg.join(', ') : msg));
  },
);

serviceOptions.axios = axiosInstance;

export * from './service';
