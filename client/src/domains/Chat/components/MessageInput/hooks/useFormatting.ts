import { useCallback, useRef } from 'preact/hooks';
import type { FormatType } from '../../../types/markdown.types';

interface UseFormattingOptions {
  setInput: (value: string) => void;
}

// formatMap을 컴포넌트 외부로 이동 (재생성 방지)
const formatMap: Record<FormatType, { prefix: string; suffix: string; placeholder?: string }> = {
  bold: { prefix: '**', suffix: '**' },
  italic: { prefix: '_', suffix: '_' },
  strikethrough: { prefix: '~~', suffix: '~~' },
  inlineCode: { prefix: '`', suffix: '`' },
  codeBlock: { prefix: '```\n', suffix: '\n```' },
  link: { prefix: '[', suffix: '](url)', placeholder: '링크 텍스트' },
};

/**
 * 텍스트 포맷팅을 위한 훅
 * 텍스트 선택 영역에 마크다운 문법을 삽입
 * 키보드 단축키도 함께 처리
 */
export function useFormatting({ setInput }: UseFormattingOptions) {
  // isComposing을 ref로 관리하여 handleKeyDown 재생성 방지
  const isComposingRef = useRef(false);
  // requestAnimationFrame ID 저장 (cleanup용)
  const rafIdRef = useRef<number | null>(null);
  // 현재 활성화된 textarea 저장 (이벤트 핸들러에서 설정)
  const activeTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  // 버튼 클릭 전 선택 영역 저장 (드래그 상태 유지)
  const savedSelectionRef = useRef<{ textarea: HTMLTextAreaElement; start: number; end: number } | null>(null);

  /**
   * 선택된 텍스트에 포맷팅 적용
   * textarea를 파라미터로 받아서 특정 textarea만 처리
   */
  const applyFormat = useCallback(
    (type: FormatType, textarea?: HTMLTextAreaElement) => {
      // 이전 requestAnimationFrame 취소
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      // 저장된 선택 영역이 있으면 사용 (버튼 클릭으로 인한 선택 해제 방지)
      let targetTextarea: HTMLTextAreaElement | null = null;
      let start = 0;
      let end = 0;

      if (savedSelectionRef.current) {
        // 저장된 선택 영역 사용
        const saved = savedSelectionRef.current;
        targetTextarea = saved.textarea;
        start = saved.start;
        end = saved.end;
        savedSelectionRef.current = null; // 사용 후 초기화
      } else {
        // 파라미터로 전달된 textarea 우선, 없으면 활성화된 textarea 사용
        targetTextarea = textarea || activeTextareaRef.current;
        if (!targetTextarea) return;

        // textarea의 현재 값 사용 (항상 최신 값)
        start = targetTextarea.selectionStart;
        end = targetTextarea.selectionEnd;
      }

      if (!targetTextarea) return;

      // textarea의 현재 값 사용 (항상 최신 값)
      const currentValue = targetTextarea.value;
      const format = formatMap[type];

      if (start !== end) {
        // 텍스트가 선택된 경우: 선택 영역에 포맷팅 적용
        const selectedText = currentValue.substring(start, end);
        const before = currentValue.substring(0, start);
        const after = currentValue.substring(end);

        let formattedText = '';
        let newCursorPos = 0;

        if (type === 'link') {
          formattedText = `[${selectedText}](url)`;
          newCursorPos = start + formattedText.length - 3;
        } else {
          formattedText = format.prefix + selectedText + format.suffix;
          newCursorPos = start + formattedText.length;
        }

        const newText = before + formattedText + after;
        setInput(newText);

        // 커서 위치 조정
        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          const updatedTextarea = targetTextarea;
          if (updatedTextarea && document.activeElement === updatedTextarea) {
            if (updatedTextarea.value !== newText) {
              updatedTextarea.value = newText;
            }
            updatedTextarea.setSelectionRange(newCursorPos, newCursorPos);
            updatedTextarea.focus();
          }
        });
      } else {
        // 텍스트가 선택되지 않은 경우: 포맷팅 문법만 삽입
        const placeholder = format.placeholder || '텍스트';
        let textToInsert = '';
        let cursorOffset = 0;

        if (type === 'link') {
          textToInsert = `[${placeholder}](url)`;
          cursorOffset = -3;
        } else if (type === 'codeBlock') {
          textToInsert = format.prefix + placeholder + format.suffix;
          cursorOffset = -format.suffix.length - placeholder.length;
        } else {
          textToInsert = format.prefix + placeholder + format.suffix;
          cursorOffset = -format.suffix.length - placeholder.length;
        }

        const before = currentValue.substring(0, start);
        const after = currentValue.substring(end);
        const newText = before + textToInsert + after;
        setInput(newText);

        rafIdRef.current = requestAnimationFrame(() => {
          rafIdRef.current = null;
          const updatedTextarea = targetTextarea;
          if (updatedTextarea && document.activeElement === updatedTextarea) {
            if (updatedTextarea.value !== newText) {
              updatedTextarea.value = newText;
            }
            const newCursorPos = start + textToInsert.length + cursorOffset;
            updatedTextarea.setSelectionRange(newCursorPos, newCursorPos);
            updatedTextarea.focus();
          }
        });
      }
    },
    [setInput]
  );


  /**
   * 키보드 단축키 핸들러
   * Input 컴포넌트의 onKeyDown prop으로 전달
   * 이벤트 타겟이 textarea인지 확인하여 특정 Input만 처리
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // 이벤트 타겟이 textarea인지 확인
      const target = e.target as HTMLElement;
      if (target.tagName !== 'TEXTAREA') return;

      // 활성화된 textarea로 저장
      activeTextareaRef.current = target as HTMLTextAreaElement;

      // Ctrl 또는 Cmd 키 확인
      const isModifierPressed = e.ctrlKey || e.metaKey;
      if (!isModifierPressed) return;

      // 컴포지션 중이면 무시
      if (isComposingRef.current) return;

      // 단축키 처리 (textarea를 직접 전달)
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyFormat('bold', target as HTMLTextAreaElement);
          break;
        case 'i':
          e.preventDefault();
          applyFormat('italic', target as HTMLTextAreaElement);
          break;
        case 'l':
          e.preventDefault();
          // 링크는 모달로 처리하므로 여기서는 이벤트만 전달
          // 실제 처리는 ChatInput에서 모달 열기로 처리
          break;
        case '`':
          e.preventDefault();
          if (e.shiftKey) {
            applyFormat('codeBlock', target as HTMLTextAreaElement);
          } else {
            applyFormat('inlineCode', target as HTMLTextAreaElement);
          }
          break;
        case 'x':
          if (e.shiftKey) {
            e.preventDefault();
            applyFormat('strikethrough', target as HTMLTextAreaElement);
          }
          break;
      }
    },
    [applyFormat]
  );

  // isComposing 업데이트 함수 (외부에서 호출)
  const setIsComposing = useCallback((value: boolean) => {
    isComposingRef.current = value;
  }, []);

  /**
   * 선택 영역 저장 (버튼 클릭 전에 호출)
   * 드래그 상태에서 버튼 클릭 시 선택이 해제되지 않도록
   */
  const saveSelection = useCallback(() => {
    const activeElement = document.activeElement;
    if (activeElement && activeElement.tagName === 'TEXTAREA') {
      const textarea = activeElement as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // 텍스트가 선택되어 있을 때만 저장
      if (start !== end) {
        savedSelectionRef.current = {
          textarea,
          start,
          end,
        };
      }
    }
  }, []);

  /**
   * 링크 삽입 함수 (모달에서 호출)
   * 선택된 텍스트가 있으면 그 텍스트를 링크 텍스트로 사용
   */
  const insertLink = useCallback(
    (linkText: string, linkUrl: string, textarea?: HTMLTextAreaElement) => {
      const targetTextarea = textarea || activeTextareaRef.current;
      if (!targetTextarea) return;

      // 이전 requestAnimationFrame 취소
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      const currentValue = targetTextarea.value;
      const start = targetTextarea.selectionStart;
      const end = targetTextarea.selectionEnd;

      const formattedText = `[${linkText}](${linkUrl})`;
      const before = currentValue.substring(0, start);
      const after = currentValue.substring(end);
      const newText = before + formattedText + after;
      const newCursorPos = start + formattedText.length;

      setInput(newText);

      // 커서 위치 조정
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const updatedTextarea = targetTextarea;
        if (updatedTextarea) {
          // value가 다르면 업데이트 (모달이 닫힌 후에도 동작하도록 activeElement 체크 제거)
          if (updatedTextarea.value !== newText) {
            updatedTextarea.value = newText;
          }
          updatedTextarea.setSelectionRange(newCursorPos, newCursorPos);
          updatedTextarea.focus();
        }
      });
    },
    [setInput]
  );

  return {
    applyFormat,
    handleKeyDown,
    setIsComposing,
    saveSelection,
    insertLink,
  };
}
