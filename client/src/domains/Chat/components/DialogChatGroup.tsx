import { useState, useEffect } from 'preact/hooks';
import { IconX, IconCheck, IconPlus } from '@tabler/icons-preact';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AutocompleteMember } from './AutocompleteMember';
import { useChat } from '../context/ChatContext';
import { useAuth } from '@/core/hooks/useAuth';
import { useTheme } from '@/core/context/ThemeProvider';
import { useToast } from '@/core/context/ToastContext';
import { chatApi } from '@/core/api/ApiService';
import { currentWorkspaceId } from '@/stores/chatRoomsStore';
import type { ChatUser } from '../types';
import { cn } from '@/lib/utils';

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
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '채널 수정' : '채널 생성'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? '채널 정보를 수정합니다.' : '새로운 채널을 만들어 팀원들과 소통하세요.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="channel-name">이름</Label>
            <Input
              id="channel-name"
              placeholder="예: 프로젝트-공지"
              value={groupData.name}
              onInput={(e: any) => setGroupData((prev) => ({ ...prev, name: e.currentTarget.value }))}
              className={cn(groupData.name.length > 0 && !isValidGroupName(groupData.name) && "border-destructive")}
            />
            {groupData.name.length > 0 && !isValidGroupName(groupData.name) && (
              <p className="text-xs text-destructive">공백이나 특수문자는 사용할 수 없습니다.</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="channel-desc">설명</Label>
            <Input
              id="channel-desc"
              placeholder="채널의 목적을 설명해주세요."
              value={groupData.description}
              onInput={(e: any) => setGroupData((prev) => ({ ...prev, description: e.currentTarget.value }))}
              className={cn(groupData.description.length > 0 && !isValidDescription(groupData.description) && "border-destructive")}
            />
          </div>

          <div className="grid gap-2">
            <AutocompleteMember
              userList={userList}
              selectedUsers={groupData.members}
              onUsersChange={(users) => setGroupData((prev) => ({ ...prev, members: users }))}
              currentUserId={user?.id}
              placeholder="멤버 초대"
              label="멤버 추가"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>비공개</Label>
              <p className="text-xs text-muted-foreground">
                초대된 사람만 채널에 참여할 수 있습니다.
              </p>
            </div>
            <Switch
              checked={groupData.isPrivate}
              onCheckedChange={(checked) => setGroupData((prev) => ({ ...prev, isPrivate: checked }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <IconX size={18} className="mr-2" /> 취소
          </Button>
          <Button disabled={!isFormValid} onClick={handleSubmit}>
            {isEditMode ? <IconCheck size={18} className="mr-2" /> : <IconPlus size={18} className="mr-2" />}
            {isEditMode ? '저장' : '개설'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
