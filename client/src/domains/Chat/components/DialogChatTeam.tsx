import { useState, useEffect } from 'preact/hooks';
import { IconX, IconCheck, IconPlus } from '@tabler/icons-preact';
import { AutocompleteMember } from './AutocompleteMember';
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
import { useChat } from '../context/ChatContext';
import { useAuth } from '@/core/hooks/useAuth';
import { useTheme } from '@/core/context/ThemeProvider';
import { useToast } from '@/core/context/ToastContext';
import { teamApi } from '@/core/api/ApiService';
import { currentWorkspaceId } from '@/stores/chatRoomsStore';
import type { ChatUser } from '../types';
import { cn } from '@/lib/utils';

interface Team {
  _id: string;
  teamName: string;
  teamDesc?: string;
  private: boolean;
  members: ChatUser[];
  createdBy: ChatUser;
}

interface DialogChatTeamProps {
  open: boolean;
  onClose: () => void;
  onTeamCreated?: () => void;
  team?: Team; // 수정 모드일 때 전달
}

export const DialogChatTeam = ({ open, onClose, onTeamCreated, team }: DialogChatTeamProps) => {
  const { userList } = useChat();
  const { user } = useAuth();
  const { deviceSize } = useTheme();
  const { showError } = useToast();
  const isEditMode = !!team;
  const isMobile = deviceSize === 'mobile';
  const [teamData, setTeamData] = useState({
    teamName: '',
    teamDesc: '',
    isPrivate: false,
    members: [] as ChatUser[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (team && open) {
      setTeamData({
        teamName: team.teamName,
        teamDesc: team.teamDesc || '',
        isPrivate: team.private || (team as any).isPrivate || false,
        members: team.members || [],
      });
    } else if (!team && open) {
      // 생성 모드일 때 초기화
      setTeamData({
        teamName: '',
        teamDesc: '',
        isPrivate: false,
        members: [],
      });
    }
  }, [team, open]);

  const handleSubmit = async () => {
    if (!teamData.teamName.trim()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && team) {
        // 수정 모드
        const existingMemberIds = team.members.map((m) => m._id || (m as any).id);
        const newMemberIds = teamData.members.map((m) => m._id || (m as any).id);
        const addedMemberIds = newMemberIds.filter((id) => !existingMemberIds.includes(id));
        const removedMemberIds = existingMemberIds.filter((id) => !newMemberIds.includes(id));

        // 팀 정보 수정
        await teamApi.updateTeam(team._id, {
          teamName: teamData.teamName.trim(),
          teamDesc: teamData.teamDesc.trim() || undefined,
          private: teamData.isPrivate,
        });

        // 새로 추가된 멤버가 있으면 초대
        if (addedMemberIds.length > 0) {
          await teamApi.inviteMembers(team._id, addedMemberIds);
        }

        // 제거된 멤버가 있으면 삭제
        if (removedMemberIds.length > 0) {
          for (const memberId of removedMemberIds) {
            await teamApi.removeMember(team._id, memberId);
          }
        }
      } else {
        // 생성 모드
        const memberIds = teamData.members.map((m) => m._id);
        await teamApi.createTeam({
          teamName: teamData.teamName.trim(),
          teamDesc: teamData.teamDesc.trim() || undefined,
          private: teamData.isPrivate,
          members: memberIds.length > 0 ? memberIds : undefined,
          workspaceId: currentWorkspaceId.value || undefined,
        });
      }

      // 성공 시 초기화 및 닫기
      setTeamData({
        teamName: '',
        teamDesc: '',
        isPrivate: false,
        members: [],
      });
      onTeamCreated?.();
      onClose();
    } catch (error: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} team:`, error);
      showError(error.response?.data?.message || `${isEditMode ? '팀 수정' : '팀 생성'}에 실패했습니다.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTeamData({
      teamName: '',
      teamDesc: '',
      isPrivate: false,
      members: [],
    });
    onClose();
  };

  // 팀 이름 유효성 검사 (공백 및 특수문자 제한)
  const isValidTeamName = (name: string) => {
    if (!name.trim()) return false;
    // 공백이나 특수문자 체크 (영문, 한글, 숫자, 언더스코어, 하이픈만 허용)
    return /^[a-zA-Z0-9가-힣_-]+$/.test(name.trim());
  };

  // 설명/주제 유효성 검사 (Injection 방어: <, >, /, \ 등 제한)
  const isValidDescription = (desc: string) => {
    if (!desc) return true;
    return /^[^<>/\\&]*$/.test(desc);
  };

  const isFormValid = isValidTeamName(teamData.teamName) && 
    isValidDescription(teamData.teamDesc) && 
    !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? '팀 수정' : '팀 개설'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? '팀 정보를 수정합니다.' : '함께 협업할 새로운 팀을 만듭니다.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="team-name">이름</Label>
            <Input
              id="team-name"
              placeholder="예: 마케팅팀"
              value={teamData.teamName}
              onInput={(e: any) => setTeamData((prev) => ({ ...prev, teamName: e.currentTarget.value }))}
              className={cn(teamData.teamName.length > 0 && !isValidTeamName(teamData.teamName) && "border-destructive")}
            />
            {teamData.teamName.length > 0 && !isValidTeamName(teamData.teamName) && (
              <p className="text-xs text-destructive">공백이나 특수문자는 사용할 수 없습니다.</p>
            )}
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="team-desc">주제</Label>
            <Input
              id="team-desc"
              placeholder="이름 옆에 표시될 간단한 설명"
              value={teamData.teamDesc}
              onInput={(e: any) => setTeamData((prev) => ({ ...prev, teamDesc: e.currentTarget.value }))}
              className={cn(teamData.teamDesc.length > 0 && !isValidDescription(teamData.teamDesc) && "border-destructive")}
            />
          </div>

          <div className="grid gap-2">
            <AutocompleteMember
              userList={userList}
              selectedUsers={teamData.members}
              onUsersChange={(users) => setTeamData((prev) => ({ ...prev, members: users }))}
              currentUserId={user?.id}
              placeholder="멤버 추가"
              label="멤버 추가"
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
              checked={teamData.isPrivate}
              onCheckedChange={(checked) => setTeamData((prev) => ({ ...prev, isPrivate: checked }))}
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
