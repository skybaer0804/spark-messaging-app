import { JSX } from 'preact';
import { useTheme } from '@/core/context/ThemeProvider';
import { Button as ShadcnButton } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'lg' | 'md' | 'sm';
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children: preact.ComponentChildren;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const { theme, contrast } = useTheme();

  // shadcn variant mapping
  const shadcnVariant = variant === 'primary' ? 'default' : variant === 'text' ? 'ghost' : 'secondary';
  
  // shadcn size mapping
  const shadcnSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'default';

  return (
    <ShadcnButton
      variant={shadcnVariant as any}
      size={shadcnSize as any}
      className={cn(fullWidth && 'w-full', className)}
      data-theme={theme}
      data-contrast={contrast}
      {...props}
    >
      {children}
    </ShadcnButton>
  );
}
