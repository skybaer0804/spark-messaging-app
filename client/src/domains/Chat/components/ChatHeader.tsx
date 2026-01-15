import { Paper } from '@/ui-components/Paper/Paper';
import { Stack } from '@/ui-components/Layout/Stack';
import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconButton } from '@/ui-components/Button/IconButton';
import {
  IconLock,
  IconHash,
  IconArrowLeft,
  IconVideo,
  IconUsers,
  IconSettings,
  IconBug,
  IconBugOff,
} from '@tabler/icons-preact';
import { ChatRoom } from '../types';
import { getDirectChatName } from '../utils/chatUtils';

interface ChatHeaderProps {
  currentRoom: ChatRoom;
  currentUser: any;
  isMobile: boolean;
  onGoToHome: () => void;
  onShowUserList: () => void;
  onShowSettings: () => void;
  onToggleDebug: () => void;
  showUserList: boolean;
  debugEnabled: boolean;
  onVideoMeeting: () => void;
}

export function ChatHeader({
  currentRoom,
  currentUser,
  isMobile,
  onGoToHome,
  onShowUserList,
  onShowSettings,
  onToggleDebug,
  showUserList,
  debugEnabled,
  onVideoMeeting,
}: ChatHeaderProps) {
  return (
    <Paper
      square
      elevation={1}
      padding="sm"
      style={{ zIndex: 10, flexShrink: 0, borderBottom: '1px solid var(--color-border-default)' }}
    >
      <Stack direction="row" align="center" spacing="md">
        {isMobile && (
          <IconButton onClick={onGoToHome}>
            <IconArrowLeft />
          </IconButton>
        )}
        <Box style={{ flex: 1 }}>
          <Flex align="center" gap="sm">
            {currentRoom.type === 'private' || currentRoom.isPrivate ? <IconLock size={20} /> : <IconHash size={20} />}
            <Typography variant="h3" style={{ fontWeight: 800 }}>
              {currentRoom.displayName || getDirectChatName(currentRoom, currentUser?.id || (currentUser as any)?._id)}
            </Typography>
          </Flex>
          {currentRoom.description && (
            <Typography variant="caption" color="text-secondary" style={{ marginLeft: '24px' }}>
              {currentRoom.description}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onVideoMeeting} title="화상회의">
          <IconVideo size={20} />
        </IconButton>
        <IconButton onClick={onShowUserList} color={showUserList ? 'primary' : 'secondary'} title="참여자 목록">
          <IconUsers size={20} />
        </IconButton>
        <IconButton onClick={onShowSettings} color="secondary" title="설정">
          <IconSettings size={20} />
        </IconButton>
        <IconButton onClick={onToggleDebug} color={debugEnabled ? 'primary' : 'secondary'} title="디버그 모드 토글">
          {debugEnabled ? <IconBug size={20} /> : <IconBugOff size={20} />}
        </IconButton>
      </Stack>
    </Paper>
  );
}
