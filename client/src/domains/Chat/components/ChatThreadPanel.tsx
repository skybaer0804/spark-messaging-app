import { useState, useEffect } from 'preact/hooks';
import { Box } from '@/ui-components/Layout/Box';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconArrowLeft, IconX } from '@tabler/icons-preact';
import { ThreadList } from './ThreadList';
import { ThreadDetail } from './ThreadDetail';
import type { Message, ChatRoom, ChatUser } from '../types';

interface ChatThreadPanelProps {
  roomId: string;
  currentRoom: ChatRoom;
  currentUser: ChatUser | null;
  onClose: () => void;
  initialSelectedMessage?: Message | null;
}

export const ChatThreadPanel = ({ 
  roomId, 
  currentUser, 
  onClose,
  initialSelectedMessage = null
}: ChatThreadPanelProps) => {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(initialSelectedMessage);

  // v2.4.2: 외부에서 initialSelectedMessage가 변경될 때 내부 상태 동기화
  useEffect(() => {
    setSelectedMessage(initialSelectedMessage);
  }, [initialSelectedMessage]);

  return (
    <Paper
      elevation={0}
      square
      padding="none"
      className="chat-app__sidebar-panel"
    >
      <Box className="chat-app__sidebar-panel__header">
        <Box style={{ display: 'flex', align: 'center', gap: '8px' }}>
          {selectedMessage && (
            <IconButton onClick={() => setSelectedMessage(null)} size="small">
              <IconArrowLeft size={18} />
            </IconButton>
          )}
          <Typography variant="h4">
            {selectedMessage ? '스레드 상세' : '스레드'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <IconX size={18} />
        </IconButton>
      </Box>

      <Box className="chat-app__sidebar-panel__content">
        {selectedMessage ? (
          <ThreadDetail 
            parentMessage={selectedMessage} 
            currentUser={currentUser} 
          />
        ) : (
          <ThreadList 
            roomId={roomId} 
            onThreadSelect={setSelectedMessage} 
          />
        )}
      </Box>
    </Paper>
  );
};
