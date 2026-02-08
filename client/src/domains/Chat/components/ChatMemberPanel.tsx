import { useMemo } from 'preact/hooks';
import { Box } from '@/ui-components/Layout/Box';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconChevronLeft, IconX } from '@tabler/icons-preact';
import { List } from '@/ui-components/List/List';
import { ProfileItem } from './ProfileItem/ProfileItem';
import type { ChatUser, ChatRoom } from '../types';
import { useTheme } from '@/core/context/ThemeProvider';
import { useAuth } from '@/core/hooks/useAuth';
import { useConfirm } from '@/core/context/ConfirmContext';
import { useToast } from '@/core/context/ToastContext';
import { chatApi, teamApi } from '@/core/api/ApiService';

interface ChatMemberPanelProps {
  members?: ChatUser[];
  currentRoom?: ChatRoom | null;
  onClose: () => void;
}

export const ChatMemberPanel = ({ members = [], currentRoom, onClose }: ChatMemberPanelProps) => {
  const { deviceSize } = useTheme();
  const { user } = useAuth();
  const { confirm } = useConfirm();
  const { showSuccess, showError } = useToast();
  const isMobile = deviceSize === 'mobile';

  const currentUserId = (user as any)?.id || (user as any)?._id;

  // 방장(Owner) 확인 로직
  const isOwner = useMemo(() => {
    if (!currentRoom || !currentUserId) return false;

    // 1:1 채팅은 방장 개념 없음
    if (currentRoom.type === 'direct') return false;

    // createdBy 필드 확인
    if (currentRoom.createdBy) {
      const creatorId = typeof currentRoom.createdBy === 'string'
        ? currentRoom.createdBy
        : (currentRoom.createdBy as any)?._id || (currentRoom.createdBy as any)?.id;
      return creatorId && creatorId.toString() === currentUserId.toString();
    }

    // 하위 호환성: 첫 번째 멤버를 방장으로 간주
    if (currentRoom.members && currentRoom.members.length > 0) {
      const firstMemberId = (currentRoom.members[0] as any)?._id || (currentRoom.members[0] as any)?.id || currentRoom.members[0];
      return firstMemberId && firstMemberId.toString() === currentUserId.toString();
    }

    return false;
  }, [currentRoom, currentUserId]);

  const handleKickMember = (member: ChatUser) => {
    const memberId = member._id || (member as any).id;
    if (!memberId || !currentRoom) return;

    confirm({
      title: '멤버 강퇴',
      message: `정말로 "${member.username}"님을 이 방에서 강퇴하시겠습니까?`,
      type: 'error',
      confirmText: '강퇴',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          if (currentRoom.type === 'team' && currentRoom.teamId) {
            await teamApi.removeMember(currentRoom.teamId, memberId);
          } else {
            await chatApi.removeRoomMember(currentRoom._id, memberId);
          }
          showSuccess(`${member.username}님을 강퇴했습니다.`);
        } catch (error: any) {
          console.error('Failed to kick member:', error);
          showError(error.response?.data?.message || '강퇴에 실패했습니다.');
        }
      }
    });
  };

  return (
    <Paper
      elevation={0}
      square
      padding="none"
      className="chat-app__sidebar-panel"
    >
      <Box className="chat-app__sidebar-panel__header">
        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          {isMobile && (
            <IconButton onClick={onClose} size="small" style={{ marginLeft: '-8px' }}>
              <IconChevronLeft size={24} />
            </IconButton>
          )}
          <Typography variant="h4" style={{ flex: 1 }}>참여자 ({members.length})</Typography>
        </Box>
        {!isMobile && (
          <IconButton onClick={onClose} size="small">
            <IconX size={18} />
          </IconButton>
        )}
      </Box>
      <Box className="chat-app__sidebar-panel__content">
        <List style={{ padding: '8px 0' }}>
          {members.map((member) => {
            const memberId = member._id || (member as any).id;
            const isMemberOwner = currentRoom?.createdBy
              ? (typeof currentRoom.createdBy === 'string'
                ? currentRoom.createdBy === memberId
                : ((currentRoom.createdBy as any)?._id || (currentRoom.createdBy as any)?.id) === memberId)
              : (currentRoom?.members?.[0] as any)?._id === memberId || currentRoom?.members?.[0] === memberId;

            return (
              <ProfileItem
                key={memberId}
                name={member.username}
                desc={isMemberOwner ? 'Owner' : (member.statusText || member.role || 'Member')}
                type="direct"
                avatar={member.avatar || member.profileImage}
                status={member.status}
                styleOption={{
                  showDesc: true,
                  statusPosition: 'name-left',
                  nameSuffix: isMemberOwner && (
                    <span style={{
                      fontSize: '10px',
                      backgroundColor: 'var(--color-primary-main)',
                      color: 'white',
                      padding: '1px 4px',
                      borderRadius: '4px',
                      marginLeft: '4px'
                    }}>Owner</span>
                  )
                }}
                onMenuClick={isOwner && memberId !== currentUserId ? () => handleKickMember(member) : undefined}
                style={{ margin: '2px 8px' }}
              />
            );
          })}
        </List>
      </Box>
    </Paper>
  );
};
