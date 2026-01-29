import { Box } from '@/ui-components/Layout/Box';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconX } from '@tabler/icons-preact';
import { List, ListItem, ListItemText, ListItemAvatar } from '@/ui-components/List/List';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import type { ChatUser } from '../types';

interface ChatMemberPanelProps {
  members?: ChatUser[];
  onClose: () => void;
}

export const ChatMemberPanel = ({ members = [], onClose }: ChatMemberPanelProps) => {
  return (
    <Paper
      elevation={0}
      square
      padding="none"
      className="chat-app__sidebar-panel"
    >
      <Box className="chat-app__sidebar-panel__header">
        <Typography variant="h4">참여자 ({members.length})</Typography>
        <IconButton onClick={onClose} size="small">
          <IconX size={18} />
        </IconButton>
      </Box>
      <Box className="chat-app__sidebar-panel__content">
        <List>
          {members.map((member) => (
            <ListItem key={member._id}>
              <ListItemAvatar>
                <Avatar
                  src={member.avatar}
                  variant="circular"
                  size="sm"
                  style={{
                    border: `2px solid ${
                      member.status === 'online' ? 'var(--color-success-main)' : 'var(--color-text-tertiary)'
                    }`,
                  }}
                >
                  {member.username.substring(0, 1).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={member.username} secondary={member.status === 'online' ? 'Online' : 'Offline'} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Paper>
  );
};
