import { JSX } from 'preact';
import { useTheme } from '@/core/context/ThemeProvider';
import { Flex } from '@/components/ui/layout';
import { IconCircleCheckFilled } from '@tabler/icons-preact';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends Omit<JSX.HTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options: SelectOption[];
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  value?: string | number;
  disabled?: boolean;
  isValid?: boolean;
  onChange?: (e: any) => void; // modified to be more flexible
}

const ValidationBadge = ({ isValid }: { isValid: boolean }) => (
  <span className={cn(
    "inline-flex items-center ml-1",
    isValid ? "text-[var(--color-status-success)]" : "text-[var(--color-text-tertiary)]"
  )}>
    <IconCircleCheckFilled size={14} />
  </span>
);

export function Select({
  label,
  options,
  error,
  helperText,
  fullWidth = true,
  isValid = false,
  className = '',
  value,
  onChange,
  disabled,
  ...props
}: SelectProps) {
  const { theme, contrast } = useTheme();
  const selectId = props.id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn("grid w-full items-center gap-1.5", fullWidth ? "w-full" : "w-auto", className)} data-theme={theme} data-contrast={contrast}>
      {label && (
        <Label htmlFor={selectId} className="flex items-center gap-1">
          <span>{label}</span>
          <ValidationBadge isValid={isValid} />
        </Label>
      )}
      <ShadcnSelect
        value={value?.toString()}
        onValueChange={(val) => {
          if (onChange) {
            onChange({ target: { value: val } } as any);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger
          id={selectId}
          className={cn(
            error && "border-destructive focus:ring-destructive",
            !fullWidth && "w-auto"
          )}
        >
          <SelectValue placeholder="선택해주세요" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </ShadcnSelect>
      {helperText && (
        <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
          {helperText}
        </p>
      )}
    </div>
  );
}
