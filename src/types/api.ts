export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'employee';
  createdAt: string;
  isPresent?: boolean;
}

export interface WorkingHours {
  start: number;
  end: number;
  days: number[];
}

export interface OfficeConfig {
  OFFICE_LAT: number;
  OFFICE_LNG: number;
  OFFICE_RADIUS: number;
  OFFICE_NAME: string;
  OFFICE_ADDRESS: string;
  LOCATION_POLLING_INTERVAL: number;
  DISTANCE_THRESHOLD: number;
  TIME_INTERVAL_MS: number;
  WORKING_HOURS: WorkingHours;
}

export interface AttendanceRecord {
  user_id: string;
  full_name: string;
  email: string;
  event_date: string;
  working_hours: number;
  has_checkin: boolean;
  has_checkout: boolean;
}

export interface LocationRecord {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  latitude: number;
  longitude: number;
  is_inside: boolean;
  distance: number;
  recorded_at: string;
  log_type: 'distance' | 'interval';
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedData<T> {
  data: T[];
  pagination: Pagination;
}

export interface LocationPayload {
  userId: string;
  lat: number;
  lng: number;
  status: 'in_office_area' | 'out_office_area';
  distance: number;
  attendanceEvent: 'checkin' | 'checkout' | null;
  totalHours: number;
  timestamp: string;
  fullName: string;
  email: string;
  lastSeen: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  androidId: string;
  fingerPrint: string;
}

export interface LoginResponse {
  user: User;
  officeSettings: OfficeConfig;
  accessToken: string;
  refreshToken: string;
}