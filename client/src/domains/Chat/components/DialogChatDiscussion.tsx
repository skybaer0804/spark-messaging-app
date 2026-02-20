import { useState, useEffect } from 'preact/hooks';
import { IconX, IconPlus, IconEdit } from '@tabler/icons-preact';
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
import { AutocompleteChannelAndTeam } from './AutocompleteChannelAndTeam';
import { useChat } from '../context/ChatContext';
import { useAuth } from '@/core/hooks/useAuth';
import { useTheme } from '@/core/context/ThemeProvider';
import { useToast } from '@/core/context/ToastContext';
import { currentWorkspaceId } from '@/stores/chatRoomsStore';
import type { ChatUser, ChatRoom } from '../types';
import { cn } from '@/lib/utils';

interface DialogChatDiscussionProps {
  open: boolean;
  onClose: () => void;
  onDiscussionCreated?: () => void;
  handleCreateRoom: (type: string, extraData: any) => Promise<void>;
  discussion?: ChatRoom;
}

export const DialogChatDiscussion = ({
  open,
  onClose,
  onDiscussionCreated,
  handleCreateRoom,
  discussion,
}: DialogChatDiscussionProps) => {
  const { roomList, userList } = useChat();
  const { user } = useAuth();
  const { deviceSize } = useTheme();
  const { showError } = useToast();
  const isMobile = deviceSize === 'mobile';
  const isEdit = !!discussion;

  const [discussionData, setDiscussionData] = useState({
    parentRoom: null as ChatRoom | null,
    name: '',
    description: '',
    members: [] as ChatUser[],
    isPrivate: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (open) {
      if (discussion) {
        // 수정 모드인 경우 상위 방 찾기
        const parentRoom = roomList.find((r) => r._id === discussion.parentId) || null;

        // 멤버 데이터 처리
        let currentMembers: ChatUser[] = [];
        if (discussion.members) {
          currentMembers = discussion.members
            .map((m) => (typeof m === 'string' ? userList.find((u) => u._id === m) : m))
            .filter(Boolean) as ChatUser[];
        }

        setDiscussionData({
          parentRoom,
          name: discussion.name || '',
          description: discussion.description || '',
          members: currentMembers,
          isPrivate: discussion.isPrivate || discussion.type === 'private' || false,
        });
      } else {
        setDiscussionData({
          parentRoom: null,
          name: '',
          description: '',
          members: [],
          isPrivate: false,
        });
      }
    }
  }, [open, discussion, roomList, userList]);

  const handleSubmit = async () => {
    if (!discussionData.parentRoom || !discussionData.name.trim()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 상위 채널/그룹의 멤버와 추가 선택된 멤버를 합침
      const parentMemberIds = (discussionData.parentRoom.members || []).map((m: any) =>
        typeof m === 'string' ? m : m._id,
      );
      const additionalMemberIds = discussionData.members.map((m) => m._id);

      // 중복 제거 후 최종 멤버 리스트 생성
      const allMemberIds = Array.from(new Set([...parentMemberIds, ...additionalMemberIds]));

      await handleCreateRoom('discussion', {
        name: discussionData.name.trim(),
        description: discussionData.description.trim() || undefined,
        parentId: discussionData.parentRoom._id,
        members: allMemberIds,
        isPrivate: discussionData.isPrivate,
        workspaceId: currentWorkspaceId.value || undefined,
      });

      onDiscussionCreated?.();
      handleClose();
    } catch (error: any) {
      console.error(`Failed to ${isEdit ? 'update' : 'create'} discussion:`, error);
      showError(error.message || `토론 ${isEdit ? '수정' : '생성'}에 실패했습니다.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDiscussionData({
      parentRoom: null,
      name: '',
      description: '',
      members: [],
      isPrivate: false,
    });
    onClose();
  };

  // 토론 이름 유효성 검사 (공백 및 특수문자 제한)
  const isValidDiscussionName = (name: string) => {
    if (!name.trim()) return false;
    // 공백이나 특수문자 체크 (영문, 한글, 숫자, 언더스코어, 하이픈만 허용)
    return /^[a-zA-Z0-9가-힣_-]+$/.test(name.trim());
  };

  // 설명 유효성 검사 (Injection 방어: <, >, /, \ 등 제한)
  const isValidDescription = (desc: string) => {
    if (!desc) return true;
    return /^[^<>/\\&]*$/.test(desc);
  };

  const isFormValid =
    discussionData.parentRoom &&
    isValidDiscussionName(discussionData.name) &&
    isValidDescription(discussionData.description) &&
    !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '토론 수정' : '새 토론 만들기'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? '토론 정보를 수정합니다. 상위 채널이나 참여자를 변경할 수 있습니다.'
              : '토론을 생성하면 선택한 채널의 하위 채널이 만들어지고 둘 다 연결됩니다.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <AutocompleteChannelAndTeam
              roomList={roomList}
              selectedRoom={discussionData.parentRoom}
              onRoomChange={(room) => setDiscussionData((prev) => ({ ...prev, parentRoom: room }))}
              error={open && !discussionData.parentRoom}
              helperText={!discussionData.parentRoom ? '상위 채널 또는 그룹을 선택해주세요.' : ''}
              disabled={isEdit}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              placeholder="예: 프로젝트-마일스톤-논의"
              value={discussionData.name}
              onInput={(e: any) => setDiscussionData((prev) => ({ ...prev, name: e.currentTarget.value }))}
              className={cn(discussionData.name.length > 0 && !isValidDiscussionName(discussionData.name) && "border-destructive")}
            />
            {discussionData.name.length > 0 && !isValidDiscussionName(discussionData.name) && (
              <p className="text-xs text-destructive">공백이나 특수문자는 사용할 수 없습니다.</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">설명</Label>
            <Input
              id="description"
              placeholder="이름 옆에 표시될 간단한 설명"
              value={discussionData.description}
              onInput={(e: any) => setDiscussionData((prev) => ({ ...prev, description: e.currentTarget.value }))}
              className={cn(discussionData.description.length > 0 && !isValidDescription(discussionData.description) && "border-destructive")}
            />
          </div>

          <div className="grid gap-2">
            <AutocompleteMember
              userList={userList}
              selectedUsers={discussionData.members}
              onUsersChange={(users) => setDiscussionData((prev) => ({ ...prev, members: users }))}
              currentUserId={user?.id}
              placeholder="참여자 추가"
              label="참여자"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label>비공개</Label>
              <p className="text-xs text-muted-foreground">
                초대된 사람만 가입할 수 있습니다.
              </p>
            </div>
            <Switch
              checked={discussionData.isPrivate}
              onCheckedChange={(checked) => setDiscussionData((prev) => ({ ...prev, isPrivate: checked }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            <IconX size={18} className="mr-2" /> 취소
          </Button>
          <Button disabled={!isFormValid} onClick={handleSubmit}>
            {isEdit ? <IconEdit size={18} className="mr-2" /> : <IconPlus size={18} className="mr-2" />}
            {isEdit ? '수정' : '개설'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
