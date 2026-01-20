import { useState, useEffect } from 'preact/hooks';
import type { RefObject } from 'preact';

interface Position {
  top: number;
  left: number;
  isReady: boolean; // 위치 계산 완료 여부
}

export function useEmojiPicker(anchorRef: RefObject<HTMLElement>, isOpen: boolean) {
  const [position, setPosition] = useState<Position>({ top: 0, left: 0, isReady: false });
  
  useEffect(() => {
    if (!isOpen) {
      setPosition({ top: 0, left: 0, isReady: false });
      return;
    }
    
    let rafId: number | null = null;
    
    const updatePosition = () => {
      // 컨테이너를 찾기 (ref 우선, 없으면 className으로)
      let container: HTMLElement | null = anchorRef.current;
      
      if (!container) {
        container = document.querySelector('.chat-input-container') as HTMLElement;
      }
      
      if (!container) {
        console.warn('EmojiPicker: 컨테이너를 찾을 수 없습니다');
        return;
      }
      
      const rect = container.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const pickerHeight = 400;
      const pickerWidth = 350;
      
      // 컨테이너의 좌상단을 기준으로 하단에 위치
      let top = rect.top + rect.height + 8; // 컨테이너 하단 아래 8px
      let left = rect.left; // 컨테이너 좌상단의 left
      
      // 화면 밖으로 나가면 위쪽에 표시
      if (top + pickerHeight > viewportHeight) {
        top = rect.top - pickerHeight - 8;
      }
      if (top < 0) {
        top = rect.top + rect.height + 8;
      }
      // 오른쪽으로 나가면 조정
      if (left + pickerWidth > viewportWidth) {
        left = viewportWidth - pickerWidth - 16;
      }
      if (left < 0) {
        left = 16;
      }
      
      setPosition({ top, left, isReady: true });
    };
    
    // 즉시 실행 (동기적으로 위치 계산)
    updatePosition();
    rafId = requestAnimationFrame(updatePosition);
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    
    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, anchorRef]);
  
  return position;
}
