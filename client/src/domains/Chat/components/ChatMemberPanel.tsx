import { Box } from '@/ui-components/Layout/Box';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconChevronLeft, IconX } from '@tabler/icons-preact';
import { List } from '@/ui-components/List/List';
import { ProfileItem } from './ProfileItem/ProfileItem';
import type { ChatUser } from '../types';
import { useTheme } from '@/core/context/ThemeProvider';

interface ChatMemberPanelProps {
  members?: ChatUser[];
  onClose: () => void;
}

export const ChatMemberPanel = ({ members = [], onClose }: ChatMemberPanelProps) => {
  const { deviceSize } = useTheme();
  const isMobile = deviceSize === 'mobile';

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
          {members.map((member) => (
            <ProfileItem
              key={member._id}
              name={member.username}
              desc={member.statusText || member.role || 'Member'}
              type="direct"
              avatar={member.avatar || member.profileImage}
              status={member.status}
              styleOption={{
                showDesc: true,
                statusPosition: 'name-left',
              }}
              style={{ margin: '2px 8px' }}
            />
          ))}
        </List>
      </Box>
    </Paper>
  );
};
