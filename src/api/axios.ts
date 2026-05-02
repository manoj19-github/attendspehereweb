import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from './auth.api';


export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 15000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = Cookies.get('attend_refresh');

      if (refreshToken) {
        try {
          const res = await authApi.refresh(refreshToken);
          const newToken = res.data.data.accessToken;
          Cookies.set('attend_token', newToken, { expires: 7, sameSite: 'strict' });
          useAuthStore.getState().setToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch {
          Cookies.remove('attend_token');
          Cookies.remove('attend_refresh');
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      } else {
        Cookies.remove('attend_token');
        Cookies.remove('attend_refresh');
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);