import { memo } from 'preact/compat';
import { MarkdownRenderer } from '../MarkdownRenderer/MarkdownRenderer';
import { Message } from '../../types';

interface TextMessageProps {
  message: Message;
  isOwnMessage: boolean;
}

export const TextMessage = memo(({ message, isOwnMessage }: TextMessageProps) => {
  return (
    <MarkdownRenderer
      content={message.content}
      variant="default"
      className={isOwnMessage ? 'markdown-renderer--own-message' : ''}
    />
  );
});
