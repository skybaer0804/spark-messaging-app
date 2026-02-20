import { Input, InputProps } from '../Input/Input';
import { cn } from '@/lib/utils';

export interface TextFieldProps extends InputProps {
  variant?: 'outlined' | 'standard' | 'filled';
  name?: string;
  required?: boolean;
}

export function TextField({ variant = 'outlined', className = '', ...props }: TextFieldProps) {
  // variants are not directly supported by shadcn Input yet, 
  // but we can pass them as classes if needed.
  // For now, we'll just keep the wrapper consistent with Input migration.
  
  return <Input className={cn(`text-field--${variant}`, className)} {...props} />;
}
