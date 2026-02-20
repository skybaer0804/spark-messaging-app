import { JSX } from 'preact';
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from '@/lib/utils';

export interface TooltipProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'title'> {
  title: preact.ComponentChildren;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  open?: boolean;
  defaultOpen?: boolean;
  onOpen?: (event?: any) => void;
  onClose?: (event?: any) => void;
  enterDelay?: number;
  leaveDelay?: number;
  disableHoverListener?: boolean;
  disableFocusListener?: boolean;
  disabled?: boolean;
  children: JSX.Element;
}

export function Tooltip({
  title,
  placement = 'top',
  open,
  defaultOpen = false,
  onOpen,
  onClose,
  disabled = false,
  className = '',
  children,
  ...props
}: TooltipProps) {
  return (
    <ShadcnTooltip
      open={open}
      defaultOpen={defaultOpen}
      onOpenChange={(isOpen) => {
        if (isOpen) onOpen?.();
        else onClose?.();
      }}
    >
      <TooltipTrigger asChild disabled={disabled}>
        {children}
      </TooltipTrigger>
      <TooltipContent
        side={placement}
        className={cn("z-50", className)}
        {...props}
      >
        {title}
      </TooltipContent>
    </ShadcnTooltip>
  );
}
