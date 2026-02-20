import { useMemo } from 'preact/hooks';
import { Grid, Flex } from '@/components/ui/layout';
import { Paper } from '@/components/ui/paper';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { IconMessageCircle } from '@tabler/icons-preact';
import { ProfileItem } from '../../ProfileItem/ProfileItem';
import type { ChatUser } from '../../../types';

interface DirectoryUserTabProps {
  userList: ChatUser[];
  searchTerm: string;
  startDirectChat: (userId: string) => void;
}

export const DirectoryUserTab = ({
  userList,
  searchTerm,
  startDirectChat,
}: DirectoryUserTabProps) => {
  const filteredUsers = useMemo(() => {
    const result = userList.filter((u) => 
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return result.sort((a, b) => (a.username || '').localeCompare(b.username || ''));
  }, [userList, searchTerm]);

  if (filteredUsers.length === 0) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ padding: '64px', width: '100%' }}>
        <Typography variant="h4" color="text-secondary">
          검색 결과가 없습니다.
        </Typography>
      </Flex>
    );
  }

  return (
    <Grid container spacing={2} columns={4}>
      {filteredUsers.map((userItem) => (
        <Grid item key={userItem._id} xs={4} sm={2} md={1}>
          <Paper
            className="directory-card"
            elevation={0}
            onClick={() => startDirectChat(userItem._id)}
            style={{ cursor: 'pointer', padding: '12px 16px' }}
          >
            <ProfileItem
              name={userItem.username}
              avatar={
                userItem.avatar ||
                userItem.profileImage ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(userItem.username)}&background=random`
              }
              status={userItem.status || 'offline'}
              desc={userItem.status === 'online' ? '온라인' : '오프라인'}
              styleOption={{
                showDesc: true,
                statusPosition: 'icon',
                mode: 'list',
                noHover: true,
                avatarSize: 40,
              }}
              style={{ margin: 0, padding: 0 }}
              actions={
                <Button
                  variant="secondary"
                  size="sm"
                  className="directory-card__action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    startDirectChat(userItem._id);
                  }}
                >
                  <IconMessageCircle size={18} />
                </Button>
              }
            />
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};
