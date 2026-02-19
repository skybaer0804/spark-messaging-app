import { useState, useMemo } from 'preact/hooks';
import { IconX, IconPlus } from '@tabler/icons-preact';
import { Dialog } from '@/ui-components/Dialog/Dialog';
import { Flex } from '@/ui-components/Layout/Flex';
import { Button } from '@/ui-components/Button/Button';
import { Typography } from '@/ui-components/Typography/Typography';
import { Input } from '@/ui-components/Input/Input';
import { Grid } from '@/ui-components/Layout/Grid';
import { useAuth } from '@/core/hooks/useAuth';
import { useTheme } from '@/core/context/ThemeProvider';
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
  const { deviceSize } = useTheme();
  const [roomName, setRoomName] = useState('');
  const [showRoomNameInput, setShowRoomNameInput] = useState(false);
  const isMobile = deviceSize === 'mobile';

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

  // 채팅방 이름 유효성 검사 (공백 및 특수문자 제한)
  const isValidRoomName = (name: string) => {
    if (!name.trim()) return false;
    // 영문, 한글, 숫자, 공백, 언더스코어, 하이픈 허용
    return /^[a-zA-Z0-9가-힣\s_-]+$/.test(name.trim());
  };

  const isCreateDisabled =
    selectedUserIds.length === 0 || (selectedUserIds.length > 1 && (!roomName.trim() || !isValidRoomName(roomName)));

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="새 다이렉트 메시지"
      maxWidth={false}
      fullWidth
      style={{ maxWidth: '600px' }}
      className="dialog--mobile-overlay"
      actions={
        <Flex gap="sm" style={isMobile ? { width: '100%' } : {}}>
          <Button onClick={handleClose} variant="secondary" size="sm" style={isMobile ? { flex: 4.5 } : {}}>
            <Flex align="center" gap="xs" justify="center">
              <IconX size={18} />
              <span>취소</span>
            </Flex>
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={isCreateDisabled}
            onClick={handleCreate}
            style={isMobile ? { flex: 5.5 } : {}}
          >
            <Flex align="center" gap="xs" justify="center">
              <IconPlus size={18} />
              <span>개설</span>
            </Flex>
          </Button>
        </Flex>
      }
    >
      <Grid container spacing="md">
        <Grid item xs={12}>
          <Typography variant="body-small" color="text-secondary">
            여러 사용자와 채팅을 하려면 대화방 이름을 지정하고 멤버를 추가하십시오.
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <AutocompleteMember
            userList={userList}
            selectedUsers={selectedUsers}
            onUsersChange={handleUsersChange}
            currentUserId={user?.id}
            placeholder="사용자 검색 및 추가"
            fullWidth
          />
        </Grid>

        {showRoomNameInput && (
          <Grid item xs={12}>
            <Input
              label="채팅방 제목"
              isValid={isValidRoomName(roomName)}
              fullWidth
              placeholder="채팅방 제목을 입력하세요"
              value={roomName}
              onInput={(e) => setRoomName(e.currentTarget.value)}
              error={roomName.length > 0 && !isValidRoomName(roomName)}
              helperText={
                roomName.length > 0 && !isValidRoomName(roomName)
                  ? '특수문자는 사용할 수 없습니다 (한글, 영문, 숫자, 공백, _, -만 허용)'
                  : ''
              }
            />
          </Grid>
        )}
      </Grid>
    </Dialog>
  );
};
