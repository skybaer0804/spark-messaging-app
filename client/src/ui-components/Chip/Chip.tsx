import { JSX } from 'preact';
import { IconX } from '@tabler/icons-preact';
import { cn } from '@/lib/utils';
import { badgeVariants } from '@/components/ui/badge';

export interface ChipProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'size'> {
  label: string;
  onDelete?: () => void;
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  avatar?: preact.ComponentChildren;
}

const sizeClasses: Record<string, string> = {
  sm: 'text-xs px-2 py-0',
  md: 'text-sm px-2.5 py-0.5',
  lg: 'text-sm px-3 py-1',
};

const variantMap = {
  default: 'outline' as const,
  primary: 'default' as const,
  secondary: 'secondary' as const,
};

export function Chip({
  label,
  onDelete,
  variant = 'default',
  size = 'md',
  disabled = false,
  avatar,
  className = '',
  ...props
}: ChipProps) {
  return (
    <div
      className={cn(
        badgeVariants({ variant: variantMap[variant] }),
        sizeClasses[size],
        'inline-flex items-center gap-1',
        disabled && 'opacity-50 pointer-events-none',
        onDelete && 'pr-1',
        className,
      )}
      {...props}
    >
      {avatar && <span className="flex items-center">{avatar}</span>}
      <span>{label}</span>
      {onDelete && !disabled && (
        <button
          type="button"
          className="ml-0.5 rounded-full opacity-70 hover:opacity-100 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`${label} 제거`}
        >
          <IconX size={12} />
        </button>
      )}
    </div>
  );
}
