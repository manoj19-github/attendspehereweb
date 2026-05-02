import { cn } from '@/utils/cn';

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn('h-4 bg-gray-200 rounded animate-pulse', className)} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm space-y-3">
      <SkeletonLine className="w-1/3" />
      <SkeletonLine className="w-2/3" />
      <SkeletonLine className="w-1/2" />
    </div>
  );
}

export function SkeletonTable({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100">
          {[2, 3, 2, 1, 1].map((w, j) => (
            <td key={j} className="px-4 py-3">
              <SkeletonLine className={`w-${w}/4`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}