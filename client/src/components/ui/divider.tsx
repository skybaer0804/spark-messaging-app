import * as React from "react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'fullWidth' | 'inset' | 'middle';
  orientation?: 'horizontal' | 'vertical';
  flexItem?: boolean;
}

const variantClasses: Record<string, string> = {
  fullWidth: '',
  inset: 'ml-16',
  middle: 'mx-4',
};

export function Divider({
  variant = 'fullWidth',
  orientation = 'horizontal',
  flexItem = false,
  className,
  ...props
}: DividerProps) {
  return (
    <Separator
      orientation={orientation}
      className={cn(
        variantClasses[variant],
        flexItem && orientation === 'vertical' && 'self-stretch h-auto',
        className,
      )}
      {...props}
    />
  );
}
