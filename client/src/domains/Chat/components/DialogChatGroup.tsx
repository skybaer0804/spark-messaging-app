import { useState } from 'preact/hooks';
import { Dialog } from '@/ui-components/Dialog/Dialog';
import { Flex } from '@/ui-components/Layout/Flex';
import { Button } from '@/ui-components/Button/Button';
import { Typography } from '@/ui-components/Typography/Typography';
import { Input } from '@/ui-components/Input/Input';
import { Stack } from '@/ui-components/Layout/Stack';
import { Box } from '@/ui-components/Layout/Box';
import { Switch } from '@/ui-components/Switch/Switch';
import type { ChatRoom } from '../types';

interface DialogChatGroupProps {
  open: boolean;
  onClose: () => void;
  handleCreateRoom: (type: ChatRoom['type'], extraData?: any) => void;
}

export const DialogChatGroup = ({ open, onClose, handleCreateRoom }: DialogChatGroupProps) => {
  const [newRoomData, setNewRoomData] = useState({ name: '', topic: '', isPrivate: false });

  const handleSubmit = () => {
    handleCreateRoom(newRoomData.isPrivate ? 'private' : 'public', {
      name: newRoomData.name,
      description: newRoomData.topic,
      isPrivate: newRoomData.isPrivate,
    });
    setNewRoomData({ name: '', topic: '', isPrivate: false });
    onClose();
  };

  const handleClose = () => {
    setNewRoomData({ name: '', topic: '', isPrivate: false });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="채널 만들기"
      maxWidth="sm"
      fullWidth
      actions={
        <Flex gap="sm">
          <Button onClick={handleClose}>취소</Button>
          <Button variant="primary" disabled={!newRoomData.name} onClick={handleSubmit}>
            개설
          </Button>
        </Flex>
      }
    >
      <Stack spacing="md">
        <Box>
          <Typography variant="body-small" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            이름 *
          </Typography>
          <Input
            fullWidth
            placeholder="예: 프로젝트-공지"
            value={newRoomData.name}
            onInput={(e) => setNewRoomData((prev) => ({ ...prev, name: e.currentTarget.value }))}
          />
        </Box>
        <Box>
          <Typography variant="body-small" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            주제
          </Typography>
          <Input
            fullWidth
            placeholder="채널의 목적을 입력하세요"
            value={newRoomData.topic}
            onInput={(e) => setNewRoomData((prev) => ({ ...prev, topic: e.currentTarget.value }))}
          />
        </Box>
        <Flex justify="space-between" align="center">
          <Box>
            <Typography variant="body-medium" style={{ fontWeight: 'bold' }}>
              비공개
            </Typography>
            <Typography variant="caption" color="text-secondary">
              초대된 사람만 참여할 수 있습니다.
            </Typography>
          </Box>
          <Switch
            checked={newRoomData.isPrivate}
            onChange={(e: any) => setNewRoomData((prev) => ({ ...prev, isPrivate: e.target.checked }))}
          />
        </Flex>
      </Stack>
    </Dialog>
  );
};
