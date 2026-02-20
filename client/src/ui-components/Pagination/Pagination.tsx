import { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import {
  Pagination as ShadcnPagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useTheme } from '@/core/context/ThemeProvider';
import { cn } from '@/lib/utils';

export interface PaginationProps extends Omit<JSX.HTMLAttributes<HTMLElement>, 'onChange'> {
  count: number;
  page?: number;
  defaultPage?: number;
  onChange?: (page: number, event: Event) => void;
  disabled?: boolean;
  siblingCount?: number;
  boundaryCount?: number;
  showFirstButton?: boolean;
  showLastButton?: boolean;
  hidePrevButton?: boolean;
  hideNextButton?: boolean;
  variant?: 'text' | 'outlined';
  shape?: 'rounded' | 'circular';
  size?: 'sm' | 'md';
  ariaLabel?: string;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function Pagination({
  count,
  page,
  defaultPage = 1,
  onChange,
  disabled = false,
  siblingCount = 1,
  boundaryCount = 1,
  showFirstButton = false,
  showLastButton = false,
  hidePrevButton = false,
  hideNextButton = false,
  variant = 'text',
  shape = 'rounded',
  size = 'md',
  ariaLabel = 'pagination',
  className = '',
  ...props
}: PaginationProps) {
  const { theme, contrast } = useTheme();

  const safeCount = Math.max(0, count);
  const [uncontrolledPage, setUncontrolledPage] = useState(() => clamp(defaultPage, 1, Math.max(1, safeCount)));
  const currentPage = page !== undefined ? clamp(page, 1, Math.max(1, safeCount)) : uncontrolledPage;

  const handlePageChange = (next: number, event: any) => {
    if (disabled) return;
    const clamped = clamp(next, 1, Math.max(1, safeCount));
    if (page === undefined) setUncontrolledPage(clamped);
    if (onChange) {
      onChange(clamped, event);
    }
  };

  if (safeCount <= 1) return null;

  // Simple pagination logic for demo/migration
  const pages = Array.from({ length: safeCount }, (_, i) => i + 1);
  
  // For larger counts, we would need the full logic from createItems
  // but for now let's implement a basic version that fits shadcn structure.
  
  return (
    <ShadcnPagination
      className={cn(className)}
      data-theme={theme}
      data-contrast={contrast}
      {...(props as any)}
    >
      <PaginationContent>
        {!hidePrevButton && (
          <PaginationItem>
            <PaginationPrevious
              onClick={(e) => handlePageChange(currentPage - 1, e)}
              disabled={disabled || currentPage <= 1}
            />
          </PaginationItem>
        )}
        
        {pages.map((p) => {
          // Very simple range logic
          const isVisible = 
            p === 1 || 
            p === safeCount || 
            (p >= currentPage - siblingCount && p <= currentPage + siblingCount);
          
          if (!isVisible) {
            if (p === currentPage - siblingCount - 1 || p === currentPage + siblingCount + 1) {
              return (
                <PaginationItem key={p}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            return null;
          }

          return (
            <PaginationItem key={p}>
              <PaginationLink
                isActive={p === currentPage}
                onClick={(e) => handlePageChange(p, e)}
                disabled={disabled}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {!hideNextButton && (
          <PaginationItem>
            <PaginationNext
              onClick={(e) => handlePageChange(currentPage + 1, e)}
              disabled={disabled || currentPage >= safeCount}
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </ShadcnPagination>
  );
}
