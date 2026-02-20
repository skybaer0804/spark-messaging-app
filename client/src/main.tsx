import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app';
import { AuthProvider } from '@/core/context/AuthContext';
import { ToastProvider } from '@/core/context/ToastContext';
import { ConfirmProvider } from '@/core/context/ConfirmContext';
import { ThemeProvider } from '@/core/context/ThemeProvider';
import { TooltipProvider } from '@/components/ui/tooltip';
import './index.css';

// Vite PWA 서비스 워커 등록 (Lifecycle 관리 자동화)
// 초기 로드 지연으로 성능 최적화: 메인 스레드 블로킹 방지
const registerServiceWorker = () => {
  registerSW({
    immediate: true,
    onNeedRefresh() {
    },
    onOfflineReady() {
    },
  });
};

// requestIdleCallback이 있으면 사용, 없으면 setTimeout으로 지연
if ('requestIdleCallback' in window) {
  requestIdleCallback(registerServiceWorker, { timeout: 2000 });
} else {
  setTimeout(registerServiceWorker, 1000);
}

render(
  <ThemeProvider>
    <TooltipProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ConfirmProvider>
      </ToastProvider>
    </TooltipProvider>
  </ThemeProvider>,
  document.getElementById('app')!,
);
