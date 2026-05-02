import { create } from 'zustand';
import { getTodayISO } from '@/utils/date';

interface DateState {
  startDate: string;
  endDate: string;
  setRange: (start: string, end: string) => void;
  resetToToday: () => void;
}

export const useDateStore = create<DateState>((set) => ({
  startDate: getTodayISO(),
  endDate: getTodayISO(),
  setRange: (startDate, endDate) => set({ startDate, endDate }),
  resetToToday: () => set({ startDate: getTodayISO(), endDate: getTodayISO() }),
}));