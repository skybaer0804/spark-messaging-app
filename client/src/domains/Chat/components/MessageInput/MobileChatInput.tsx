import { useRef } from 'preact/hooks';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Input } from '@/ui-components/Input/Input';
import { IconPlus, IconMoodSmile, IconAt, IconSend } from '@tabler/icons-preact';
import './MobileChatInput.scss';

interface MobileChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSendMessage: () => void;
  onSendFile: () => void;
  onFileClick: () => void;
  onEmojiClick: () => void;
  onMentionClick: () => void;
  onEmojiButtonRef: (ref: HTMLButtonElement | null) => void;
  onKeyPress: (e: KeyboardEvent) => void;
  isConnected: boolean;
  placeholder?: string;
  canSend: boolean;
  isComposing: boolean;
  setIsComposing: (val: boolean) => void;
  setFormattingComposing: (val: boolean) => void;
}

export function MobileChatInput({
  input,
  setInput,
  onSendMessage,
  onSendFile,
  onFileClick,
  onEmojiClick,
  onMentionClick,
  onEmojiButtonRef,
  onKeyPress,
  isConnected,
  placeholder,
  canSend,
  isComposing,
  setIsComposing,
  setFormattingComposing,
}: MobileChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: any) => {
    const target = e.target as HTMLTextAreaElement;
    setInput(target.value);

    // 높이 자동 조절
    target.style.height = '36px'; // 기본 높이로 초기화 후 측정
    const scrollHeight = target.scrollHeight;

    // scrollHeight가 min-height(36px)보다 작으면 36px 유지, 크면 scrollHeight 적용 (최대 120px)
    const targetHeight = Math.min(Math.max(scrollHeight, 36), 120);
    target.style.height = `${targetHeight}px`;

    if (isComposing) {
      requestAnimationFrame(() => {
        if (document.activeElement !== target) {
          target.focus();
        }
      });
    }
  };

  return (
    <div className="mobile-chat-input">
      <div className="mobile-chat-input__left">
        <IconButton
          onClick={onFileClick}
          disabled={!isConnected}
          className="mobile-chat-input__icon-btn"
        >
          <IconPlus size={24} />
        </IconButton>
      </div>

      <div className="mobile-chat-input__center">
        <Input
          multiline
          value={input}
          onInput={handleInput}
          onCompositionStart={() => {
            setIsComposing(true);
            setFormattingComposing(true);
          }}
          onCompositionEnd={() => {
            setIsComposing(false);
            setFormattingComposing(false);
          }}
          onKeyPress={onKeyPress}
          placeholder={placeholder || (isConnected ? '메시지 입력' : '연결 중...')}
          disabled={!isConnected}
          fullWidth
          rows={1}
          className="mobile-chat-input__textarea-wrapper"
        />
        <IconButton
          ref={onEmojiButtonRef}
          onClick={onEmojiClick}
          disabled={!isConnected}
          className="mobile-chat-input__emoji-btn"
        >
          <IconMoodSmile size={24} />
        </IconButton>
      </div>

      <div className="mobile-chat-input__right">
        {input.trim().length === 0 ? (
          <IconButton
            onClick={onMentionClick}
            disabled={!isConnected}
            className="mobile-chat-input__icon-btn"
          >
            <IconAt size={24} />
          </IconButton>
        ) : (
          <IconButton
            onClick={canSend ? onSendMessage : undefined}
            disabled={!isConnected || !canSend}
            className="mobile-chat-input__icon-btn mobile-chat-input__icon-btn--send"
          >
            <IconSend size={24} />
          </IconButton>
        )}
      </div>
    </div>
  );
}
