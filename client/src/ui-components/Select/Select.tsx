import { JSX } from 'preact';
import { useTheme } from '@/core/context/ThemeProvider';
import { Flex } from '@/ui-components/Layout/Flex';
import { IconCircleCheckFilled } from '@tabler/icons-preact';
import './Select.scss';

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
  onChange?: JSX.GenericEventHandler<HTMLSelectElement>;
}

const ValidationBadge = ({ isValid }: { isValid: boolean }) => (
  <span style={{ 
    color: isValid ? 'var(--color-status-success)' : 'var(--color-text-tertiary)',
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: '4px'
  }}>
    <IconCircleCheckFilled size={14} />
  </span>
);

export function Select({ label, options, error, helperText, fullWidth = true, isValid = false, className = '', ...props }: SelectProps) {
  const { theme, contrast } = useTheme();
  const selectId = props.id || `select-${Math.random().toString(36).substr(2, 9)}`;

  const wrapperClasses = ['select-group', fullWidth ? 'fullWidth' : '', className].filter(Boolean).join(' ');
  const selectClasses = ['select', error ? 'error' : ''].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses} data-theme={theme} data-contrast={contrast}>
      {label && (
        <label htmlFor={selectId} className="select-label">
          <Flex align="center" gap="xs">
            <span>{label}</span>
            <ValidationBadge isValid={isValid} />
          </Flex>
        </label>
      )}
      <div className="select-wrapper">
        <select id={selectId} className={selectClasses} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {/* Custom arrow icon can be added here if needed via CSS or SVG */}
      </div>
      {helperText && <span className={`select-helper-text ${error ? 'error' : ''}`}>{helperText}</span>}
    </div>
  );
}
