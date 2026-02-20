import { useState } from 'preact/hooks';
import { Dialog } from '@/components/ui/dialog';
import { Box, Flex } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { chatApi } from '@/core/api/ApiService';
import { useToast } from '@/core/context/ToastContext';
import type { Message, ChatRoom, ChatUser } from '../types';
import { AutocompleteAll } from './AutocompleteAll';

interface DialogForwardProps {
  open: boolean;
  message: Message;
  roomList: ChatRoom[];
  userList: ChatUser[];
  onClose: () => void;
  onSuccess: () => void;
}

export const DialogForward = ({ 
  open, 
  message, 
  roomList, 
  userList, 
  onClose, 
  onSuccess 
}: DialogForwardProps) => {
  const { showError } = useToast();
  const [selectedTarget, setSelectedTarget] = useState<(ChatRoom | ChatUser) | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleForward = async () => {
    if (!selectedTarget) return;

    try {
      setIsSubmitting(true);
      
      const isUser = (selectedTarget as any).__type === 'user';
      let targetRoomId: string;
      
      if (isUser) {
        // 사용자가 선택된 경우: 기존 DM 룸 찾기 또는 생성
        const userId = (selectedTarget as ChatUser)._id;
        
        // 기존 DM 룸 찾기
        const existingDMRoom = roomList.find((room) => {
          if (room.type !== 'direct') return false;
          const members = room.members || [];
          return members.length === 2 && members.some((m: any) => {
            const memberId = typeof m === 'object' ? m._id : m;
            return memberId === userId;
          });
        });

        if (existingDMRoom) {
          // 기존 DM 룸이 있으면 해당 룸으로 전달
          targetRoomId = existingDMRoom._id;
        } else {
          // 기존 DM 룸이 없으면 새로 생성
          const createResponse = await chatApi.createRoom({
            type: 'direct',
            members: [userId]
          });
          targetRoomId = createResponse.data._id;
        }
      } else {
        // 룸이 선택된 경우
        targetRoomId = (selectedTarget as ChatRoom)._id;
      }

      // 메시지 전달
      await chatApi.forwardMessage({
        targetRoomId: targetRoomId,
        originalMessageId: message._id
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to forward message:', error);
      const errorMessage = error.response?.data?.message || error.message || '메시지 전달에 실패했습니다';
      showError('메시지 전달에 실패했습니다: ' + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="메시지 전달"
      maxWidth={false}
      fullWidth
      style={{ maxWidth: '500px' }}
      actions={
        <Flex gap="sm">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>취소</Button>
          <Button variant="primary" onClick={handleForward} disabled={!selectedTarget || isSubmitting}>
            {isSubmitting ? '전달 중...' : '전달하기'}
          </Button>
        </Flex>
      }
    >
      <Box style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Box padding="md" style={{ backgroundColor: 'var(--color-background-secondary)', borderRadius: '8px', border: '1px solid var(--color-border-default)' }}>
          <Typography variant="caption" color="text-tertiary">전달할 내용:</Typography>
          <Typography variant="body-medium" style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '4px' }}>
            {message.content}
          </Typography>
        </Box>

        <AutocompleteAll
          roomList={roomList}
          userList={userList}
          selectedTarget={selectedTarget}
          onTargetChange={setSelectedTarget}
          excludeRoomId={message.roomId}
          placeholder="전달할 대상을 검색하세요 (채널, 멤버)"
          fullWidth
        />
      </Box>
    </Dialog>
  );
};
