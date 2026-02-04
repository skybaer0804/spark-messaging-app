import { useState, useMemo } from 'preact/hooks';
import { Dialog } from '@/ui-components/Dialog/Dialog';
import { Flex } from '@/ui-components/Layout/Flex';
import { Button } from '@/ui-components/Button/Button';
import { Typography } from '@/ui-components/Typography/Typography';
import { Input } from '@/ui-components/Input/Input';
import { Stack } from '@/ui-components/Layout/Stack';
import { useAuth } from '@/core/hooks/useAuth';
import { AutocompleteMember } from './AutocompleteMember';
import type { ChatUser } from '../types';

interface DialogChatOneProps {
  open: boolean;
  onClose: () => void;
  userList: ChatUser[];
  selectedUserIds: string[];
  toggleUserSelection: (userId: string) => void;
  handleCreateRoom: (type: 'direct' | 'discussion', extraData?: { name?: string; members?: string[] }) => void;
}

export const DialogChatOne = ({
  open,
  onClose,
  userList,
  selectedUserIds,
  toggleUserSelection,
  handleCreateRoom,
}: DialogChatOneProps) => {
  const { user } = useAuth();
  const [roomName, setRoomName] = useState('');
  const [showRoomNameInput, setShowRoomNameInput] = useState(false);

  // 선택된 사용자 객체 배열
  const selectedUsers = useMemo(() => {
    return userList.filter((user) => selectedUserIds.includes(user._id));
  }, [userList, selectedUserIds]);

  // 사용자 선택 변경 핸들러
  const handleUsersChange = (users: ChatUser[]) => {
    // 기존 toggleUserSelection과 호환되도록 처리
    const newUserIds = users.map((u) => u._id);
    const added = newUserIds.filter((id) => !selectedUserIds.includes(id));
    const removed = selectedUserIds.filter((id) => !newUserIds.includes(id));

    added.forEach((id) => toggleUserSelection(id));
    removed.forEach((id) => toggleUserSelection(id));

    // 여러 명 선택 시 제목 입력 필드 표시
    if (users.length > 1) {
      setShowRoomNameInput(true);
    } else {
      setShowRoomNameInput(false);
      setRoomName('');
    }
  };

  const handleCreate = () => {
    const isMultiple = selectedUserIds.length > 1;
    const type = isMultiple ? 'discussion' : 'direct';

    handleCreateRoom(type, {
      name: isMultiple && roomName.trim() ? roomName.trim() : undefined,
      members: selectedUserIds,
    });

    // 상태 초기화
    setRoomName('');
    setShowRoomNameInput(false);
    onClose();
  };

  const handleClose = () => {
    setRoomName('');
    setShowRoomNameInput(false);
    onClose();
  };

  const isCreateDisabled = selectedUserIds.length === 0 || (selectedUserIds.length > 1 && !roomName.trim());

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="새 다이렉트 메시지"
      maxWidth={false}
      fullWidth
      style={{ maxWidth: '800px' }}
      actions={
        <Flex gap="sm">
          <Button onClick={handleClose}>취소</Button>
          <Button variant="primary" disabled={isCreateDisabled} onClick={handleCreate}>
            개설
          </Button>
        </Flex>
      }
    >
      <Stack spacing="md">
        <Typography variant="body-small" color="text-secondary">
          여러 사용자와 채팅을 하려고 합니다. 1:1 메시지를 사용하여 같은 대화방에 있는 모든 사람과 대화하고 싶은 사람을
          추가하십시오.
        </Typography>

        <AutocompleteMember
          userList={userList}
          selectedUsers={selectedUsers}
          onUsersChange={handleUsersChange}
          currentUserId={user?.id}
          placeholder="사용자 검색"
          fullWidth
        />

        {showRoomNameInput && (
          <div>
            <Typography variant="body-small" style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              채팅방 제목 *
            </Typography>
            <Input
              fullWidth
              placeholder="채팅방 제목을 입력하세요"
              value={roomName}
              onInput={(e) => setRoomName(e.currentTarget.value)}
            />
          </div>
        )}
      </Stack>
    </Dialog>
  );
};
