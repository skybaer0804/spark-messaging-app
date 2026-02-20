import * as React from "react"
import { cn } from "@/lib/utils"
import { badgeVariants } from "@/components/ui/badge"

export type StatusChipVariant = 'active' | 'pending' | 'badge' | 'default';

export interface StatusChipProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: StatusChipVariant;
  label: string;
}

const variantClasses: Record<StatusChipVariant, string> = {
  active: 'bg-success text-success-foreground border-transparent hover:bg-success/80',
  pending: 'bg-warning text-warning-foreground border-transparent hover:bg-warning/80',
  badge: 'bg-primary text-primary-foreground border-transparent hover:bg-primary/80',
  default: 'text-foreground',
};

const StatusChip = React.forwardRef<HTMLDivElement, StatusChipProps>(
  ({ variant = 'default', label, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          badgeVariants({ variant: 'outline' }),
          variantClasses[variant],
          'rounded-full',
          className,
        )}
        {...props}
      >
        {label}
      </div>
    );
  }
)
StatusChip.displayName = "StatusChip"

export { StatusChip }
