import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { IconMessageCircle2, IconShare } from '@tabler/icons-preact';
import type { Message } from '../types';

interface ChatMessageItemToolbarProps {
  message: Message;
  onThreadClick?: (message: Message) => void;
  onForwardClick?: (message: Message) => void;
  isOwnMessage: boolean;
}

export const ChatMessageItemToolbar = ({
  message,
  onThreadClick,
  onForwardClick,
  isOwnMessage
}: ChatMessageItemToolbarProps) => {
  return (
    <Flex 
      gap="xs" 
      className="chat-app__message-toolbar"
      style={{ 
        position: 'absolute', 
        top: '50%', 
        transform: 'translateY(-50%)',
        [isOwnMessage ? 'right' : 'left']: '100%',
        [isOwnMessage ? 'marginRight' : 'marginLeft']: '8px',
        zIndex: 10,
        whiteSpace: 'nowrap'
      }}
    >
      <Box 
        className="chat-message__toolbar-icon" 
        onClick={() => onThreadClick?.(message)}
        title="스레드에서 답장"
      >
        <IconMessageCircle2 size={18} />
      </Box>
      <Box 
        className="chat-message__toolbar-icon" 
        onClick={() => onForwardClick?.(message)}
        title="메시지 전달"
      >
        <IconShare size={18} />
      </Box>
    </Flex>
  );
};
