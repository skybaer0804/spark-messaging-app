import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconMessageCircle2 } from '@tabler/icons-preact';
import { formatTimestamp } from '@/core/utils/messageUtils';
import type { Message } from '../types';

interface ChatMessageItemThreadProps {
  message: Message;
  onClick?: (message: Message) => void;
}

export const ChatMessageItemThread = ({
  message,
  onClick
}: ChatMessageItemThreadProps) => {
  if (!message.replyCount || message.replyCount === 0) return null;

  return (
    <Flex 
      align="center" 
      gap="xs" 
      onClick={() => onClick?.(message)}
      className="chat-app__message-thread"
    >
      <IconMessageCircle2 size={14} className="chat-app__message-thread-icon" />
      <Typography variant="caption" className="chat-app__message-thread-count">
        {message.replyCount} 답글
      </Typography>
      <Typography variant="caption" className="chat-app__message-thread-time">
        {message.lastReplyAt ? formatTimestamp(message.lastReplyAt) : ''}
      </Typography>
    </Flex>
  );
};
