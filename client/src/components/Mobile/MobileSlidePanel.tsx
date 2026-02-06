import type { ComponentChildren } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { IconChevronLeft } from '@tabler/icons-preact';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Typography } from '@/ui-components/Typography/Typography';
import './MobileSlidePanel.scss';

interface MobileSlidePanelProps {
  /** 패널 열림/닫힘 상태 */
  open: boolean;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 헤더 타이틀 (noHeader가 false일 때 표시) */
  title?: string;
  /** 패널 콘텐츠 */
  children: ComponentChildren;
  /** true이면 기본 헤더를 숨김 — children이 자체 헤더를 가질 때 사용 */
  noHeader?: boolean;
}

/** CSS transition 지속시간(ms). SCSS의 0.3s와 동기화. */
const TRANSITION_MS = 300;

/** Push 효과를 적용할 본 콘텐츠 셀렉터 (SidebarLayout 구조) */
const PUSH_TARGET_SELECTOR = '.sidebar-layout__content';

/**
 * 모바일 전용 슬라이드 패널.
 *
 * SidebarLayout의 MobileSidebar(좌→우)와 정확히 반대 방향(우→좌)으로 동작.
 * 동일한 패턴을 사용하여 통일된 UX 제공:
 *   - 패널: position:fixed + transform 기반 슬라이드
 *   - 본 콘텐츠: push 효과로 왼쪽으로 밀려남
 *   - 오버레이: 배경 딤
 *   - visibility 트릭 없이 순수 transition만 사용
 *
 * ⚠️ 핵심: createPortal로 document.body에 렌더링.
 *   CSS에서 부모에 transform이 적용되면 position:fixed가 viewport 기준이
 *   아닌 부모 기준이 되는 문제를 방지.
 *   MobileSidebar도 push-container의 형제로 렌더링되어 같은 원리.
 */
export function MobileSlidePanel({
  open,
  onClose,
  title = '',
  children,
  noHeader = false,
}: MobileSlidePanelProps) {
  // exit 애니메이션 동안 children 유지를 위한 딜레이드 언마운트
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
    } else {
      const timer = setTimeout(() => setMounted(false), TRANSITION_MS + 50);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // 본 콘텐츠 push 효과 (MobileSidebar의 push-container 패턴 미러링)
  useEffect(() => {
    const contentEl = document.querySelector(PUSH_TARGET_SELECTOR) as HTMLElement;
    if (!contentEl) return;

    if (open) {
      contentEl.classList.add('mobile-slide-pushed--active');
    } else {
      contentEl.classList.remove('mobile-slide-pushed--active');
    }

    return () => {
      contentEl.classList.remove('mobile-slide-pushed--active');
    };
  }, [open]);

  // Body 스크롤 잠금
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const shouldRender = open || mounted;

  // createPortal: document.body에 렌더링하여
  // push 효과(transform)가 걸린 부모의 영향을 받지 않도록 함
  return createPortal(
    <>
      {/* 배경 딤 오버레이 */}
      <div
        className={`mobile-slide-overlay ${open ? 'mobile-slide-overlay--active' : ''}`}
        onClick={onClose}
      />

      {/* 슬라이드 패널 */}
      <div
        className={`mobile-slide-panel ${open ? 'mobile-slide-panel--open' : ''}`}
        aria-hidden={!open}
      >
        {!noHeader && (
          <div className="mobile-slide-panel__header">
            <IconButton onClick={onClose} size="small" style={{ marginLeft: '-4px' }}>
              <IconChevronLeft size={24} />
            </IconButton>
            <Typography variant="h4" style={{ flex: 1 }}>
              {title}
            </Typography>
          </div>
        )}
        <div className="mobile-slide-panel__body">
          {shouldRender && children}
        </div>
      </div>
    </>,
    document.body
  );
}
