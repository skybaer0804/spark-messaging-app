import { IconButton } from '@/ui-components/Button/IconButton';
import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { IconArrowLeft, IconHash, IconLock, IconVideo, IconUsers, IconSettings, IconMessageCircle2 } from '@tabler/icons-preact';
import { useAuth } from '@/core/hooks/useAuth';
import { useToast } from '@/core/context/ToastContext';
import { getDirectChatName } from '../utils/chatUtils';
import type { ChatRoom } from '../types';

interface ChatHeaderProps {
  isMobile: boolean;
  goToHome: () => void;
  currentRoom: ChatRoom;
  showUserList: boolean;
  showSettings: boolean;
  showThreads: boolean;
  setShowUserList: (val: boolean) => void;
  setShowSettings: (val: boolean) => void;
  setShowThreads: (val: boolean) => void;
  className?: string;
}

export const ChatHeader = ({
  isMobile,
  goToHome,
  currentRoom,
  showUserList,
  showSettings,
  showThreads,
  setShowUserList,
  setShowSettings,
  setShowThreads,
  className = '',
}: ChatHeaderProps) => {
  const { user: currentUser } = useAuth();
  const { showSuccess } = useToast();

  return (
    <Paper
      square
      elevation={1}
      padding="sm"
      className={className}
      style={{ zIndex: 10, flexShrink: 0, borderBottom: '1px solid var(--color-border-default)' }}
    >
      <Stack direction="row" align="center" spacing="md">
        {isMobile && (
          <IconButton onClick={goToHome} color="secondary">
            <IconArrowLeft />
          </IconButton>
        )}
        <Box style={{ flex: 1 }}>
          <Flex align="center" gap="sm">
            {currentRoom.type === 'private' || currentRoom.isPrivate ? (
              <IconLock size={20} />
            ) : (
              <IconHash size={20} />
            )}
            <Typography variant="h4">
              {currentRoom.displayName ||
                getDirectChatName(currentRoom, currentUser?.id || (currentUser as any)?._id)}
            </Typography>
          </Flex>
          {currentRoom.description && (
            <Typography variant="caption" color="text-secondary" style={{ marginLeft: '24px' }}>
              {currentRoom.description}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={() => {
            showSuccess('준비 중입니다.');
          }}
          color="secondary"
          title="화상회의"
        >
          <IconVideo size={20} />
        </IconButton>
        <IconButton
          onClick={() => {
            if (showThreads) {
              setShowThreads(false);
            } else {
              setShowUserList(false);
              setShowSettings(false);
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
