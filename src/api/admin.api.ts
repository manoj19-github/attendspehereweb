import { api } from './axios';
import { ApiResponse, PaginatedData, User } from '@/types/api';

export const adminApi = {
  getUsers: (params: { page: number; limit: number; search?: string }) =>
    api.get<any>('/admin/users', { params }),
};