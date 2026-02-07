import {
  IconAlertCircle,
  IconInfoCircle,
  IconCheck,
  IconAlertTriangle
} from '@tabler/icons-preact';
import { createPortal } from 'preact/compat';
import { Button } from '../Button/Button';
import './Confirm.scss';

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
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <IconCheck size={20} stroke={2.5} />;
      case 'warning': return <IconAlertTriangle size={20} stroke={2.5} />;
      case 'error': return <IconAlertCircle size={20} stroke={2.5} />;
      default: return <IconInfoCircle size={20} />;
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

  return createPortal(
    <div className="confirm-root">
      <div className="confirm-root__backdrop" onClick={handleCancel} />
      <div className="confirm-dialog" role="alertdialog" aria-modal="true">
        <div className="confirm-dialog__header">
          <div className={`confirm-dialog__icon confirm-dialog__icon--${type}`}>
            {getIcon()}
          </div>
          {title && <div className="confirm-dialog__title">{title}</div>}
        </div>
        <div className="confirm-dialog__content">
          <div className="confirm-dialog__message">{message}</div>
        </div>
        <div className="confirm-dialog__actions">
          <Button
            variant="text"
            size="sm"
            onClick={handleCancel}
            className="confirm-dialog__button"
          >
            {cancelText}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            className="confirm-dialog__button"
            style={type === 'error' ? { backgroundColor: 'var(--color-status-error)' } : undefined}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
