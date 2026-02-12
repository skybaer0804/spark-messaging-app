import { JSX } from 'preact';
import { useTheme } from '@/core/context/ThemeProvider';
import { Flex } from '@/ui-components/Layout/Flex';
import { IconCircleCheckFilled } from '@tabler/icons-preact';
import './Input.scss';

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
  <span style={{ 
    color: isValid ? 'var(--color-status-success)' : 'var(--color-text-tertiary)',
    display: 'inline-flex',
    alignItems: 'center',
    marginLeft: '4px'
  }}>
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

  const wrapperClasses = ['input-group', fullWidth ? 'fullWidth' : '', className].filter(Boolean).join(' ');

  const inputClasses = [
    'input',
    multiline ? 'input-textarea' : '',
    error ? 'error' : '',
    startAdornment ? 'has-start' : '',
    endAdornment ? 'has-end' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses} data-theme={theme} data-contrast={contrast}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          <Flex align="center" gap="xs">
            {typeof label === 'string' ? <span>{label}</span> : label}
            <ValidationBadge isValid={isValid} />
          </Flex>
        </label>
      )}
      <div className="input-container">
        {startAdornment && <div className="input-adornment start">{startAdornment}</div>}
        {multiline ? (
          <textarea id={inputId} className={inputClasses} {...(props as JSX.HTMLAttributes<HTMLTextAreaElement>)} />
        ) : (
          <input id={inputId} className={inputClasses} {...(props as JSX.HTMLAttributes<HTMLInputElement>)} />
        )}
        {endAdornment && <div className="input-adornment end">{endAdornment}</div>}
      </div>
      {helperText && <span className={`input-helper-text ${error ? 'error' : ''}`}>{helperText}</span>}
    </div>
  );
}
