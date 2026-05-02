import { api } from './axios';
import { ApiResponse, PaginatedData, LocationRecord } from '@/types/api';

export const locationApi = {
  getLatestAll: () => api.get<ApiResponse<any[]>>('/admin/location/latest-all'),

  getPaginated: (params: {
    page: number;
    limit: number;
    search?: string;
    userId?: string;
    startDate: string;
    endDate: string;
  }) => api.get<any>('/admin/all-user-location', { params }),
};