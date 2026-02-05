import { useState, useEffect } from 'preact/hooks';
import type { RefObject } from 'preact';

interface Position {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  isReady: boolean;
}

export function useMentionPicker(anchorRef: RefObject<HTMLElement>, isOpen: boolean) {
  const [position, setPosition] = useState<Position>({ left: 0, width: 0, isReady: false });
  
  useEffect(() => {
    if (!isOpen) {
      setPosition({ left: 0, width: 0, isReady: false });
      return;
    }
    
    let rafId: number | null = null;
    
    const updatePosition = () => {
      let container: HTMLElement | null = anchorRef.current;
      
      if (!container) {
        container = document.querySelector('.chat-input-container') as HTMLElement;
      }
      
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      const viewportHeight = window.innerHeight;
      const width = rect.width;
      
      // 기본값: 입력창 바로 위에 표시 (bottom-up)
      let bottom: number | undefined = viewportHeight - rect.top + 8;
      let top: number | undefined = undefined;
      let left = rect.left;
      
      // 공간이 부족하면 아래쪽에 표시
      if (rect.top < 400) { // 400px 정도의 여유 공간이 없으면
        top = rect.bottom + 8;
        bottom = undefined;
      }
      
      // 오른쪽으로 넘어가면 조정
      if (left + width > viewportWidth) {
        left = viewportWidth - width - 16;
      }
      
      if (left < 0) {
        left = 16;
      }
      
      setPosition({ top, bottom, left, width, isReady: true });
    };
    
    updatePosition();
    rafId = requestAnimationFrame(updatePosition);
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, anchorRef]);
  
  return position;
}
