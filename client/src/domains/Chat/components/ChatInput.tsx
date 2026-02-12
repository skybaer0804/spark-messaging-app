import { useRef, useState, useEffect } from 'preact/hooks';
import { memo, lazy, Suspense } from 'preact/compat';
import { useTheme } from '@/core/context/ThemeProvider';
import { FilePreview } from './FilePreview';
import { MobileChatInput } from './MessageInput/MobileChatInput';
import { Input } from '@/ui-components/Input/Input';
import { Paper } from '@/ui-components/Paper/Paper';
import { Stack } from '@/ui-components/Layout/Stack';
import { Chip } from '@/ui-components/Chip/Chip';
import { MessageInputToolbar } from './MessageInput/MessageInputToolbar';
import { AddLinkModal } from './MessageInput/AddLinkModal';
import { MentionPicker } from './MessageInput/MentionPicker/MentionPicker';
import { useFormatting } from './MessageInput/hooks/useFormatting';
import './Chat.scss';

// 이모지 피커 lazy loading
const EmojiPicker = lazy(() => import('./MessageInput/EmojiPicker/EmojiPicker').then(module => ({ default: module.EmojiPicker })));

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  members?: any[];
  roomMembers?: any[];
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
  members = [],
  roomMembers = [],
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
  classNamePrefix,
}: ChatInputProps) {
  const { deviceSize } = useTheme();
  const isMobile = deviceSize === 'mobile';
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<{ start: number; end: number } | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPos, setMentionPos] = useState(0);
  const [selectedTextForLink, setSelectedTextForLink] = useState('');

  // 멘션 텍스트를 칩으로 렌더링하는 함수
  const renderRichText = (text: string) => {
    if (!text) return null;

    // @all, @here 및 @username 패턴 찾기
    const parts = text.split(/((?:^|\s)@all\b|(?:^|\s)@here\b|@(?:[가-힣a-zA-Z0-9_]+))/g);
    
    return parts.map((part, i) => {
      const trimmedPart = part.trim();
      if (trimmedPart.startsWith('@')) {
        const username = trimmedPart.substring(1);
        const isSpecial = username === 'all' || username === 'here';
        const member = isSpecial ? true : roomMembers.find(m => m.username === username) || members.find(m => m.username === username);

        if (member) {
          return (
            <Chip
              key={i}
              label={trimmedPart}
              size="md"
              variant={isSpecial ? 'secondary' : 'primary'}
              style={{ 
                margin: '0 1px', 
                display: 'inline-flex',
                height: '24px',
                fontSize: '14px',
                verticalAlign: 'baseline',
                pointerEvents: 'auto',
                position: 'relative',
                zIndex: 10
              }}
            />
          );
        }
      }
      return <span key={i} style={{ whiteSpace: 'pre-wrap' }}>{part}</span>;
    });
  };

  // 활성화된 멘션들을 칩으로 보여주는 상단 바
  const renderMentionChips = () => {
    // 텍스트에서 모든 멘션 추출
    const mentionPattern = /((?:^|\s)@all\b|(?:^|\s)@here\b|@(?:[가-힣a-zA-Z0-9_]+))/g;
    const matches = input.match(mentionPattern) || [];
    const uniqueMentions = [...new Set(matches.map(m => m.trim()))];

    if (uniqueMentions.length === 0) return null;

    return (
      <div 
        className="chat-input__mention-chips"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          padding: '8px 12px',
          borderBottom: '1px solid var(--color-border-subtle)',
          backgroundColor: 'var(--color-bg-subtle)'
        }}
      >
        {uniqueMentions.map((mention, i) => (
          <Chip
            key={i}
            label={mention}
            size="md"
            style={{ height: '24px', fontSize: '14px' }}
          />
        ))}
      </div>
    );
  };

  // 멘션 강제 트리거 핸들러
  const handleMentionTrigger = () => {
    const targetTextarea = textareaRef.current || document.querySelector('.chat-input-container textarea') as HTMLTextAreaElement;
    if (!targetTextarea) return;

    const start = targetTextarea.selectionStart;
    const end = targetTextarea.selectionEnd;
    const before = input.substring(0, start);
    const after = input.substring(end);

    // 이미 @가 있고 멘션 피커가 열려있지 않은 경우에만 @ 추가
    const newText = before + '@' + after;
    setInput(newText);

    // 커서 위치 조정 및 포커스
    setTimeout(() => {
      const newPos = start + 1;
      targetTextarea.setSelectionRange(newPos, newPos);
      targetTextarea.focus();
    }, 0);
  };

  // @ 감지 및 MentionPicker 제어
  useEffect(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = input.substring(0, cursorPos);
    const lastAtIdx = textBeforeCursor.lastIndexOf('@');

    if (lastAtIdx !== -1 && (lastAtIdx === 0 || textBeforeCursor[lastAtIdx - 1] === ' ')) {
      const searchStr = textBeforeCursor.substring(lastAtIdx + 1);
      // 공백이 포함되지 않은 경우에만 멘션 모드 유지
      if (!searchStr.includes(' ')) {
        setMentionSearch(searchStr);
        setMentionOpen(true);
        setMentionPos(lastAtIdx);
        return;
      }
    }

    setMentionOpen(false);
  }, [input]);

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

  const baseClass = classNamePrefix || 'chat-input';

  return (
    <Paper
      elevation={4}
      padding={isMobile ? "xs" : "md"}
      style={{
        flexShrink: 0,
        paddingBottom: isMobile ? 'max(8px, var(--safe-area-inset-bottom))' : 'calc(12px + var(--safe-area-inset-bottom))',
        borderTop: isMobile ? '1px solid var(--color-border-default)' : 'none',
        backgroundColor: 'var(--color-background-primary)',
      }}
      className={`${baseClass}__input-paper`}
    >
      <Stack spacing="sm">
        <FilePreview
          files={selectedFiles}
          uploadingFile={uploadingFile}
          uploadProgress={uploadProgress}
          onRemove={onFileRemove}
        />
        {renderMentionChips()}
        <div
          ref={containerRef}
          className={`chat-input-container ${isMobile ? 'chat-input-container--mobile' : ''}`}
          style={{ position: 'relative', width: '100%' }}
        >
          {isMobile ? (
            <MobileChatInput
              input={input}
              setInput={setInput}
              onSendMessage={onSendMessage}
              onFileClick={() => fileInputRef.current?.click()}
              onEmojiClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
              onMentionClick={handleMentionTrigger}
              onEmojiButtonRef={(el) => { if (el) emojiButtonRef.current = el; }}
              onKeyPress={(e) => {
                // 멘션 피커가 열려있을 때는 엔터 키로 메시지를 보내지 않음
                if (mentionOpen && e.key === 'Enter') {
                  return;
                }
                // 엔터 키는 항상 허용하여 전송 가능하게 함
                if (e.key === 'Enter') {
                  onKeyPress(e as any);
                } else if (!isComposing) {
                  onKeyPress(e as any);
                }
              }}
              isConnected={isConnected}
              placeholder={placeholder}
              canSend={input.trim().length > 0 || selectedFiles.length > 0}
              isComposing={isComposing}
              setIsComposing={setIsComposing}
              setFormattingComposing={setFormattingComposing}
            />
          ) : (
            <>
              <div 
                className="chat-input__rich-wrapper"
                style={{
                  position: 'relative',
                  width: '100%',
                  minHeight: '112px'
                }}
              >
                <div
                  className="chat-input__display"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    padding: '16px',
                    paddingBottom: '48px',
                    fontSize: '16px',
                    fontFamily: 'var(--primitive-font-family)',
                    color: 'var(--color-text-primary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    pointerEvents: 'none',
                    zIndex: 1,
                    overflowY: 'auto',
                    lineHeight: '24px'
                  }}
                >
                  {renderRichText(input)}
                </div>
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
                  onScroll={(e) => {
                    const display = document.querySelector('.chat-input__display');
                    if (display) {
                      display.scrollTop = (e.target as HTMLTextAreaElement).scrollTop;
                    }
                  }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    setInput(target.value);
                    textareaRef.current = target;

                    // 높이 자동 조절
                    target.style.height = 'auto';
                    const scrollHeight = target.scrollHeight;
                    const lineHeight = 24;
                    const verticalPadding = 64;
                    const minHeight = lineHeight * 2 + verticalPadding;
                    const maxHeight = lineHeight * 5 + verticalPadding;
                    const targetHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
                    target.style.height = `${targetHeight}px`;

                    if (isComposing) {
                      const inputElement = e.currentTarget;
                      requestAnimationFrame(() => {
                        if (document.activeElement !== inputElement) {
                          inputElement.focus();
                        }
                      });
                    }
                  }}
                  onKeyDown={(e) => {
                    // 멘션 피커가 열려있을 때는 엔터 키로 메시지를 보내지 않음
                    if (mentionOpen && e.key === 'Enter') {
                      // MentionPicker에서 처리하도록 함
                      return;
                    }

                    // 포맷 단축키 처리
                    if (typeof handleFormatKeyDown === 'function') {
                      handleFormatKeyDown(e as any);
                    }

                    // 엔터 키 전송 처리
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      const hasText = input.trim().length > 0;
                      const hasFiles = selectedFiles.length > 0;

                      if (isConnected && (hasText || hasFiles)) {
                        // 파일이 있으면 파일 전송 핸들러, 없으면 메시지 핸들러 호출
                        // Chat.tsx에서 두 핸들러는 handleSendAll로 통합되어 있음
                        if (hasFiles) {
                          onSendFile();
                        } else {
                          onSendMessage();
                        }
                      }
                    }
                  }}
                  placeholder={placeholder || (isConnected ? '메시지를 입력하세요...' : '연결 중...')}
                  disabled={!isConnected}
                  fullWidth
                  rows={2}
                  style={{
                    paddingBottom: '48px',
                    borderRadius: '8px 8px 0 0',
                    minHeight: '112px',
                    color: input ? 'transparent' : 'inherit',
                    caretColor: 'var(--color-text-primary)',
                    position: 'relative',
                    zIndex: 2,
                    background: 'transparent',
                    fontSize: '16px',
                    lineHeight: '24px',
                    fontFamily: 'var(--primitive-font-family)'
                  }}
                />
              </div>
              <MessageInputToolbar
                onFormat={(type) => {
                  if (type === 'link') {
                    const targetTextarea = textareaRef.current || (document.activeElement as HTMLTextAreaElement);
                    if (targetTextarea && targetTextarea.tagName === 'TEXTAREA') {
                      if (!textareaRef.current) textareaRef.current = targetTextarea;
                      const start = targetTextarea.selectionStart;
                      const end = targetTextarea.selectionEnd;
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
                onEmojiClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                onEmojiButtonRef={(el) => { if (el) emojiButtonRef.current = el; }}
                onFileClick={() => fileInputRef.current?.click()}
                onSendClick={selectedFiles.length > 0 ? onSendFile : onSendMessage}
                disabled={!isConnected}
                showFileUpload={showFileUpload}
                canSend={input.trim().length > 0 || selectedFiles.length > 0}
              />
            </>
          )}

          {/* 파일 입력 (숨김) */}
          {showFileUpload && (
            <input
              ref={fileInputRef}
              type="file"
              onChange={onFileSelect}
              style={{ display: 'none' }}
              multiple
              accept="image/*,video/*,audio/*,.xlsx,.xls,.csv,.md,.docx,.doc,.pdf,.txt,.stl,.obj,.ply,.dxd"
            />
          )}
        </div>
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

      {/* 이모지 피커 (lazy loading) */}
      {emojiPickerOpen && (
        <Suspense fallback={null}>
          <EmojiPicker
            anchorRef={containerRef}
            isOpen={emojiPickerOpen}
            onClose={() => setEmojiPickerOpen(false)}
            onSelect={(emoji) => {
              const targetTextarea = textareaRef.current;
              if (!targetTextarea) return;

              const start = targetTextarea.selectionStart;
              const end = targetTextarea.selectionEnd;
              const before = input.substring(0, start);
              const after = input.substring(end);
              const newText = before + emoji + after;

              setInput(newText);

              // 커서 위치 조정
              setTimeout(() => {
                const newPos = start + emoji.length;
                targetTextarea.setSelectionRange(newPos, newPos);
                targetTextarea.focus();
              }, 0);
            }}
          />
        </Suspense>
      )}

      {/* 멘션 피커 */}
      {mentionOpen && (
        <MentionPicker
          members={members}
          roomMembers={roomMembers}
          search={mentionSearch}
          anchorRef={containerRef}
          onClose={() => setMentionOpen(false)}
          onSelect={(item) => {
            const targetTextarea = textareaRef.current;
            if (!targetTextarea) return;

            const cursorPos = targetTextarea.selectionStart;
            const beforeMention = input.substring(0, mentionPos);
            const afterMention = input.substring(cursorPos);

            const mentionText = typeof item === 'string' ? item : item.username;
            const newText = beforeMention + '@' + mentionText + ' ' + afterMention;

            setInput(newText);
            setMentionOpen(false);

            // 커서 위치 조정
            setTimeout(() => {
              const newPos = beforeMention.length + mentionText.length + 2; // @ + text + space
              targetTextarea.setSelectionRange(newPos, newPos);
              targetTextarea.focus();
            }, 0);
          }}
        />
      )}
    </Paper>
  );
}

// memo로 메모이제이션하여 리렌더링 방지
export const ChatInput = memo(ChatInputComponent);
