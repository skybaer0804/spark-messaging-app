import { JSX } from 'preact';
import { Skeleton as ShadcnSkeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'wave' | false;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const mergedStyle = {
    width,
    height,
    ...(style && typeof style === 'object' && !('value' in style) ? style : {}),
  } as JSX.CSSProperties;

  // Variant mapping to classes
  const variantClasses = {
    text: 'h-4 w-full rounded',
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    rounded: 'rounded-md',
  };

  return (
    <ShadcnSkeleton
      className={cn(
        variantClasses[variant],
        animation === 'pulse' ? 'animate-pulse' : animation === false ? 'animate-none' : 'animate-pulse', // fallback wave to pulse for now
        className
      )}
      style={mergedStyle}
      {...props}
    />
  );
}
