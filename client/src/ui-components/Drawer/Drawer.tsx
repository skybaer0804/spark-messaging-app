import { JSX } from 'preact';
import { IconX } from '@tabler/icons-preact';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Typography } from '@/ui-components/Typography/Typography';
import { cn } from '@/lib/utils';
import { Button } from '@/ui-components/Button/Button';

export interface DrawerProps extends JSX.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  anchor?: 'left' | 'right' | 'top' | 'bottom';
  title?: string;
  width?: string;
  children: preact.ComponentChildren;
}

export function Drawer({
  open,
  onClose,
  anchor = 'right',
  title,
  width,
  className = '',
  children,
  ...props
}: DrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side={anchor}
        className={cn(className)}
        style={width ? { width } : undefined}
        {...(props as any)}
      >
        {title && (
          <SheetHeader className="mb-4">
            <SheetTitle>
              <Typography variant="h3" className="drawer__title">
                {title}
              </Typography>
            </SheetTitle>
          </SheetHeader>
        )}
        <div className="drawer__content h-full overflow-y-auto">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
