import { useState } from 'preact/hooks';
import { Box, Flex, Stack } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import { Paper } from '@/components/ui/paper';
import { List, ListItem, ListItemText, ListItemAvatar } from '@/components/ui/list';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { chatApi } from '@/core/api/ApiService';
import type { Message, ChatRoom } from '../types';
import { IconHash, IconLock, IconX } from '@tabler/icons-preact';

interface ForwardModalProps {
  message: Message;
  roomList: ChatRoom[];
  onClose: () => void;
  onSuccess: () => void;
}

export const ForwardModal = ({ message, roomList, onClose, onSuccess }: ForwardModalProps) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleForward = async () => {
    if (!selectedRoomId) return;

    try {
      setIsSubmitting(true);
      await chatApi.forwardMessage({
        targetRoomId: selectedRoomId,
        originalMessageId: message._id
      });
      onSuccess();
    } catch (error) {
      console.error('Failed to forward message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <Paper
        elevation={3}
        style={{
          width: '400px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <Box padding="md" style={{ borderBottom: '1px solid var(--color-border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">메시지 전달</Typography>
          <IconX size={20} style={{ cursor: 'pointer' }} onClick={onClose} />
        </Box>

        <Box padding="md" style={{ backgroundColor: 'var(--color-background-subtle)', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <Typography variant="caption" color="text-tertiary">전달할 내용:</Typography>
          <Typography variant="body2" style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {message.content}
          </Typography>
        </Box>

        <Box style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          <Typography variant="caption" color="text-tertiary" style={{ padding: '8px' }}>채널 선택</Typography>
          <List>
            {roomList.map(room => (
              <ListItem 
                key={room._id} 
                onClick={() => setSelectedRoomId(room._id)}
                style={{ 
                  cursor: 'pointer',
                  backgroundColor: selectedRoomId === room._id ? 'var(--color-primary-light)' : 'transparent',
                  borderRadius: '8px'
                }}
              >
                <ListItemAvatar>
                  <Avatar size="sm" variant="circular">
                    {room.isPrivate ? <IconLock size={16} /> : <IconHash size={16} />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={room.displayName || room.name} />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box padding="md" style={{ borderTop: '1px solid var(--color-border-default)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onClose} disabled={isSubmitting}>취소</Button>
          <Button variant="contained" color="primary" onClick={handleForward} disabled={!selectedRoomId || isSubmitting}>
            {isSubmitting ? '전달 중...' : '전달하기'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
