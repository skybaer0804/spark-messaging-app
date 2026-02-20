import { useState, useEffect } from 'preact/hooks';
import { IconX, IconCheck, IconPlus } from '@tabler/icons-preact';
import { AutocompleteMember } from './AutocompleteMember';
import { Dialog } from '@/components/ui/dialog';
import { Flex, Grid } from '@/components/ui/layout';
import { Button } from '@/components/ui/button';
import { TextField as Input } from '@/components/ui/text-field';
import { SettingSwitch } from '@/components/ui/setting-switch';
import { useChat } from '../context/ChatContext';
import { useAuth } from '@/core/hooks/useAuth';
import { useTheme } from '@/core/context/ThemeProvider';
import { useToast } from '@/core/context/ToastContext';
import { teamApi } from '@/core/api/ApiService';
import { currentWorkspaceId } from '@/stores/chatRoomsStore';
import type { ChatUser } from '../types';

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
      // showSuccess(isEditMode ? '팀이 수정되었습니다.' : '팀이 생성되었습니다.');
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
    // HTML 태그나 스크립트 주입 방지를 위해 특정 특수문자 제한
    return /^[^<>/\\&]*$/.test(desc);
  };

  const isFormValid = isValidTeamName(teamData.teamName) && 
    isValidDescription(teamData.teamDesc) && 
    !isSubmitting;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={isEditMode ? '팀 수정' : '팀 개설'}
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
            isValid={isValidTeamName(teamData.teamName)}
            fullWidth
            placeholder="예: 마케팅팀"
            value={teamData.teamName}
            onInput={(e) => setTeamData((prev) => ({ ...prev, teamName: e.currentTarget.value }))}
            error={teamData.teamName.length > 0 && !isValidTeamName(teamData.teamName)}
            helperText={teamData.teamName.length > 0 && !isValidTeamName(teamData.teamName) 
              ? "공백이나 특수문자는 사용할 수 없습니다 (한글, 영문, 숫자, _, -만 허용)" 
              : ""}
          />
        </Grid>
        
        <Grid item xs={12}>
          <Input
            label="주제"
            isValid={isValidDescription(teamData.teamDesc)}
            fullWidth
            placeholder="이름 옆에 표시될 간단한 설명"
            value={teamData.teamDesc}
            onInput={(e) => setTeamData((prev) => ({ ...prev, teamDesc: e.currentTarget.value }))}
            error={teamData.teamDesc.length > 0 && !isValidDescription(teamData.teamDesc)}
            helperText={teamData.teamDesc.length > 0 && !isValidDescription(teamData.teamDesc)
              ? "보안을 위해 일부 특수문자(<, >, /, \, &)는 사용할 수 없습니다."
              : ""}
          />
        </Grid>

        <Grid item xs={12}>
          <AutocompleteMember
            userList={userList}
            selectedUsers={teamData.members}
            onUsersChange={(users) => setTeamData((prev) => ({ ...prev, members: users }))}
            currentUserId={user?.id}
            placeholder="멤버 추가"
            label="멤버 추가"
          />
        </Grid>

        <Grid item xs={12}>
          <SettingSwitch
            title="비공개"
            description="초대된 사람만 가입할 수 있습니다."
            checked={teamData.isPrivate}
            onChange={(checked) => setTeamData((prev) => ({ ...prev, isPrivate: checked }))}
          />
        </Grid>
      </Grid>
    </Dialog>
  );
};
