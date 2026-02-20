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
  IconAlertCircle,
  IconInfoCircle,
  IconCheck,
  IconAlertTriangle
} from '@tabler/icons-preact';
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
      case 'success': return <IconCheck className="h-5 w-5 text-success" />;
      case 'warning': return <IconAlertTriangle className="h-5 w-5 text-warning" />;
      case 'error': return <IconAlertCircle className="h-5 w-5 text-destructive" />;
      default: return <IconInfoCircle className="h-5 w-5 text-info" />;
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
