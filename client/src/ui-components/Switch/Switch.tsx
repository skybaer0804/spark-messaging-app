import { JSX } from 'preact';
import { Switch as ShadcnSwitch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export interface SwitchProps extends Omit<JSX.HTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean, event: Event) => void;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'small' | 'medium';
}

export function Switch({
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  color = 'primary',
  size = 'medium',
  className = '',
  ...props
}: SwitchProps) {
  // Color mapping
  const colorClasses = {
    primary: 'data-[state=checked]:bg-primary',
    secondary: 'data-[state=checked]:bg-secondary',
    success: 'data-[state=checked]:bg-success',
    error: 'data-[state=checked]:bg-destructive',
    warning: 'data-[state=checked]:bg-warning',
    info: 'data-[state=checked]:bg-info',
  };

  // Size mapping
  const sizeClasses = {
    small: 'h-5 w-9 scale-75',
    medium: 'h-6 w-11',
  };

  return (
    <ShadcnSwitch
      checked={checked}
      disabled={disabled}
      onCheckedChange={(checkedState) => {
        if (onChange) {
          onChange(checkedState, {} as any);
        }
      }}
      className={cn(colorClasses[color], sizeClasses[size], className)}
      {...(props as any)}
    />
  );
}
