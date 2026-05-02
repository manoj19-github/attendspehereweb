import { cn } from '@/utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const getPages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const pages = getPages();

  return (
    <div className="flex items-center justify-center gap-1.5 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cn(
          'flex items-center px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors',
          currentPage === 1
            ? 'text-gray-400 cursor-not-allowed opacity-40'
            : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={i} className="px-2 py-1.5 text-sm text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={i}
            onClick={() => onPageChange(page as number)}
            className={cn(
              'min-w-[2rem] px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors',
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cn(
          'flex items-center px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors',
          currentPage === totalPages
            ? 'text-gray-400 cursor-not-allowed opacity-40'
            : 'text-gray-700 hover:bg-gray-100'
        )}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}