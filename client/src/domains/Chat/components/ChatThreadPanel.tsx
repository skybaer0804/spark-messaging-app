import { useState, useEffect } from 'preact/hooks';
import { Box } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import { Paper } from '@/components/ui/paper';
import { IconButton } from '@/components/ui/icon-button';
import { IconChevronLeft, IconX } from '@tabler/icons-preact';
import { ThreadList } from './ThreadList';
import { ThreadDetail } from './ThreadDetail';
import type { Message, ChatRoom, ChatUser } from '../types';
import { useTheme } from '@/core/context/ThemeProvider';

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
  const { deviceSize } = useTheme();
  const isMobile = deviceSize === 'mobile';
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(initialSelectedMessage);

  // v2.4.2: 외부에서 initialSelectedMessage가 변경될 때 내부 상태 동기화
  useEffect(() => {
    setSelectedMessage(initialSelectedMessage);
  }, [initialSelectedMessage]);

  const handleBack = () => {
    if (selectedMessage) {
      setSelectedMessage(null);
    } else {
      onClose();
    }
  };

  return (
    <Paper
      elevation={0}
      square
      padding="none"
      className="chat-app__sidebar-panel"
    >
      <Box className="chat-app__sidebar-panel__header">
        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          {(selectedMessage || isMobile) && (
            <IconButton onClick={handleBack} size="small" style={{ marginLeft: isMobile ? '-8px' : '0' }}>
              <IconChevronLeft size={isMobile ? 24 : 18} />
            </IconButton>
          )}
          <Typography variant="h4" style={{ flex: 1 }}>
            {selectedMessage ? '스레드 상세' : '스레드'}
          </Typography>
        </Box>
        {!isMobile && (
          <IconButton onClick={onClose} size="small">
            <IconX size={18} />
          </IconButton>
        )}
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
