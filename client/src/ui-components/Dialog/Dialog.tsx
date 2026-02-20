import { JSX } from 'preact';
import {
  Dialog as ShadcnDialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from '@/lib/utils';

export interface DialogProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'title'> {
  open: boolean;
  onClose: (event?: any) => void;
  title?: preact.ComponentChildren;
  children: preact.ComponentChildren;
  actions?: preact.ComponentChildren;
  maxWidth?: 'sm' | 'md' | 'lg' | false;
  fullWidth?: boolean;
  disableEscapeKeyDown?: boolean;
  disableBackdropClick?: boolean;
  hideCloseButton?: boolean;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = false,
  disableEscapeKeyDown = false,
  disableBackdropClick = false,
  hideCloseButton = false,
  ariaLabelledby,
  ariaDescribedby,
  className = '',
  ...props
}: DialogProps) {
  // Mapping maxWidth to tailwind classes
  const maxWidthClasses = {
    sm: 'sm:max-w-lg',
    md: 'sm:max-w-2xl',
    lg: 'sm:max-w-4xl',
    false: 'sm:max-w-none',
  };

  return (
    <ShadcnDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <ShadcnDialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) onClose();
        }}
      >
        <DialogContent
          className={cn(
            maxWidthClasses[maxWidth as keyof typeof maxWidthClasses],
            fullWidth && "w-full",
            className
          )}
          onPointerDownOutside={(e) => {
            if (disableBackdropClick) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (disableEscapeKeyDown) e.preventDefault();
          }}
          {...(props as any)}
        >
          {(title || !hideCloseButton) && (
            <DialogHeader>
              {title && (
                <DialogTitle id={ariaLabelledby}>
                  {title}
                </DialogTitle>
              )}
            </DialogHeader>
          )}
          <div id={ariaDescribedby} className="py-4">
            {children}
          </div>
          {actions && (
            <DialogFooter>
              {actions}
            </DialogFooter>
          )}
        </DialogContent>
      </ShadcnDialog>
    </ShadcnDialog>
  );
}

// Fixed nested Dialog issue in implementation
export function DialogWrapper({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = false,
  disableEscapeKeyDown = false,
  disableBackdropClick = false,
  hideCloseButton = false,
  ariaLabelledby,
  ariaDescribedby,
  className = '',
  ...props
}: DialogProps) {
  const maxWidthClasses = {
    sm: 'sm:max-w-lg',
    md: 'sm:max-w-2xl',
    lg: 'sm:max-w-4xl',
    false: 'sm:max-w-none',
  };

  return (
    <ShadcnDialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={cn(
          maxWidthClasses[maxWidth as keyof typeof maxWidthClasses],
          fullWidth && "w-full",
          className
        )}
        onPointerDownOutside={(e) => {
          if (disableBackdropClick) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (disableEscapeKeyDown) e.preventDefault();
        }}
        {...(props as any)}
      >
        {(title || !hideCloseButton) && (
          <DialogHeader>
            {title && (
              <DialogTitle id={ariaLabelledby}>
                {title}
              </DialogTitle>
            )}
          </DialogHeader>
        )}
        <div id={ariaDescribedby} className="py-4">
          {children}
        </div>
        {actions && (
          <DialogFooter>
            {actions}
          </DialogFooter>
        )}
      </DialogContent>
    </ShadcnDialog>
  );
}

// Export the wrapper version as the main Dialog
export { DialogWrapper as Dialog };
