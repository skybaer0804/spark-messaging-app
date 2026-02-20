import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface IconButtonProps extends Omit<ButtonProps, "size"> {
  size?: "small" | "medium" | "large" | "icon"
  active?: boolean
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "ghost", size = "medium", active = false, ...props }, ref) => {
    const shadcnSize = size === "small" ? "sm" : size === "large" ? "lg" : size === "icon" ? "icon" : "default"
    
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
      />
    )
  }
)
IconButton.displayName = "IconButton"

export { IconButton }
