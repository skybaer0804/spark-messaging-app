import * as React from "react"
import { useTheme } from "@/core/context/ThemeProvider"
import { cn } from "@/lib/utils"

export interface PaperProps extends React.HTMLAttributes<HTMLDivElement> {
  elevation?: number; // 0 to 5
  variant?: 'elevation' | 'outlined';
  square?: boolean;
  padding?: string; // 'sm', 'md', 'lg'
}

const Paper = React.forwardRef<HTMLDivElement, PaperProps>(
  ({ elevation = 1, variant = 'elevation', square = false, padding = 'md', className, ...props }, ref) => {
    const { theme, contrast } = useTheme()

    const elevationClasses = [
      "",
      "shadow-sm",
      "shadow",
      "shadow-md",
      "shadow-lg",
      "shadow-xl",
      "shadow-2xl"
    ]

    return (
      <div
        ref={ref}
        className={cn(
          "bg-card text-card-foreground",
          variant === 'elevation' ? elevationClasses[elevation] : "border border-border",
          !square && "rounded-lg",
          padding && padding !== 'none' ? `p-${padding === 'sm' ? '2' : padding === 'md' ? '4' : '6'}` : (padding === 'none' ? 'p-0' : ''),
          className
        )}
        data-theme={theme}
        data-contrast={contrast}
        {...props}
      />
    )
  }
)
Paper.displayName = "Paper"

export { Paper }
