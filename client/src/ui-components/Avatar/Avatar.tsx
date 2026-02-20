import { JSX } from 'preact';
import { cn } from '@/lib/utils';
import {
  Avatar as ShadcnAvatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';

export interface AvatarProps extends JSX.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  variant?: 'circular' | 'rounded' | 'square';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children?: preact.ComponentChildren;
}

const sizeClasses: Record<string, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-14 w-14',
};

const variantClasses: Record<string, string> = {
  circular: 'rounded-full',
  rounded: 'rounded-md',
  square: 'rounded-none',
};

export function Avatar({
  src,
  alt,
  variant = 'circular',
  size = 'md',
  className = '',
  children,
  ...props
}: AvatarProps) {
  return (
    <ShadcnAvatar
      className={cn(sizeClasses[size], variantClasses[variant], className)}
      {...(props as JSX.HTMLAttributes<HTMLDivElement>)}
    >
      {src && <AvatarImage src={src} alt={alt} />}
      <AvatarFallback className={variantClasses[variant]}>
        {children}
      </AvatarFallback>
    </ShadcnAvatar>
  );
}
