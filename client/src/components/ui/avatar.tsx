import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const AvatarRoot = AvatarPrimitive.Root

export interface AvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  variant?: 'circular' | 'rounded' | 'square';
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, src, alt, fallback, size = 'md', variant = 'circular', children, ...props }, ref) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const variantClasses = {
    circular: 'rounded-full',
    rounded: 'rounded-md',
    square: 'rounded-none',
  };

  const customSize = typeof size === 'number' ? { width: size, height: size } : {};

  return (
    <AvatarRoot
      ref={ref}
      className={cn(
        "relative flex shrink-0 overflow-hidden",
        typeof size === 'string' ? sizeClasses[size as keyof typeof sizeClasses] : '',
        variantClasses[variant],
        className
      )}
      style={customSize}
      {...props}
    >
      {src && <AvatarImage src={src} alt={alt} />}
      <AvatarFallback className={variantClasses[variant]}>
        {fallback || children}
      </AvatarFallback>
    </AvatarRoot>
  )
})
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
