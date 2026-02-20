import { JSX } from 'preact';
import { useTheme } from '@/core/context/ThemeProvider';
import { Flex } from '@/components/ui/layout';
import { IconCircleCheckFilled } from '@tabler/icons-preact';
import { Input as ShadcnInput } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface InputProps extends Omit<JSX.HTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'size'> {
  label?: preact.ComponentChildren;
  helperText?: string;
  error?: boolean;
  multiline?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  value?: string | number;
  rows?: number;
  type?: string;
  isValid?: boolean;
  startAdornment?: JSX.Element;
  endAdornment?: JSX.Element;
}

const ValidationBadge = ({ isValid }: { isValid: boolean }) => (
  <span className={cn(
    "inline-flex items-center ml-1",
    isValid ? "text-[var(--color-status-success)]" : "text-[var(--color-text-tertiary)]"
  )}>
    <IconCircleCheckFilled size={14} />
  </span>
);

export function Input({
  label,
  helperText,
  error,
  isValid = false,
  multiline = false,
  fullWidth = true,
  className = '',
  startAdornment,
  endAdornment,
  ...props
}: InputProps) {
  const { theme, contrast } = useTheme();
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn("grid w-full items-center gap-1.5", fullWidth ? "w-full" : "w-auto", className)} data-theme={theme} data-contrast={contrast}>
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
            className={cn(
              error && "border-destructive focus-visible:ring-destructive",
              startAdornment && "pl-10",
              endAdornment && "pr-10"
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
