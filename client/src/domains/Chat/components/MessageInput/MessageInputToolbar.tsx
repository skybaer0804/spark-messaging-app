import { memo } from 'preact/compat';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Flex } from '@/ui-components/Layout/Flex';
import {
  IconMoodSmile,
  IconBold,
  IconItalic,
  IconStrikethrough,
  IconCode,
  IconSourceCode ,
  IconLink,
  IconMathFunction,
  IconMicrophone,
  IconVideo,
  IconPaperclip,
  IconSend,
} from '@tabler/icons-preact';
import type { FormatType } from '../../types/markdown.types';
import './MessageInputToolbar.scss';

interface MessageInputToolbarProps {
  onFormat: (type: FormatType) => void;
  onSaveSelection?: () => void;
  onEmojiClick?: () => void;
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
  onVoiceClick,
  onVideoClick,
  onFileClick,
  onSendClick,
  disabled = false,
  showFileUpload = true,
  canSend = false,
}: MessageInputToolbarProps) {
  const formatButtons: Array<{ type: FormatType; icon: any; label: string; shortcut?: string }> = [
    { type: 'bold', icon: IconBold, label: '굵게', shortcut: 'Ctrl+B' },
    { type: 'italic', icon: IconItalic, label: '기울임', shortcut: 'Ctrl+I' },
    { type: 'strikethrough', icon: IconStrikethrough, label: '취소선', shortcut: 'Ctrl+Shift+X' },
    { type: 'inlineCode', icon: IconCode, label: '인라인 코드', shortcut: 'Ctrl+`' },
    { type: 'codeBlock', icon: IconSourceCode, label: '코드 블록', shortcut: 'Ctrl+Shift+`' },
    { type: 'link', icon: IconLink, label: '링크', shortcut: 'Ctrl+L' },
  ];

  return (
    <Flex gap="xs" align="center" className="message-input-toolbar">
      {/* 이모지 버튼 */}
      <IconButton
        onClick={onEmojiClick}
        disabled={disabled}
        color="secondary"
        size="small"
        title="이모지"
        className="message-input-toolbar__button"
      >
        <IconMoodSmile size={18} />
      </IconButton>

      {/* 구분선 */}
      <div className="message-input-toolbar__divider" />

      {/* 포맷팅 버튼들 */}
      {formatButtons.map(({ type, icon: Icon, label, shortcut }) => (
        <IconButton
          key={type}
          onMouseDown={(e) => {
            // 드래그 상태에서 버튼 클릭 시 선택 해제 방지
            e.preventDefault();
            // 선택 영역 저장 (클릭 전에)
            onSaveSelection?.();
          }}
          onClick={(e) => {
            e.preventDefault();
            // 약간의 지연 후 포맷팅 적용 (선택 영역이 저장되도록)
            setTimeout(() => {
              onFormat(type);
            }, 0);
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

      {/* 구분선 */}
      <div className="message-input-toolbar__divider" />

      {/* 함수/공식 버튼 (향후 구현) */}
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

      {/* 구분선 */}
      <div className="message-input-toolbar__divider" />

      {/* 음성 메시지 버튼 (아이콘만) */}
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

      {/* 화상 메시지 버튼 (아이콘만) */}
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

      {/* 구분선 */}
      <div className="message-input-toolbar__divider" />

      {/* 파일 첨부 버튼 */}
      {showFileUpload && (
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
  );
}

export const MessageInputToolbar = memo(MessageInputToolbarComponent);
