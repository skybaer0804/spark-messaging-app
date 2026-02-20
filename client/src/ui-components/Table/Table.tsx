import { JSX } from 'preact';
import { useTheme } from '@/core/context/ThemeProvider';
import {
  Table as ShadcnTable,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from '@/lib/utils';

export type TableAlign = 'left' | 'center' | 'right';

export interface TableColumn<Row> {
  key: string;
  header: preact.ComponentChildren;
  width?: string;
  minWidth?: string;
  align?: TableAlign;
  render?: (row: Row, rowIndex: number) => preact.ComponentChildren;
  value?: (row: Row, rowIndex: number) => preact.ComponentChildren;
}

export interface TableProps<Row> extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'children'> {
  columns: Array<TableColumn<Row>>;
  rows: Row[];
  rowKey?: (row: Row, rowIndex: number) => string | number;
  caption?: preact.ComponentChildren;
  stickyHeader?: boolean;
  striped?: boolean;
  hover?: boolean;
  size?: 'sm' | 'md';
  emptyText?: preact.ComponentChildren;
}

export function Table<Row>({
  columns,
  rows,
  rowKey,
  caption,
  stickyHeader = false,
  striped = false,
  hover = false,
  size = 'md',
  emptyText = '데이터가 없습니다.',
  className = '',
  ...props
}: TableProps<Row>) {
  const { theme, contrast } = useTheme();

  return (
    <div className={cn("w-full", className)} data-theme={theme} data-contrast={contrast} {...(props as any)}>
      <ShadcnTable className={cn(stickyHeader && "relative")}>
        {caption && <TableCaption>{caption}</TableCaption>}
        <TableHeader className={cn(stickyHeader && "sticky top-0 z-10 bg-background")}>
          <TableRow>
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  col.align === 'center' ? "text-center" : col.align === 'right' ? "text-right" : "text-left"
                )}
                style={{ width: col.width, minWidth: col.minWidth }}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {emptyText}
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIndex) => {
              const key = rowKey?.(row, rowIndex) ?? rowIndex;
              return (
                <TableRow 
                  key={String(key)}
                  className={cn(striped && rowIndex % 2 === 1 && "bg-muted/50")}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={cn(
                        col.align === 'center' ? "text-center" : col.align === 'right' ? "text-right" : "text-left"
                      )}
                      style={{ width: col.width, minWidth: col.minWidth }}
                    >
                      {col.render?.(row, rowIndex) ?? col.value?.(row, rowIndex) ?? (row as any)?.[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </ShadcnTable>
    </div>
  );
}
