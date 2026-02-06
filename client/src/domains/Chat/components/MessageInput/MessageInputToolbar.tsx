import { useState, useCallback } from 'preact/hooks';
import { memo } from 'preact/compat';
import { useTheme } from '@/core/context/ThemeProvider';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Flex } from '@/ui-components/Layout/Flex';
import {
  IconMoodSmile,
  IconBold,
  IconItalic,
  IconStrikethrough,
  IconCode,
  IconSourceCode,
  IconLink,
  IconMathFunction,
  IconMicrophone,
  IconVideo,
  IconPaperclip,
  IconSend,
  IconDots,
} from '@tabler/icons-preact';
import type { FormatType } from '../../types/markdown.types';
import './MessageInputToolbar.scss';

interface MessageInputToolbarProps {
  onFormat: (type: FormatType) => void;
  onSaveSelection?: () => void;
  onEmojiClick?: () => void;
  onEmojiButtonRef?: (ref: HTMLButtonElement | null) => void;
  onVoiceClick?: () => void;
  onVideoClick?: () => void;
  onFileClick?: () => void;
  onSendClick?: () => void;
  disabled?: boolean;
  showFileUpload?: boolean;
  canSend?: boolean;
}

/**
 * 메시지 입력 툴바 컴포넌트
 * 포맷팅 버튼들을 제공
 */
function MessageInputToolbarComponent({
  onFormat,
  onSaveSelection,
  onEmojiClick,
  onEmojiButtonRef,
  onVoiceClick,
  onVideoClick,
  onFileClick,
  onSendClick,
  disabled = false,
  showFileUpload = true,
  canSend = false,
}: MessageInputToolbarProps) {
  const { deviceSize } = useTheme();
  const isMobile = deviceSize === 'mobile';
  const [showMore, setShowMore] = useState(false);

  const formatButtons: Array<{ type: FormatType; icon: any; label: string; shortcut?: string }> = [
    { type: 'bold', icon: IconBold, label: '굵게', shortcut: 'Ctrl+B' },
    { type: 'italic', icon: IconItalic, label: '기울임', shortcut: 'Ctrl+I' },
    { type: 'strikethrough', icon: IconStrikethrough, label: '취소선', shortcut: 'Ctrl+Shift+X' },
    { type: 'inlineCode', icon: IconCode, label: '인라인 코드', shortcut: 'Ctrl+`' },
    { type: 'codeBlock', icon: IconSourceCode, label: '코드 블록', shortcut: 'Ctrl+Shift+`' },
    { type: 'link', icon: IconLink, label: '링크', shortcut: 'Ctrl+L' },
  ];

  const handleFormat = useCallback(
    (type: FormatType) => {
      onSaveSelection?.();
      setTimeout(() => {
        onFormat(type);
      }, 0);
    },
    [onFormat, onSaveSelection],
  );

  const renderFormattingButtons = () => (
    <>
      {formatButtons.map(({ type, icon: Icon, label, shortcut }) => (
        <IconButton
          key={type}
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            e.preventDefault();
            handleFormat(type);
          }}
          disabled={disabled}
          color="secondary"
          size="small"
          title={shortcut ? `${label} (${shortcut})` : label}
          className="message-input-toolbar__button"
        >
          <Icon size={18} />
        </IconButton>
      ))}

      <div className="message-input-toolbar__divider" />

      <IconButton
        onClick={() => {}}
        disabled={true}
        color="secondary"
        size="small"
        title="함수/공식 (준비 중)"
        className="message-input-toolbar__button"
      >
        <IconMathFunction size={18} />
      </IconButton>

      <div className="message-input-toolbar__divider" />

      <IconButton
        onClick={onVoiceClick}
        disabled={disabled}
        color="secondary"
        size="small"
        title="음성 메시지 (준비 중)"
        className="message-input-toolbar__button"
      >
        <IconMicrophone size={18} />
      </IconButton>

      <IconButton
        onClick={onVideoClick}
        disabled={disabled}
        color="secondary"
        size="small"
        title="화상 메시지 (준비 중)"
        className="message-input-toolbar__button"
      >
        <IconVideo size={18} />
      </IconButton>
    </>
  );

  return (
    <div className="message-input-toolbar-container">
      {isMobile && showMore && (
        <div className="message-input-toolbar__more-panel">
          <Flex gap="xs" align="center" wrap="wrap">
            {renderFormattingButtons()}
          </Flex>
        </div>
      )}

      <Flex gap="xs" align="center" className="message-input-toolbar">
        {/* 왼쪽 아이콘 그룹 (이모지, 파일첨부, 더보기) */}
        <IconButton
          ref={(el: HTMLButtonElement | null) => onEmojiButtonRef?.(el)}
          onClick={onEmojiClick}
          disabled={disabled}
          color="secondary"
          size="small"
          title="이모지"
          className="message-input-toolbar__button"
        >
          <IconMoodSmile size={18} />
        </IconButton>

        {isMobile && showFileUpload && (
          <IconButton
            onClick={onFileClick}
            disabled={disabled}
            color="secondary"
            size="small"
            title="파일 첨부"
            className="message-input-toolbar__button"
          >
            <IconPaperclip size={18} />
          </IconButton>
        )}

        {isMobile && (
          <IconButton
            onClick={() => setShowMore(!showMore)}
            disabled={disabled}
            color={showMore ? 'primary' : 'secondary'}
            size="small"
            title="더보기"
            className="message-input-toolbar__button"
          >
            <IconDots size={18} />
          </IconButton>
        )}

        {!isMobile && <div className="message-input-toolbar__divider" />}

        {/* 데스크톱에서는 모든 버튼 노출 */}
        {!isMobile && renderFormattingButtons()}

        <div className="message-input-toolbar__divider" style={{ marginLeft: 'auto' }} />

        {/* 데스크톱 파일 첨부 버튼 */}
        {!isMobile && showFileUpload && (
          <IconButton
            onClick={onFileClick}
            disabled={disabled}
            color="secondary"
            size="small"
            title="파일 첨부"
            className="message-input-toolbar__button"
          >
            <IconPaperclip size={18} />
          </IconButton>
        )}

        {/* 전송 버튼 */}
        <IconButton
          onClick={onSendClick}
          disabled={disabled || !canSend}
          color="primary"
          size="small"
          title="전송"
          className="message-input-toolbar__button message-input-toolbar__button--send"
        >
          <IconSend size={18} />
        </IconButton>
      </Flex>
    </div>
  );
}

export const MessageInputToolbar = memo(MessageInputToolbarComponent);
