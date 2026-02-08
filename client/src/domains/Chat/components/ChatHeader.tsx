import { IconButton } from '@/ui-components/Button/IconButton';
import { Box } from '@/ui-components/Layout/Box';
import { Stack } from '@/ui-components/Layout/Stack';
import { Paper } from '@/ui-components/Paper/Paper';
import { IconChevronLeft, IconUsers, IconSettings, IconMessageCircle2, IconInfoCircle } from '@tabler/icons-preact';
import { useAuth } from '@/core/hooks/useAuth';
import { getDirectChatName } from '../utils/chatUtils';
import { ProfileItem } from './ProfileItem/ProfileItem';
import type { ChatRoom } from '../types';

interface ChatHeaderProps {
  isMobile: boolean;
  goToHome: () => void;
  currentRoom: ChatRoom;
  showUserList: boolean;
  showSettings: boolean;
  showThreads: boolean;
  showInfo: boolean;
  setShowUserList: (val: boolean) => void;
  setShowSettings: (val: boolean) => void;
  setShowThreads: (val: boolean) => void;
  setShowInfo: (val: boolean) => void;
  className?: string;
}

export const ChatHeader = ({
  isMobile,
  goToHome,
  currentRoom,
  showUserList,
  showSettings,
  showThreads,
  showInfo,
  setShowUserList,
  setShowSettings,
  setShowThreads,
  setShowInfo,
  className = '',
}: ChatHeaderProps) => {
  const { user: currentUser } = useAuth();

  return (
    <Paper
      square
      elevation={1}
      padding="none"
      className={className}
      style={{ 
        zIndex: 10, 
        flexShrink: 0, 
        borderBottom: '1px solid var(--color-border-default)',
        padding: '4px 12px',
        paddingTop: isMobile ? 'calc(var(--space-gap-sm) + var(--safe-area-inset-top)' : '4px'
      }}
    >
      <Stack direction="row" align="center" spacing="md">
        {isMobile && (
          <IconButton onClick={goToHome} color="secondary">
            <IconChevronLeft />
          </IconButton>
        )}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <ProfileItem
            name={
              currentRoom.displayName ||
              getDirectChatName(currentRoom, currentUser?.id || (currentUser as any)?._id)
            }
            desc={currentRoom.description || undefined}
            type={currentRoom.type as any}
            isPrivate={currentRoom.isPrivate || (currentRoom as any).private}
            avatar={currentRoom.displayAvatar || undefined}
            status={currentRoom.displayStatus}
            styleOption={{
              showDesc: true,
              statusPosition: 'name-left',
              noHover: true,
            }}
            style={{ margin: 0, padding: 0 }}
          />
        </Box>
        <IconButton
          onClick={() => {
            if (showInfo) {
              setShowInfo(false);
            } else {
              setShowUserList(false);
              setShowSettings(false);
              setShowThreads(false);
              setShowInfo(true);
            }
          }}
          active={showInfo}
          color={showInfo ? 'primary' : 'secondary'}
          title="정보"
        >
          <IconInfoCircle size={20} />
        </IconButton>
        <IconButton
          onClick={() => {
            if (showThreads) {
              setShowThreads(false);
            } else {
              setShowUserList(false);
              setShowSettings(false);
              setShowInfo(false);
              setShowThreads(true);
            }
          }}
          active={showThreads}
          color={showThreads ? 'primary' : 'secondary'}
          title="스레드"
        >
          <IconMessageCircle2 size={20} />
        </IconButton>
        <IconButton
          onClick={() => {
            if (showUserList) {
              setShowUserList(false);
            } else {
              setShowSettings(false);
              setShowThreads(false);
              setShowInfo(false);
              setShowUserList(true);
            }
          }}
          active={showUserList}
          color={showUserList ? 'primary' : 'secondary'}
          title="참여자 목록"
        >
          <IconUsers size={20} />
        </IconButton>
        <IconButton
          onClick={() => {
            if (showSettings) {
              setShowSettings(false);
            } else {
              setShowUserList(false);
              setShowThreads(false);
              setShowInfo(false);
              setShowSettings(true);
            }
          }}
          active={showSettings}
          color={showSettings ? 'primary' : 'secondary'}
          title="설정"
        >
          <IconSettings size={20} />
        </IconButton>
      </Stack>
    </Paper>
  );
};
