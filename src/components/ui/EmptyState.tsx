import { cn } from '@/utils/cn';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
  subMessage?: string;
  className?: string;
}

export function EmptyState({ icon: Icon, message, subMessage, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-8', className)}>
      <Icon className="w-10 h-10 text-gray-300 mb-3" strokeWidth={1.5} />
      <p className="text-gray-500 font-medium text-sm">{message}</p>
      {subMessage && <p className="text-gray-400 text-xs mt-1">{subMessage}</p>}
    </div>
  );
}