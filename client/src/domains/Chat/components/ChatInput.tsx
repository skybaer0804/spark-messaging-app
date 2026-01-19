import { useRef, useState, useEffect } from 'preact/hooks';
import { memo } from 'preact/compat';
import { FilePreview } from './FilePreview';
import { Input } from '@/ui-components/Input/Input';
import { Paper } from '@/ui-components/Paper/Paper';
import { Stack } from '@/ui-components/Layout/Stack';
import { Box } from '@/ui-components/Layout/Box';
import { MessageInputToolbar } from './MessageInput/MessageInputToolbar';
import { AddLinkModal } from './MessageInput/AddLinkModal';
import { useFormatting } from './MessageInput/hooks/useFormatting';
import './Chat.scss';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  selectedFiles: File[];
  uploadingFile?: File | null;
  uploadProgress?: number;
  isConnected: boolean;
  placeholder?: string;
  showFileUpload?: boolean;
  onSendMessage: () => void;
  onSendFile: () => void;
  onFileSelect: (e: Event) => void;
  onFileRemove: (index: number) => void;
  onKeyPress: (e: KeyboardEvent) => void;
  classNamePrefix?: string;
}

function ChatInputComponent({
  input,
  setInput,
  selectedFiles,
  uploadingFile,
  uploadProgress = 0,
  isConnected,
  placeholder,
  showFileUpload = true,
  onSendMessage,
  onSendFile,
  onFileSelect,
  onFileRemove,
  onKeyPress,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savedSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedTextForLink, setSelectedTextForLink] = useState('');

  // 포맷팅 훅 (단축키 핸들러 포함)
  const { applyFormat, handleKeyDown: handleFormatKeyDown, setIsComposing: setFormattingComposing, saveSelection, insertLink } = useFormatting({
    setInput,
  });

  // textarea ref 업데이트 (Input 컴포넌트 내부의 textarea를 찾아서 저장)
  useEffect(() => {
    const updateTextareaRef = () => {
      const textarea = document.querySelector('.chat-input-container textarea') as HTMLTextAreaElement;
      if (textarea) {
        textareaRef.current = textarea;
      }
    };
    
    updateTextareaRef();
    // input이 변경될 때마다 ref 업데이트
    const interval = setInterval(updateTextareaRef, 100);
    return () => clearInterval(interval);
  }, [input]);

  return (
    <Paper square elevation={4} padding="md" style={{ flexShrink: 0 }}>
      <Stack spacing="sm">
        <FilePreview
          files={selectedFiles}
          uploadingFile={uploadingFile}
          uploadProgress={uploadProgress}
          onRemove={onFileRemove}
        />
        <Box className="chat-input-container" style={{ position: 'relative', width: '100%' }}>
          <Input
            multiline
            value={input}
            onCompositionStart={() => {
              setIsComposing(true);
              setFormattingComposing(true);
            }}
            onCompositionEnd={() => {
              setIsComposing(false);
              setFormattingComposing(false);
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              setInput(target.value);
              
              // textarea ref 업데이트
              textareaRef.current = target;
              
              // 높이 자동 조절
              target.style.height = 'auto';
              const scrollHeight = target.scrollHeight;
              const lineHeight = parseFloat(getComputedStyle(target).lineHeight) || 24;
              const minHeight = lineHeight * 2 + 24;
              const maxHeight = lineHeight * 5 + 24;
              const targetHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
              target.style.height = `${targetHeight}px`;
              // 한글 입력 시 포커스 유지 로직 최적화
              if (isComposing) {
                const inputElement = e.currentTarget;
                requestAnimationFrame(() => {
                  if (document.activeElement !== inputElement) {
                    inputElement.focus();
                  }
                });
              }
            }}
            onKeyPress={(e) => {
              if (!isComposing) {
                onKeyPress(e);
              }
            }}
            onKeyDown={(e) => {
              // 포맷팅 단축키 처리
              handleFormatKeyDown(e);
              
              // Ctrl+L (링크 모달 열기)
              const isModifierPressed = e.ctrlKey || e.metaKey;
              if (isModifierPressed && e.key.toLowerCase() === 'l' && !isComposing) {
                e.preventDefault();
                // 현재 선택된 텍스트 가져오기
                const target = e.target as HTMLTextAreaElement;
                // textarea ref 업데이트
                textareaRef.current = target;
                const start = target.selectionStart;
                const end = target.selectionEnd;
                // 선택 영역 저장 (모달이 닫힌 후 사용)
                savedSelectionRef.current = { start, end };
                const selectedText = start !== end ? target.value.substring(start, end) : '';
                setSelectedTextForLink(selectedText);
                setLinkModalOpen(true);
              }
              // 기존 onKeyPress는 onKeyPress 이벤트에서만 처리
            }}
            placeholder={placeholder || (isConnected ? '메시지를 입력하세요...' : '연결 중...')}
            disabled={!isConnected}
            fullWidth
            rows={2}
            style={{ paddingBottom: '48px', borderRadius: '8px 8px 0 0' }} // 툴바 공간 확보 및 상단 모서리만 둥글게
          />
          {/* 파일 입력 (숨김) */}
          {showFileUpload && (
            <input
              ref={fileInputRef}
              type="file"
              onChange={onFileSelect}
              style={{ display: 'none' }}
              multiple
              accept="image/*,.xlsx,.xls,.csv,.md,.docx,.doc,.pdf"
            />
          )}

          {/* 포맷팅 툴바 */}
          <MessageInputToolbar
            onFormat={(type) => {
              if (type === 'link') {
                // 링크 버튼 클릭 시 모달 열기
                // textarea ref가 있으면 사용, 없으면 activeElement 사용
                const targetTextarea = textareaRef.current || (document.activeElement as HTMLTextAreaElement);
                if (targetTextarea && targetTextarea.tagName === 'TEXTAREA') {
                  // textarea ref 업데이트
                  if (!textareaRef.current) {
                    textareaRef.current = targetTextarea;
                  }
                  const start = targetTextarea.selectionStart;
                  const end = targetTextarea.selectionEnd;
                  // 선택 영역 저장 (모달이 닫힌 후 사용)
                  savedSelectionRef.current = { start, end };
                  const selectedText = start !== end ? targetTextarea.value.substring(start, end) : '';
                  setSelectedTextForLink(selectedText);
                  setLinkModalOpen(true);
                }
              } else {
                applyFormat(type);
              }
            }}
            onSaveSelection={saveSelection}
            onEmojiClick={() => {
              // TODO: 이모지 피커 구현
            }}
            onVoiceClick={() => {
              // TODO: 음성 메시지 구현
            }}
            onVideoClick={() => {
              // TODO: 화상 메시지 구현
            }}
            onFileClick={() => fileInputRef.current?.click()}
            onSendClick={selectedFiles.length > 0 ? onSendFile : onSendMessage}
            disabled={!isConnected}
            showFileUpload={showFileUpload}
            canSend={input.trim().length > 0 || selectedFiles.length > 0}
          />
        </Box>
      </Stack>
      
      {/* 링크 추가 모달 */}
      <AddLinkModal
        open={linkModalOpen}
        onClose={() => {
          setLinkModalOpen(false);
          // 모달이 닫힌 후 textarea에 포커스 복원
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          }, 100);
        }}
        onAdd={(text, url) => {
          // 모달이 닫힌 후 textarea에 링크 삽입
          const targetTextarea = textareaRef.current || document.querySelector('textarea') as HTMLTextAreaElement;
          if (targetTextarea && savedSelectionRef.current) {
            // 저장된 선택 영역 위치에 커서 설정
            const { start, end } = savedSelectionRef.current;
            targetTextarea.setSelectionRange(start, end);
            // 모달이 닫힌 후 실행되도록 약간의 지연
            setTimeout(() => {
              insertLink(text, url, targetTextarea);
              // textarea에 포커스 복원
              targetTextarea.focus();
            }, 100);
            // 사용 후 초기화
            savedSelectionRef.current = null;
          }
        }}
        initialText={selectedTextForLink}
      />
    </Paper>
  );
}

// memo로 메모이제이션하여 props가 변경되지 않으면 리렌더링 방지
export const ChatInput = memo(ChatInputComponent, (prevProps, nextProps) => {
  return (
    prevProps.input === nextProps.input &&
    prevProps.isConnected === nextProps.isConnected &&
    prevProps.uploadProgress === nextProps.uploadProgress &&
    prevProps.selectedFiles.length === nextProps.selectedFiles.length &&
    prevProps.classNamePrefix === nextProps.classNamePrefix &&
    prevProps.showFileUpload === nextProps.showFileUpload &&
    prevProps.placeholder === nextProps.placeholder
  );
});
