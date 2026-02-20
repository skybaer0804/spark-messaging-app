import { useState, useEffect } from 'preact/hooks';
import { IconX, IconCheck, IconPlus } from '@tabler/icons-preact';
import { Dialog } from '@/components/ui/dialog';
import { Flex, Grid } from '@/components/ui/layout';
import { Button } from '@/components/ui/button';
import { TextField as Input } from '@/components/ui/text-field';
import { SettingSwitch } from '@/components/ui/setting-switch';
import { AutocompleteMember } from './AutocompleteMember';
import { useChat } from '../context/ChatContext';
import { useAuth } from '@/core/hooks/useAuth';
import { useTheme } from '@/core/context/ThemeProvider';
import { useToast } from '@/core/context/ToastContext';
import { chatApi } from '@/core/api/ApiService';
import { currentWorkspaceId } from '@/stores/chatRoomsStore';
import type { ChatUser } from '../types';

interface Group {
  _id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  members: ChatUser[];
  createdBy: ChatUser;
}

interface DialogChatGroupProps {
  open: boolean;
  onClose: () => void;
  onGroupCreated?: () => void;
  group?: Group; // 수정 모드일 때 전달
}

export const DialogChatGroup = ({ open, onClose, onGroupCreated, group }: DialogChatGroupProps) => {
  const { userList, refreshRoomList } = useChat();
  const { user } = useAuth();
  const { deviceSize } = useTheme();
  const { showSuccess, showError } = useToast();
  const isEditMode = !!group;
  const isMobile = deviceSize === 'mobile';
  const [groupData, setGroupData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    members: [] as ChatUser[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (group && open) {
      setGroupData({
        name: group.name,
        description: group.description || '',
        isPrivate: group.isPrivate,
        members: group.members || [],
      });
    } else if (!group && open) {
      // 생성 모드일 때 초기화
      setGroupData({
        name: '',
        description: '',
        isPrivate: false,
        members: [],
      });
    }
  }, [group, open]);

  const handleSubmit = async () => {
    if (!groupData.name.trim()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && group) {
        // 수정 모드
        const memberIds = groupData.members.map((m) => m._id);
        await chatApi.updateRoom(group._id, {
          name: groupData.name.trim(),
          description: groupData.description.trim() || undefined,
          isPrivate: groupData.isPrivate,
          type: 'public',
          members: memberIds.length > 0 ? memberIds : undefined,
        });

        await refreshRoomList();
        showSuccess('채널이 수정되었습니다.');
      } else {
        // 생성 모드
        const memberIds = groupData.members.map((m) => m._id);
        await chatApi.createRoom({
          name: groupData.name.trim(),
          description: groupData.description.trim() || undefined,
          isPrivate: groupData.isPrivate,
          type: 'public',
          members: memberIds.length > 0 ? memberIds : undefined,
          workspaceId: currentWorkspaceId.value || undefined,
        });

        await refreshRoomList();
        // showSuccess('채널이 생성되었습니다.');
      }

      // 성공 시 초기화 및 닫기
      setGroupData({
        name: '',
        description: '',
        isPrivate: false,
        members: [],
      });
      onGroupCreated?.();
      onClose();
    } catch (error: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} channel:`, error);
      showError(error.response?.data?.message || `${isEditMode ? '채널 수정' : '채널 생성'}에 실패했습니다.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setGroupData({
      name: '',
      description: '',
      isPrivate: false,
      members: [],
    });
    onClose();
  };

  // 채널 이름 유효성 검사 (공백 및 특수문자 제한)
  const isValidGroupName = (name: string) => {
    if (!name.trim()) return false;
    // 공백이나 특수문자 체크 (영문, 한글, 숫자, 언더스코어, 하이픈만 허용)
    return /^[a-zA-Z0-9가-힣_-]+$/.test(name.trim());
  };

  // 설명 유효성 검사 (Injection 방어: <, >, /, \ 등 제한)
  const isValidDescription = (desc: string) => {
    if (!desc) return true;
    return /^[^<>/\\&]*$/.test(desc);
  };

  const isFormValid = isValidGroupName(groupData.name) && 
    isValidDescription(groupData.description) && 
    !isSubmitting;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={isEditMode ? '채널 수정' : '채널 생성'}
      maxWidth={false}
      style={{ maxWidth: '600px' }}
      fullWidth
      className="dialog--mobile-overlay"
      actions={
        <Flex gap="sm" style={isMobile ? { width: '100%' } : {}}>
          <Button
            onClick={handleClose}
            variant="secondary"
            size="sm"
            style={isMobile ? { flex: 4.5 } : {}}
          >
            <Flex align="center" gap="xs" justify="center">
              <IconX size={18} />
              <span>취소</span>
            </Flex>
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!isFormValid}
            onClick={handleSubmit}
            style={isMobile ? { flex: 5.5 } : {}}
          >
            <Flex align="center" gap="xs" justify="center">
              {isEditMode ? <IconCheck size={18} /> : <IconPlus size={18} />}
              <span>{isEditMode ? '저장' : '개설'}</span>
            </Flex>
          </Button>
        </Flex>
      }
    >
      <Grid container spacing="md">
        <Grid item xs={12}>
          <Input
            label="이름"
            isValid={isValidGroupName(groupData.name)}
            fullWidth
            placeholder="예: 프로젝트-공지"
            value={groupData.name}
            onInput={(e) => setGroupData((prev) => ({ ...prev, name: e.currentTarget.value }))}
            error={groupData.name.length > 0 && !isValidGroupName(groupData.name)}
            helperText={groupData.name.length > 0 && !isValidGroupName(groupData.name)
              ? "공백이나 특수문자는 사용할 수 없습니다 (한글, 영문, 숫자, _, -만 허용)."
              : ""}
          />
        </Grid>

        <Grid item xs={12}>
          <Input
            label="설명"
            isValid={isValidDescription(groupData.description)}
            fullWidth
            placeholder="채널의 목적을 설명해주세요."
            value={groupData.description}
            onInput={(e) => setGroupData((prev) => ({ ...prev, description: e.currentTarget.value }))}
            error={groupData.description.length > 0 && !isValidDescription(groupData.description)}
            helperText={groupData.description.length > 0 && !isValidDescription(groupData.description)
              ? "보안을 위해 일부 특수문자(<, >, /, \, &)는 사용할 수 없습니다."
              : ""}
          />
        </Grid>

        <Grid item xs={12}>
          <AutocompleteMember
            userList={userList}
            selectedUsers={groupData.members}
            onUsersChange={(users) => setGroupData((prev) => ({ ...prev, members: users }))}
            currentUserId={user?.id}
            placeholder="멤버 초대"
            label="멤버 추가"
          />
        </Grid>

        <Grid item xs={12}>
          <SettingSwitch
            title="비공개"
            description="초대된 사람만 채널에 참여할 수 있습니다."
            checked={groupData.isPrivate}
            onChange={(checked) => setGroupData((prev) => ({ ...prev, isPrivate: checked }))}
          />
        </Grid>
      </Grid>
    </Dialog>
  );
};
