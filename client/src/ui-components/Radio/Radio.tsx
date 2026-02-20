import { JSX } from 'preact';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface RadioProps extends Omit<JSX.HTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean, event: Event) => void;
  value?: string | number;
  name?: string;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'small' | 'medium';
  label?: string;
}

export function Radio({
  checked,
  disabled = false,
  onChange,
  value,
  name,
  color = 'primary',
  size = 'medium',
  label,
  className = '',
  ...props
}: RadioProps) {
  const radioId = props.id || `radio-${Math.random().toString(36).substr(2, 9)}`;

  // Mapping color to tailwind classes
  const colorClasses = {
    primary: 'border-primary text-primary',
    secondary: 'border-secondary text-secondary',
    success: 'border-success text-success',
    error: 'border-destructive text-destructive',
    warning: 'border-warning text-warning',
    info: 'border-info text-info',
  };

  // Mapping size to tailwind classes
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <RadioGroupItem
        id={radioId}
        value={value?.toString() || ''}
        checked={checked}
        disabled={disabled}
        className={cn(colorClasses[color], sizeClasses[size])}
        {...(props as any)}
      />
      {label && (
        <Label
          htmlFor={radioId}
          className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            size === 'small' ? 'text-xs' : 'text-sm'
          )}
        >
          {label}
        </Label>
      )}
    </div>
  );
}
