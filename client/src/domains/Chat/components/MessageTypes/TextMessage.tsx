import { memo, useState, useRef, useEffect } from 'preact/compat';
import { MarkdownRenderer } from '../MarkdownRenderer/MarkdownRenderer';
import { Message } from '../../types';
import { Dialog } from '@/ui-components/Dialog/Dialog';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconChevronRight } from '@tabler/icons-preact';

interface TextMessageProps {
  message: Message;
  isOwnMessage: boolean;
  senderName?: string;
}

export const TextMessage = memo(({ message, isOwnMessage, senderName }: TextMessageProps) => {
  const [showFull, setShowFull] = useState(false);
  const isTruncated = message.content.length > 200;

  const displaySenderName = senderName || message.senderName || '사용자';

  return (
    <div className="text-message-container">
      <div 
        className={`text-message ${isTruncated ? 'text-message--truncated' : ''}`}
      >
        <MarkdownRenderer
          content={message.content}
          variant="default"
          className={isOwnMessage ? 'markdown-renderer--own-message' : ''}
        />
      </div>
      
      {isTruncated && (
        <div 
          className="text-message__view-all"
          onClick={() => setShowFull(true)}
        >
          <Typography variant="body-small">전체보기</Typography>
          <IconChevronRight size={16} />
        </div>
      )}

      <Dialog
        open={showFull}
        onClose={() => setShowFull(false)}
        title={`${displaySenderName}님의 메시지`}
        maxWidth="md"
        fullWidth
        className="dialog--mobile-overlay"
      >
        <MarkdownRenderer
          content={message.content}
          variant="default"
        />
      </Dialog>
    </div>
  );
});
