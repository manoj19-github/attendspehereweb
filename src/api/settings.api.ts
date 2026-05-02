import { api } from './axios';
import { ApiResponse, OfficeConfig } from '@/types/api';

export const settingsApi = {
  getConfig: () => api.get<ApiResponse<OfficeConfig>>('/office-settings'),

  updateConfig: (payload: OfficeConfig) =>
    api.put<ApiResponse<OfficeConfig>>('/office-settings', payload),
};