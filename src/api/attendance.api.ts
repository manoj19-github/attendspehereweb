import { api } from './axios';
import { ApiResponse, PaginatedData, AttendanceRecord } from '@/types/api';

export const attendanceApi = {
  getPaginated: (params: {
    page: number;
    limit: number;
    search?: string;
    hoursFilter?: string | null;
    startDate: string;
    endDate: string;
  }) => api.get<any>('/admin/all-user-attendance', { params }),

  getMISReport: (params: { startDate: string; endDate: string }) =>
    api.get('/admin/all-user-mis-report', { params, responseType: 'blob' }),
};