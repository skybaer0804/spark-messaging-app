import { useState, useEffect, useMemo } from 'preact/hooks';
import { Box } from '@/ui-components/Layout/Box';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Button } from '@/ui-components/Button/Button';
import { Flex } from '@/ui-components/Layout/Flex';
import { Stack } from '@/ui-components/Layout/Stack';
import { Input } from '@/ui-components/Input/Input';
import { Switch } from '@/ui-components/Switch/Switch';
import { 
  IconX, 
  IconInfoCircle, 
  IconLock, 
  IconWorld, 
  IconMessageCircle, 
  IconHash, 
  IconHierarchy,
  IconEdit,
  IconCheck,
  IconCalendar,
  IconLogout
} from '@tabler/icons-preact';
import type { ChatRoom } from '../types';
import { useTheme } from '@/core/context/ThemeProvider';
import { chatApi } from '@/core/api/ApiService';
import { useToast } from '@/core/context/ToastContext';
import { useChat } from '../context/ChatContext';
import { useAuth } from '@/core/hooks/useAuth';
import { useConfirm } from '@/core/context/ConfirmContext';
import { teamApi } from '@/core/api/ApiService';

interface ChatInfoPanelProps {
  currentRoom: ChatRoom;
  onClose: () => void;
  onLeave?: () => void;
}

export const ChatInfoPanel = ({ 
  currentRoom,
  onClose,
  onLeave
}: ChatInfoPanelProps) => {
  const { deviceSize } = useTheme();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const { confirm } = useConfirm();
  const { refreshRoomList, setCurrentRoom } = useChat();
  const isMobile = deviceSize === 'mobile';

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    description: '',
    isPrivate: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 현재 사용자가 방의 소유자인지 확인
  const isOwner = useMemo(() => {
    if (!user || !currentRoom) return false;
    const currentUserId = user.id || (user as any)._id;
    if (!currentUserId) return false;

    // createdBy 필드 확인
    if (currentRoom.createdBy) {
      if (typeof currentRoom.createdBy === 'string') {
        return currentRoom.createdBy === currentUserId.toString();
      }
      const creatorId = (currentRoom.createdBy as any)?._id || (currentRoom.createdBy as any)?.id;
      return creatorId && creatorId.toString() === currentUserId.toString();
    }

    // fallback: 멤버 목록의 첫 번째 사람을 방장으로 간주 (레거시)
    if (currentRoom.members && currentRoom.members.length > 0) {
      const firstMember = currentRoom.members[0];
      const firstMemberId = typeof firstMember === 'string' ? firstMember : (firstMember as any)?._id || (firstMember as any)?.id;
      return firstMemberId && firstMemberId.toString() === currentUserId.toString();
    }

    return false;
  }, [user, currentRoom]);

  useEffect(() => {
    if (currentRoom) {
      setEditData({
        name: currentRoom.displayName || currentRoom.name || '',
        description: currentRoom.description || '',
        isPrivate: !!(currentRoom.isPrivate || (currentRoom as any).private || currentRoom.type === 'private')
      });
    }
  }, [currentRoom, isEditing]);

  const getTypeText = (type: string) => {
    switch (type) {
      case 'team': return '팀';
      case 'public': 
      case 'private': return '채널';
      case 'direct': return '1:1 대화';
      case 'discussion': return '토론';
      default: return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'team': return <IconHierarchy size={18} />;
      case 'public': 
      case 'private': return <IconHash size={18} />;
      case 'direct': return <IconMessageCircle size={18} />;
      case 'discussion': return <IconMessageCircle size={18} />;
      default: return <IconInfoCircle size={18} />;
    }
  };

  const isPrivate = currentRoom.isPrivate || (currentRoom as any).private || currentRoom.type === 'private';

  const handleUpdate = async () => {
    if (!editData.name.trim()) {
      showError('방 이름을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      let updatedRoom;
      if (currentRoom.type === 'team' && currentRoom.teamId) {
        await teamApi.updateTeam(currentRoom.teamId, {
          teamName: editData.name.trim(),
          teamDesc: editData.description.trim(),
          private: editData.isPrivate
        });
        updatedRoom = { 
          ...currentRoom, 
          name: editData.name, 
          displayName: editData.name,
          description: editData.description, 
          isPrivate: editData.isPrivate 
        };
      } else {
        const response = await chatApi.updateRoom(currentRoom._id, {
          name: editData.name.trim(),
          description: editData.description.trim(),
          isPrivate: editData.isPrivate
        });
        updatedRoom = response.data;
      }
      
      showSuccess('채팅방 정보가 업데이트되었습니다.');
      setIsEditing(false);
      
      setCurrentRoom(updatedRoom);
      await refreshRoomList();
    } catch (error: any) {
      console.error('Failed to update room:', error);
      showError(error.response?.data?.message || '업데이트에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLeaveRoom = () => {
    confirm({
      title: '채팅방 나가기',
      message: `정말로 "${currentRoom.displayName || currentRoom.name}" 채팅방을 나가시겠습니까?\n나가면 더 이상 이 방의 메시지를 볼 수 없습니다.`,
      type: 'warning',
      confirmText: '나가기',
      cancelText: '취소',
      onConfirm: () => {
        onLeave?.();
      }
    });
  };

  return (
    <Paper
      elevation={0}
      square
      padding="none"
      className="chat-app__sidebar-panel"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '1px solid var(--color-border-subtle)' }}
    >
      <Box className="chat-app__sidebar-panel__header">
        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <IconInfoCircle size={isMobile ? 24 : 18} />
          <Typography variant="h4" style={{ flex: 1, fontWeight: 600 }}>
            채팅방 정보
          </Typography>
        </Box>
        <Flex gap="xs">
          {!isEditing && isOwner && currentRoom.type !== 'direct' && (
            <IconButton onClick={() => setIsEditing(true)} size="small" title="정보 수정">
              <IconEdit size={18} />
            </IconButton>
          )}
          <IconButton onClick={onClose} size="small">
            <IconX size={18} />
          </IconButton>
        </Flex>
      </Box>

      <Box className="chat-app__sidebar-panel__content" style={{ padding: '0', flex: 1, overflowY: 'auto' }}>
        <Box style={{ padding: '24px' }}>
          <Stack spacing="xl">
            {/* 방 이름 섹션 */}
            <Box>
              <Typography variant="caption" color="text-tertiary" style={{ marginBottom: '8px', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px' }}>
                방 이름
              </Typography>
              {isEditing ? (
                <Input
                  fullWidth
                  value={editData.name}
                  onInput={(e) => setEditData({ ...editData, name: e.currentTarget.value })}
                  placeholder="방 이름을 입력하세요"
                  autoFocus
                  style={{ fontSize: '14px', height: '36px' }}
                />
              ) : (
                <Typography variant="h3" style={{ fontWeight: 700, color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>
                  {currentRoom.displayName || currentRoom.name}
                </Typography>
              )}
            </Box>

            {/* 유형 및 보안 섹션 */}
            <Box>
              <Typography variant="caption" color="text-tertiary" style={{ marginBottom: '12px', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px' }}>
                유형 및 보안
              </Typography>
              <Flex gap="md" wrap="wrap">
                <Flex align="center" gap="sm" style={{ 
                  padding: '6px 14px',
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderRadius: '20px',
                  border: '1px solid var(--color-border-subtle)',
                }}>
                  <Box style={{ color: 'var(--color-interactive-primary)', display: 'flex' }}>
                    {getTypeIcon(currentRoom.type)}
                  </Box>
                  <Typography variant="body-small" style={{ fontWeight: 600 }}>
                    {getTypeText(currentRoom.type)}
                  </Typography>
                </Flex>

                {isEditing && currentRoom.type !== 'direct' ? (
                  <Flex align="center" gap="md" style={{ 
                    padding: '4px 10px 4px 14px',
                    borderRadius: '20px',
                    backgroundColor: editData.isPrivate ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    border: `1px solid ${editData.isPrivate ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    transition: 'all 0.3s ease'
                  }}>
                    <Flex align="center" gap="xs">
                      {editData.isPrivate ? <IconLock size={16} color="var(--color-status-warning)" /> : <IconWorld size={16} color="var(--color-status-success)" />}
                      <Typography variant="body-small" style={{ 
                        color: editData.isPrivate ? 'var(--color-status-warning)' : 'var(--color-status-success)',
                        fontWeight: 600
                      }}>
                        {editData.isPrivate ? '비공개' : '공개'}
                      </Typography>
                    </Flex>
                    <Switch
                      size="small"
                      checked={editData.isPrivate}
                      onChange={(checked) => setEditData({ ...editData, isPrivate: checked })}
                    />
                  </Flex>
                ) : (
                  <Flex align="center" gap="sm" style={{ 
                    padding: '6px 14px',
                    backgroundColor: isPrivate ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    borderRadius: '20px',
                    border: `1px solid ${isPrivate ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                    color: isPrivate ? 'var(--color-status-warning)' : 'var(--color-status-success)',
                  }}>
                    {isPrivate ? <IconLock size={18} /> : <IconWorld size={18} />}
                    <Typography variant="body-small" style={{ color: 'inherit', fontWeight: 600 }}>
                      {isPrivate ? '비공개' : '공개'}
                    </Typography>
                  </Flex>
                )}
              </Flex>
            </Box>

            {/* 설명 섹션 */}
            <Box>
              <Typography variant="caption" color="text-tertiary" style={{ marginBottom: '8px', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '11px' }}>
                설명
              </Typography>
              {isEditing ? (
                <Input
                  fullWidth
                  multiline
                  rows={4}
                  value={editData.description}
                  onInput={(e) => setEditData({ ...editData, description: e.currentTarget.value })}
                  placeholder="이 채널의 목적은 무엇인가요?"
                  style={{ fontSize: '13px', lineHeight: '1.5' }}
                />
              ) : (
                <Box style={{ 
                  padding: '12px 0',
                  minHeight: '40px'
                }}>
                  <Typography variant="body-medium" color={currentRoom.description ? 'text-primary' : 'text-tertiary'} style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {currentRoom.description || '설명이 아직 등록되지 않았습니다.'}
                  </Typography>
                </Box>
              )}
            </Box>

            <Box style={{ borderTop: '1px solid var(--color-border-subtle)', pt: '12px' }} />

            {/* 메타 데이터 섹션 */}
            <Stack spacing="md">
              <Flex align="center" gap="sm">
                <Box style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--color-bg-secondary)', display: 'flex', alignItems: 'center', justify: 'center', color: 'var(--color-text-tertiary)' }}>
                  <IconCalendar size={18} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text-tertiary" style={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '10px' }}>
                    생성일
                  </Typography>
                  <Typography variant="body-small" style={{ fontWeight: 500 }}>
                    {new Date(currentRoom.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </Typography>
                </Box>
              </Flex>
            </Stack>
          </Stack>
        </Box>
      </Box>

      {/* Footer 섹션 (나가기 버튼 또는 수정 버튼) */}
      <Box style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border-subtle)', backgroundColor: 'var(--color-bg-default)' }}>
        {isEditing ? (
          <Flex gap="sm">
            <Button 
              fullWidth 
              variant="secondary" 
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={isSubmitting}
              style={{ flex: 1 }}
            >
              취소
            </Button>
            <Button 
              fullWidth 
              variant="primary" 
              size="sm"
              onClick={handleUpdate}
              disabled={isSubmitting}
              style={{ flex: 1.5, fontWeight: 600 }}
            >
              <Flex align="center" gap="xs" justify="center">
                {!isSubmitting && <IconCheck size={16} />}
                <span>{isSubmitting ? '저장 중...' : '저장'}</span>
              </Flex>
            </Button>
          </Flex>
        ) : currentRoom.type !== 'direct' ? (
          <Button 
            fullWidth 
            variant="secondary" 
            size="sm"
            onClick={handleLeaveRoom}
            style={{ 
              color: 'var(--color-status-error)', 
              borderColor: 'rgba(239, 68, 68, 0.2)',
              backgroundColor: 'rgba(239, 68, 68, 0.04)',
              fontWeight: 600,
              height: '40px'
            }}
          >
            <Flex align="center" gap="xs" justify="center">
              <IconLogout size={16} />
              <span>채팅방 나가기</span>
            </Flex>
          </Button>
        ) : null}
      </Box>
    </Paper>
  );
};
