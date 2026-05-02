import { api } from './axios';
import { ApiResponse, LoginPayload, LoginResponse, User, OfficeConfig } from '@/types/api';

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<ApiResponse<LoginResponse>>('/auth/login', payload),

  me: () =>
    api.get<ApiResponse<{ user: User; officeSettings: OfficeConfig }>>('/auth/me'),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', { refreshToken }),
};