import { useState } from 'preact/hooks';
import { Box, Flex, Stack } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import {
  IconSearch,
  IconCopy,
  IconChevronLeft,
} from '@tabler/icons-preact';
import { teamApi, chatApi } from '@/core/api/ApiService';
import { currentWorkspaceId } from '@/stores/chatRoomsStore';
import { useAuth } from '@/core/hooks/useAuth';
import { useToast } from '@/core/context/ToastContext';
import { useConfirm } from '@/core/context/ConfirmContext';
import { useChat } from '../../context/ChatContext';
import { Dialog } from '@/components/ui/dialog';
import { TextField as Input } from '@/components/ui/text-field';
import { Tabs, TabsItem } from '@/components/ui/tabs';
import { DialogChatTeam } from '../DialogChatTeam';
import { DialogChatGroup } from '../DialogChatGroup';
import { DialogChatDiscussion } from '../DialogChatDiscussion';
import { DialogRoomInfo } from '../DialogRoomInfo';
import { DirectoryUserTab } from './Tabs/DirectoryUserTab';
import { DirectoryTeamTab } from './Tabs/DirectoryTeamTab';
import { DirectoryChannelTab } from './Tabs/DirectoryChannelTab';
import { DirectoryDiscussionTab } from './Tabs/DirectoryDiscussionTab';
import type { ChatRoom, ChatUser } from '../../types';
import './DirectoryView.scss';

// Team 인터페이스는 탭에서도 사용되므로 맞춰야 함
interface Team {
  _id: string;
  teamName: string;
  teamDesc?: string;
  private: boolean;
  members: (ChatUser & { role?: string })[];
  createdBy: ChatUser;
  createdAt: string;
}

interface DirectoryViewProps {
  isMobile?: boolean;
  directoryTab: 'channel' | 'team' | 'user' | 'discussion';
  setDirectoryTab: (tab: 'channel' | 'team' | 'user' | 'discussion') => void;
  roomList: ChatRoom[];
  onRoomSelect: (roomId: string) => void;
  userList: ChatUser[];
  startDirectChat: (userId: string) => void;
  onBack?: () => void;
}

export const DirectoryView = ({
  isMobile,
  directoryTab,
  setDirectoryTab,
  roomList,
  onRoomSelect,
  userList,
  startDirectChat,
  onBack,
}: DirectoryViewProps) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirm();
  const { refreshRoomList } = useChat();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [editChannel, setEditChannel] = useState<ChatRoom | null>(null);
  const [editDiscussion, setEditDiscussion] = useState<ChatRoom | null>(null);
  const [inviteChannel, setInviteChannel] = useState<ChatRoom | null>(null);

  // Room Info Dialog State
  const [infoRoom, setInfoRoom] = useState<{
    data: ChatRoom | Team;
    type: 'team' | 'channel' | 'discussion';
  } | null>(null);

  // 팀 수정 삭제 핸들러 (탭으로 전달)
  const handleEditTeam = (team: Team) => setEditTeam(team);
  const handleDeleteTeam = async (team: Team) => {
    confirm({
      title: '팀 삭제',
      message: `정말로 "${team.teamName}" 팀을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없으며 모든 데이터가 삭제됩니다.`,
      type: 'error',
      confirmText: '삭제',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          await teamApi.deleteTeam(team._id);
          showSuccess('팀이 삭제되었습니다.');
          // 탭 내의 팀 목록은 currentWorkspaceId가 변경되지 않아도 
          // 다른 방식으로 갱신이 필요할 수 있으나, 일단 API 호출 결과에 의존
        } catch (error: any) {
          showError(error.response?.data?.message || '팀 삭제에 실패했습니다.');
        }
      }
    });
  };

  const handleTeamUpdated = async () => {
    setEditTeam(null);
    // 탭 컴포넌트 내부의 useEffect가 currentWorkspaceId 변경 등을 감지하지 못할 경우를 대비해 
    // 전체 새로고침 로직이 필요할 수 있음. 현재는 Tab 내부에서 관리함.
  };

  // 채널/토론 수정 삭제 핸들러
  const handleEditChannel = (room: ChatRoom) => setEditChannel(room);
  const handleEditDiscussion = (room: ChatRoom) => setEditDiscussion(room);
  const handleDeleteChannel = async (room: ChatRoom) => {
    confirm({
      title: room.type === 'discussion' ? '토론 삭제' : '채널 삭제',
      message: `정말로 "${room.name || '방'}"을(를) 삭제하시겠습니까?\n모든 대화 기록이 영구적으로 삭제됩니다.`,
      type: 'error',
      confirmText: '삭제',
      cancelText: '취소',
      onConfirm: async () => {
        try {
          await chatApi.deleteRoom(room._id);
          showSuccess(`${room.type === 'discussion' ? '토론' : '채널'}이 삭제되었습니다.`);
          await refreshRoomList();
        } catch (error: any) {
          showError(error.response?.data?.message || '삭제에 실패했습니다.');
        }
      }
    });
  };

  // 정보 다이얼로그 열기
  const handleOpenInfo = (data: ChatRoom | Team, type: 'team' | 'channel' | 'discussion') => {
    setInfoRoom({ data, type });
  };

  // 실제 참여/입장 로직
  const handleJoinRoom = async () => {
    if (!infoRoom) return;
    const { data, type } = infoRoom;
    setInfoRoom(null);

    if (type === 'team') {
      const team = data as Team;
      const teamRoom = roomList.find((room) => room.teamId === team._id && room.type === 'team');
      if (teamRoom) {
        onRoomSelect(teamRoom._id);
      } else {
        try {
          const response = await chatApi.createRoom({
            teamId: team._id,
            type: 'team',
            workspaceId: currentWorkspaceId.value || undefined,
            name: team.teamName,
            description: team.teamDesc,
            isPrivate: team.private,
          });
          if (response.data?._id) onRoomSelect(response.data._id);
        } catch (error) {
          showError('팀 채팅방에 진입할 수 없습니다.');
        }
      }
    } else {
      const room = data as ChatRoom;
      if (isMember(room)) {
        onRoomSelect(room._id);
        return;
      }
      if (room.isPrivate || room.type === 'private') {
        setInviteChannel(room);
        return;
      }
      try {
        const response = await chatApi.joinRoom(room._id);
        if (response.data?._id) {
          await refreshRoomList();
          onRoomSelect(response.data._id);
        }
      } catch (error) {
        showError('채널 입장에 실패했습니다.');
      }
    }
  };

  const isMember = (data: any) => {
    if (!user) return false;
    const currentUserId = (user as any).id || (user as any)._id;
    return data.members?.some((m: any) => {
      const mid = m._id || m.id || m;
      return mid.toString() === currentUserId.toString();
    });
  };

  const isOwner = (room: ChatRoom) => {
    if (!user) return false;
    const currentUserId = (user as any).id || (user as any)._id;
    const creatorId = typeof room.createdBy === 'string' 
      ? room.createdBy 
      : (room.createdBy as any)?._id || (room.createdBy as any)?.id;
    return creatorId && creatorId.toString() === currentUserId.toString();
  };

  const getPlaceholderText = () => {
    switch (directoryTab) {
      case 'channel': return '채널 이름 또는 설명으로 검색...';
      case 'discussion': return '토론 이름 또는 설명으로 검색...';
      case 'team': return '팀 이름 또는 설명으로 검색...';
      case 'user': return '사용자 이름으로 검색...';
      default: return '검색...';
    }
  };

  const tabItems: TabsItem[] = [
    {
      value: 'user',
      label: '사용자',
      content: (
        <DirectoryUserTab 
          userList={userList} 
          searchTerm={searchTerm} 
          startDirectChat={startDirectChat} 
        />
      ),
    },
    {
      value: 'team',
      label: '팀',
      content: (
        <DirectoryTeamTab 
          searchTerm={searchTerm}
          onSelectTeam={(team) => handleOpenInfo(team, 'team')}
          onEditTeam={handleEditTeam}
          onDeleteTeam={handleDeleteTeam}
        />
      ),
    },
    {
      value: 'channel',
      label: '채널',
      content: (
        <DirectoryChannelTab 
          roomList={roomList}
          searchTerm={searchTerm}
          onSelectChannel={(room) => handleOpenInfo(room, 'channel')}
          onEditChannel={handleEditChannel}
          onDeleteChannel={handleDeleteChannel}
        />
      ),
    },
    {
      value: 'discussion',
      label: '토론',
      content: (
        <DirectoryDiscussionTab 
          roomList={roomList}
          searchTerm={searchTerm}
          onSelectDiscussion={(room) => handleOpenInfo(room, 'discussion')}
          onEditDiscussion={handleEditDiscussion}
          onDeleteDiscussion={handleDeleteChannel}
        />
      ),
    },
  ];

  return (
    <Box className={`directory-view ${isMobile ? 'directory-view--mobile' : ''}`}>
      <header className="directory-view__header">
        <Stack spacing={isMobile ? 'xs' : 'sm'}>
          <Flex align="center" gap="sm">
            {isMobile && onBack && (
              <IconButton onClick={onBack} size="small" color="secondary" style={{ marginLeft: '-8px' }}>
                <IconChevronLeft size={24} />
              </IconButton>
            )}
            <Typography variant="h1" className="directory-view__title">
              디렉토리
            </Typography>
          </Flex>

          {!isMobile && (
            <Typography variant="body-large" className="directory-view__subtitle">
              워크스페이스의 채널, 팀, 그리고 동료들을 한눈에 확인하고 빠르게 소통을 시작하세요.
            </Typography>
          )}

          <div className="directory-view__controls">
            <div className="directory-view__search-wrapper">
              <IconSearch className="directory-view__search-icon" size={20} />
              <input
                type="text"
                className="directory-view__search-input"
                placeholder={getPlaceholderText()}
                value={searchTerm}
                onInput={(e) => setSearchTerm(e.currentTarget.value)}
              />
            </div>
          </div>
        </Stack>
      </header>

      <Box className="directory-view__content">
        <Tabs
          items={tabItems}
          value={directoryTab}
          onChange={(val) => setDirectoryTab(val as any)}
          variant="standard"
        />
      </Box>

      {/* 정보 다이얼로그 */}
      {infoRoom && (
        <DialogRoomInfo
          open={!!infoRoom}
          onClose={() => setInfoRoom(null)}
          onJoin={handleJoinRoom}
          room={infoRoom.data}
          type={infoRoom.type}
          isMember={isMember(infoRoom.data)}
        />
      )}

      {/* 팀 수정 다이얼로그 */}
      {editTeam && (
        <DialogChatTeam
          open={!!editTeam}
          onClose={() => setEditTeam(null)}
          onTeamCreated={handleTeamUpdated}
          team={editTeam}
        />
      )}

      {/* 채널 수정 다이얼로그 */}
      {editChannel && (
        <DialogChatGroup
          open={!!editChannel}
          onClose={() => setEditChannel(null)}
          onGroupCreated={async () => {
            setEditChannel(null);
            await refreshRoomList();
          }}
          group={
            editChannel
              ? {
                _id: editChannel._id,
                name: editChannel.name || '',
                description: editChannel.description,
                isPrivate: editChannel.isPrivate || false,
                members: editChannel.members || [],
                createdBy: editChannel.createdBy as ChatUser,
              }
              : undefined
          }
        />
      )}

      {/* 토론 수정 다이얼로그 */}
      {editDiscussion && (
        <DialogChatDiscussion
          open={!!editDiscussion}
          onClose={() => setEditDiscussion(null)}
          onDiscussionCreated={async () => {
            setEditDiscussion(null);
            await refreshRoomList();
          }}
          handleCreateRoom={async (_type, data) => {
            if (editDiscussion) {
              await chatApi.updateRoom(editDiscussion._id, data);
            }
          }}
          discussion={editDiscussion}
        />
      )}

      {/* 초대 링크 다이얼로그 */}
      {inviteChannel && (
        <Dialog
          open={!!inviteChannel}
          onClose={() => setInviteChannel(null)}
          title="채널 초대"
          maxWidth="sm"
          fullWidth
          actions={
            <Flex gap="sm">
              <Button onClick={() => setInviteChannel(null)}>닫기</Button>
            </Flex>
          }
        >
          <Stack spacing="md">
            {isOwner(inviteChannel) ? (
              <>
                <Typography variant="body-medium">
                  이 채널의 초대 링크를 공유하세요. 링크를 가진 사용자만 채널에 입장할 수 있습니다.
                </Typography>
                <Box>
                  <Flex gap="sm" align="center">
                    <Input
                      fullWidth
                      disabled
                      value={
                        inviteChannel.slug
                          ? `${window.location.origin}/chatapp/invite/${inviteChannel.slug}`
                          : '초대 링크 생성 중...'
                      }
                      style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                    />
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        const inviteLink = inviteChannel.slug
                          ? `${window.location.origin}/chatapp/invite/${inviteChannel.slug}`
                          : '';
                        if (inviteLink) {
                          await navigator.clipboard.writeText(inviteLink);
                          showSuccess('초대 링크가 클립보드에 복사되었습니다.');
                        }
                      }}
                    >
                      <IconCopy size={18} />
                    </Button>
                  </Flex>
                </Box>
              </>
            ) : (
              <Typography variant="body-medium" color="text-secondary">
                이 채널은 비공개 채널입니다. 채널 Owner에게 초대 링크를 요청하세요.
              </Typography>
            )}
          </Stack>
        </Dialog>
      )}
    </Box>
  );
};
