import { useState } from 'preact/hooks';
import { Dialog } from '@/ui-components/Dialog/Dialog';
import { Flex } from '@/ui-components/Layout/Flex';
import { Button } from '@/ui-components/Button/Button';
import { Typography } from '@/ui-components/Typography/Typography';
import { Input } from '@/ui-components/Input/Input';
import { Stack } from '@/ui-components/Layout/Stack';
import { Box } from '@/ui-components/Layout/Box';
import type { ChatRoom } from '../types';

interface DialogChatTeamProps {
  open: boolean;
  onClose: () => void;
  handleCreateRoom: (type: ChatRoom['type'], extraData?: any) => void;
}

export const DialogChatTeam = ({ open, onClose, handleCreateRoom }: DialogChatTeamProps) => {
  const [newRoomData, setNewRoomData] = useState({ name: '', topic: '' });

  const handleSubmit = () => {
    handleCreateRoom('team', {
      name: newRoomData.name,
      description: newRoomData.topic,
      isPrivate: false,
    });
    setNewRoomData({ name: '', topic: '' });
    onClose();
  };

  const handleClose = () => {
    setNewRoomData({ name: '', topic: '' });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="팀 만들기"
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
            팀 이름 *
          </Typography>
          <Input
            fullWidth
            placeholder="예: 마케팅팀"
            value={newRoomData.name}
            onInput={(e) => setNewRoomData((prev) => ({ ...prev, name: e.currentTarget.value }))}
          />
        </Box>
        <Box>
          <Typography variant="body-small" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            설명
          </Typography>
          <Input
            fullWidth
            placeholder="팀에 대한 설명을 입력하세요"
            value={newRoomData.topic}
            onInput={(e) => setNewRoomData((prev) => ({ ...prev, topic: e.currentTarget.value }))}
          />
        </Box>
      </Stack>
    </Dialog>
  );
};
