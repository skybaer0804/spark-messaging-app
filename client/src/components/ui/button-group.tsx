import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  fullWidth?: boolean;
  attached?: boolean;
}

export function ButtonGroup({
  orientation = 'horizontal',
  fullWidth = false,
  attached = true,
  className,
  children,
  ...props
}: ButtonGroupProps) {
  return (
    <div
      className={cn(
        "flex",
        orientation === 'vertical' ? "flex-col" : "flex-row",
        fullWidth && "w-full",
        attached ? (
          orientation === 'horizontal' 
            ? "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none [&>*:not(:first-child)]:border-l-0"
            : "[&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none [&>*:not(:first-child)]:border-t-0"
        ) : "gap-2",
        className
      )}
      role="group"
      {...props}
    >
      {children}
    </div>
  );
}
