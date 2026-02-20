import { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { useTheme } from '@/core/context/ThemeProvider';
import { Radio } from '../Radio/Radio';
import { RadioGroup as ShadcnRadioGroup } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

export type RadioGroupValue = string | number;

export interface RadioGroupOption {
  value: RadioGroupValue;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  label?: string;
  helperText?: string;
  name?: string;
  options: RadioGroupOption[];
  value?: RadioGroupValue;
  defaultValue?: RadioGroupValue;
  onChange?: (value: RadioGroupValue, event: Event) => void;
  direction?: 'row' | 'column';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'small' | 'medium';
  disabled?: boolean;
}

export function RadioGroup({
  label,
  helperText,
  name,
  options,
  value,
  defaultValue,
  onChange,
  direction = 'column',
  color = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  ...props
}: RadioGroupProps) {
  const { theme, contrast } = useTheme();

  const generatedName = useMemo(() => `radio-group-${Math.random().toString(36).slice(2, 9)}`, []);
  const groupName = name ?? generatedName;

  const getFirstEnabledValue = () => {
    const first = options.find((o) => !(disabled || o.disabled));
    return first?.value ?? options[0]?.value;
  };

  const [uncontrolledValue, setUncontrolledValue] = useState<RadioGroupValue | undefined>(() => {
    if (defaultValue !== undefined) return defaultValue;
    return getFirstEnabledValue();
  });

  const selectedValue = value !== undefined ? value : uncontrolledValue;

  const setSelected = (next: RadioGroupValue, event: Event) => {
    if (disabled) return;
    if (value === undefined) setUncontrolledValue(next);
    onChange?.(next, event);
  };

  return (
    <div className={cn("grid gap-3", className)} data-theme={theme} data-contrast={contrast}>
      {label && <div className="text-sm font-medium leading-none">{label}</div>}
      <ShadcnRadioGroup
        name={groupName}
        value={selectedValue?.toString()}
        onValueChange={(val) => {
          const opt = options.find(o => o.value.toString() === val);
          if (opt) {
            setSelected(opt.value, {} as any);
          }
        }}
        disabled={disabled}
        className={cn(
          direction === 'row' ? "flex flex-row space-x-4" : "flex flex-column space-y-2"
        )}
        {...(props as any)}
      >
        {options.map((opt) => {
          const optDisabled = disabled || !!opt.disabled;
          return (
            <Radio
              key={String(opt.value)}
              value={opt.value}
              label={opt.label}
              disabled={optDisabled}
              color={color}
              size={size}
            />
          );
        })}
      </ShadcnRadioGroup>
      {helperText && (
        <p className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
    </div>
  );
}
