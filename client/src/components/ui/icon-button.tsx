import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface IconButtonProps extends Omit<ButtonProps, "size"> {
  size?: "small" | "medium" | "large" | "icon" | "sm" | "lg"
  active?: boolean
  icon?: React.ReactNode
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "medium", active = false, icon, children, ...props }, ref) => {
    const shadcnSize = size === "small" || size === "sm" ? "sm" : size === "large" || size === "lg" ? "lg" : size === "icon" ? "icon" : "default"
    
    return (
      <Button
        ref={ref}
        variant={variant}
        size={shadcnSize}
        className={cn(
          "h-auto p-1.5", // Match standard IconButton padding
          active && "bg-accent text-accent-foreground",
          className
        )}
        {...props}
      >
        {icon || children}
      </Button>
    )
  }
)
IconButton.displayName = "IconButton"

export { IconButton }
