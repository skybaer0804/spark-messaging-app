import { JSX } from 'preact';
import { Checkbox as ShadcnCheckbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<JSX.HTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean, event: Event) => void;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'small' | 'medium';
  label?: string;
}

export function Checkbox({
  checked,
  defaultChecked,
  indeterminate = false,
  disabled = false,
  onChange,
  color = 'primary',
  size = 'medium',
  label,
  className = '',
  ...props
}: CheckboxProps) {
  const checkboxId = props.id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  // Mapping color to tailwind classes
  const colorClasses = {
    primary: 'border-primary data-[state=checked]:bg-primary',
    secondary: 'border-secondary data-[state=checked]:bg-secondary',
    success: 'border-success data-[state=checked]:bg-success',
    error: 'border-destructive data-[state=checked]:bg-destructive',
    warning: 'border-warning data-[state=checked]:bg-warning',
    info: 'border-info data-[state=checked]:bg-info',
  };

  // Mapping size to tailwind classes
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
  };

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <ShadcnCheckbox
        id={checkboxId}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(checkedState) => {
          if (onChange) {
            onChange(checkedState === true, {} as any); // event is not available here
          }
        }}
        className={cn(colorClasses[color], sizeClasses[size])}
        {...(props as any)}
      />
      {label && (
        <Label
          htmlFor={checkboxId}
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
