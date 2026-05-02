import { cn } from '@/utils/cn';

interface BadgeProps {
  variant?: 'green' | 'red' | 'amber' | 'gray' | 'blue';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export function Badge({ variant = 'gray', size = 'sm', children }: BadgeProps) {
  const variants = {
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-700',
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-100 text-blue-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variants[variant],
        sizes[size]
      )}
    >
      {children}
    </span>
  );
}