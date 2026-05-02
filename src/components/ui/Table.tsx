import { cn } from '@/utils/cn';
import { SkeletonTable } from './Skeleton';
import { EmptyState } from './EmptyState';
import { FileText } from 'lucide-react';

interface Column<T = any> {
  header: string;
  accessor?: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  loading,
  emptyMessage = 'No data available',
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-left">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {loading ? (
            <SkeletonTable count={5} />
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12">
                <EmptyState icon={FileText} message={emptyMessage} />
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={i}
                className="bg-white hover:bg-gray-50 border-b border-gray-100 transition-colors"
              >
                {columns.map((col, j) => (
                  <td key={j} className="px-4 py-3 text-sm text-gray-700">
                    {col.render ? col.render(row) : col.accessor ? row[col.accessor] : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}