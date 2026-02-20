import * as React from "react"
import { cn } from "@/lib/utils"
import { Input as ShadcnInput } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconCircleCheckFilled } from "@tabler/icons-preact"

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: React.ReactNode;
  helperText?: string;
  error?: boolean;
  multiline?: boolean;
  fullWidth?: boolean;
  isValid?: boolean;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  rows?: number;
}

const ValidationBadge = ({ isValid }: { isValid: boolean }) => (
  <span className={cn(
    "inline-flex items-center ml-1",
    isValid ? "text-success" : "text-muted-foreground"
  )}>
    <IconCircleCheckFilled size={14} />
  </span>
);

const TextField = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, TextFieldProps>(
  ({ label, helperText, error, isValid = false, multiline = false, fullWidth = true, className, startAdornment, endAdornment, ...props }, ref) => {
    const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn("grid w-full items-center gap-1.5", fullWidth ? "w-full" : "w-auto", className)}>
        {label && (
          <Label htmlFor={inputId} className="flex items-center gap-1">
            {typeof label === 'string' ? <span>{label}</span> : label}
            <ValidationBadge isValid={isValid} />
          </Label>
        )}
        <div className="relative flex items-center">
          {startAdornment && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {startAdornment}
            </div>
          )}
          {multiline ? (
            <textarea
              id={inputId}
              ref={ref as any}
              className={cn(
                "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                error && "border-destructive focus-visible:ring-destructive",
                startAdornment && "pl-10",
                endAdornment && "pr-10",
                className
              )}
              {...(props as any)}
            />
          ) : (
            <ShadcnInput
              id={inputId}
              ref={ref as any}
              className={cn(
                error && "border-destructive focus-visible:ring-destructive",
                startAdornment && "pl-10",
                endAdornment && "pr-10",
                className
              )}
              {...(props as any)}
            />
          )}
          {endAdornment && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {endAdornment}
            </div>
          )}
        </div>
        {helperText && (
          <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
)
TextField.displayName = "TextField"

export { TextField }
