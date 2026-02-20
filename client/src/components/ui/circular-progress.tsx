import * as React from "react"
import { cn } from "@/lib/utils"

export interface CircularProgressProps extends React.HTMLAttributes<HTMLSpanElement> {
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'inherit';
  size?: number | string;
  value?: number; // 0-100
  variant?: 'determinate' | 'indeterminate';
  thickness?: number;
}

export function CircularProgress({
  color = 'primary',
  size = 40,
  value = 0,
  variant = 'indeterminate',
  thickness = 3.6,
  className,
  style,
  ...props
}: CircularProgressProps) {
  const SIZE = 44;
  const circumference = 2 * Math.PI * ((SIZE - thickness) / 2);
  const strokeDashoffset = variant === 'determinate' 
    ? ((100 - value) / 100) * circumference 
    : undefined;

  const colorClasses = {
    primary: "stroke-primary",
    secondary: "stroke-secondary",
    success: "stroke-success",
    error: "stroke-destructive",
    warning: "stroke-warning",
    info: "stroke-info",
    inherit: "stroke-current",
  };

  return (
    <span
      role="progressbar"
      aria-valuenow={variant === 'determinate' ? Math.round(value) : undefined}
      className={cn(
        "inline-block",
        variant === 'indeterminate' && "animate-spin",
        className
      )}
      style={{
        width: size,
        height: size,
        transform: variant === 'determinate' ? 'rotate(-90deg)' : undefined,
        ...style
      }}
      {...props}
    >
      <svg
        className="block w-full h-full"
        viewBox={`${SIZE / 2} ${SIZE / 2} ${SIZE} ${SIZE}`}
      >
        <circle
          className={cn(
            "transition-[stroke-dashoffset] duration-300 ease-in-out",
            colorClasses[color],
            variant === 'indeterminate' && "animate-[dash_1.5s_ease-in-out_infinite]"
          )}
          cx={SIZE}
          cy={SIZE}
          r={(SIZE - thickness) / 2}
          fill="none"
          strokeWidth={thickness}
          strokeDasharray={circumference.toFixed(3)}
          style={{
            strokeDashoffset: strokeDashoffset?.toFixed(3),
            strokeLinecap: "round"
          }}
        />
      </svg>
      <style>{`
        @keyframes dash {
          0% {
            stroke-dasharray: 1, 150;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -35;
          }
          100% {
            stroke-dasharray: 90, 150;
            stroke-dashoffset: -124;
          }
        }
      `}</style>
    </span>
  );
}
