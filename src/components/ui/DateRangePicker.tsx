import { cn } from '@/utils/cn';
import { ArrowRight } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  onReset: () => void;
}

export function DateRangePicker({ startDate, endDate, onChange, onReset }: DateRangePickerProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={startDate}
        onChange={(e) => onChange(e.target.value, endDate)}
        className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <ArrowRight className="w-4 h-4 text-gray-400" />
      <input
        type="date"
        value={endDate}
        onChange={(e) => onChange(startDate, e.target.value)}
        className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        onClick={onReset}
        className="ml-1 bg-blue-50 text-blue-600 border border-blue-200 text-xs px-2.5 py-1.5 rounded-full font-medium hover:bg-blue-100 transition-colors"
      >
        Today
      </button>
    </div>
  );
}