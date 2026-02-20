import * as React from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  InfoIcon,
  CircleCheck,
  AlertTriangle,
  AlertCircle
} from 'lucide-preact';
import { cn } from '@/lib/utils';

export interface ConfirmOptions {
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}

interface ConfirmProps extends ConfirmOptions {
  isOpen: boolean;
  onClose: () => void;
}

export function Confirm({
  isOpen,
  title,
  message,
  type = 'info',
  confirmText = '확인',
  cancelText = '취소',
  onConfirm,
  onCancel,
  onClose
}: ConfirmProps) {
  const getIcon = () => {
    switch (type) {
      case 'success': return <CircleCheck className="h-5 w-5 text-success" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-warning" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-destructive" />;
      default: return <InfoIcon className="h-5 w-5 text-info" />;
    }
  };

  const handleConfirm = async () => {
    try {
      if (onConfirm) {
        await onConfirm();
      }
    } catch (error) {
      console.error('[Confirm] error in onConfirm:', error);
    } finally {
      onClose();
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            {getIcon()}
            {title && <AlertDialogTitle>{title}</AlertDialogTitle>}
          </div>
          <AlertDialogDescription>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={cn(
              type === 'error' && "bg-destructive text-destructive-foreground hover:bg-destructive/90"
            )}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
