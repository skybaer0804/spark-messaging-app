import { createContext } from 'preact';
import { useContext, useEffect } from 'preact/hooks';
import { toast, Toaster } from 'sonner';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastProps {
  type?: 'success' | 'error' | 'info' | 'warning';
}

interface ToastContextType {
  showToast: (message: string, type?: ToastProps['type'], duration?: number, action?: ToastAction) => string | number;
  showSuccess: (message: string, duration?: number) => string | number;
  showError: (message: string, duration?: number) => string | number;
  showInfo: (message: string, duration?: number, action?: ToastAction) => string | number;
  showWarning: (message: string, duration?: number) => string | number;
  hideToast: (id: string | number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

/**
 * Toast Provider 컴포넌트
 */
export function ToastProvider({ children }: { children: any }) {
  const showToast = (
    message: string,
    type: ToastProps['type'] = 'info',
    duration = 3000,
    action: ToastAction | undefined = undefined,
  ) => {
    const options = {
      duration,
      action: action
        ? {
            label: action.label,
            onClick: action.onClick,
          }
        : undefined,
    };

    switch (type) {
      case 'success':
        return toast.success(message, options);
      case 'error':
        return toast.error(message, options);
      case 'warning':
        return toast.warning(message, options);
      case 'info':
      default:
        return toast(message, options);
    }
  };

  const hideToast = (id: string | number) => {
    toast.dismiss(id);
  };

  const showSuccess = (message: string, duration?: number) => {
    return showToast(message, 'success', duration);
  };

  const showError = (message: string, duration?: number) => {
    return showToast(message, 'error', duration);
  };

  const showInfo = (message: string, duration?: number, action?: ToastAction) => {
    return showToast(message, 'info', duration, action);
  };

  const showWarning = (message: string, duration?: number) => {
    return showToast(message, 'warning', duration);
  };

  // 전역 API 에러 및 알림 이벤트 리스너
  useEffect(() => {
    const handleApiError = (event: any) => {
      showError(event.detail || '알 수 없는 오류가 발생했습니다.');
    };

    const handleApiInfo = (event: any) => {
      const { detail } = event;
      const message = typeof detail === 'string' ? detail : detail?.message || detail?.content || '';
      const actionUrl = typeof detail === 'string' ? null : detail?.actionUrl;

      showInfo(
        message,
        5000,
        actionUrl
          ? {
              label: '이동하기',
              onClick: () => {
                window.dispatchEvent(new CustomEvent('app-navigate', { detail: actionUrl }));
              },
            }
          : undefined,
      );
    };

    window.addEventListener('api-error', handleApiError);
    window.addEventListener('api-info', handleApiInfo);
    return () => {
      window.removeEventListener('api-error', handleApiError);
      window.removeEventListener('api-info', handleApiInfo);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showWarning, hideToast }}>
      {children}
      <Toaster richColors position="top-center" />
    </ToastContext.Provider>
  );
}

/**
 * Toast Hook
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
