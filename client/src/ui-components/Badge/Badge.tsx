import { JSX } from 'preact';
import { useTheme } from '@/core/context/ThemeProvider';
import { Badge as ShadcnBadge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface BadgeProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  badgeContent?: preact.ComponentChildren;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'success';
  variant?: 'standard' | 'dot';
  invisible?: boolean;
  children: preact.ComponentChildren;
}

export function Badge({
  badgeContent,
  color = 'primary',
  variant = 'standard',
  invisible = false,
  className = '',
  children,
  ...props
}: BadgeProps) {
  const { theme } = useTheme();

  if (invisible) return <>{children}</>;

  // Mapping existing colors to shadcn variants
  const shadcnVariant = color === 'error' ? 'destructive' : color === 'primary' ? 'default' : color;

  return (
    <span className={cn('relative inline-flex align-middle shrink-0', className)} {...props}>
      {children}
      {!invisible && (
        <ShadcnBadge
          variant={shadcnVariant as any}
          className={cn(
            'absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 z-10',
            variant === 'dot' ? 'h-2 w-2 min-w-0 p-0 rounded-full' : 'h-5 min-w-[20px] px-1.5'
          )}
          data-theme={theme}
        >
          {variant !== 'dot' && badgeContent}
        </ShadcnBadge>
      )}
    </span>
  );
}
