import { JSX } from 'preact';
import { IconInfoCircle, IconCheck, IconAlertTriangle, IconAlertCircle, IconX } from '@tabler/icons-preact';
import { Alert as ShadcnAlert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export interface AlertProps extends JSX.HTMLAttributes<HTMLDivElement> {
  severity?: 'success' | 'info' | 'warning' | 'error';
  variant?: 'filled' | 'outlined' | 'standard';
  onClose?: (event: Event) => void;
  icon?: JSX.Element | boolean;
}

export function Alert({
  severity = 'success',
  variant = 'standard',
  onClose,
  icon,
  className = '',
  children,
  ...props
}: AlertProps) {
  const defaultIcon = {
    success: <IconCheck className="h-4 w-4" />,
    info: <IconInfoCircle className="h-4 w-4" />,
    warning: <IconAlertTriangle className="h-4 w-4" />,
    error: <IconAlertCircle className="h-4 w-4" />,
  };

  const shadcnVariant = severity === 'error' ? 'destructive' : severity;

  return (
    <ShadcnAlert
      variant={shadcnVariant as any}
      className={cn(
        variant === 'outlined' ? 'border' : variant === 'filled' ? 'bg-primary text-primary-foreground' : '',
        className
      )}
      {...props}
    >
      {icon !== false && (icon || defaultIcon[severity])}
      <AlertDescription className="flex items-center justify-between w-full">
        <span>{children}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1 hover:bg-black/10 transition-colors"
            aria-label="Close"
          >
            <IconX size={16} />
          </button>
        )}
      </AlertDescription>
    </ShadcnAlert>
  );
}
