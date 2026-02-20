import { useMemo } from 'preact/hooks';
import { Grid, Flex } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import { Button } from '@/components/ui/button';
import { IconHash, IconEdit, IconTrash } from '@tabler/icons-preact';
import { useAuth } from '@/core/hooks/useAuth';
import { DirectoryItemCard } from '../DirectoryItemCard';
import type { ChatRoom } from '../../../types';

interface DirectoryChannelTabProps {
  roomList: ChatRoom[];
  searchTerm: string;
  onSelectChannel: (room: ChatRoom) => void;
  onEditChannel: (room: ChatRoom) => void;
  onDeleteChannel: (room: ChatRoom) => void;
}

export const DirectoryChannelTab = ({
  roomList,
  searchTerm,
  onSelectChannel,
  onEditChannel,
  onDeleteChannel,
}: DirectoryChannelTabProps) => {
  const { user } = useAuth();

  const filteredChannels = useMemo(() => {
    let result: ChatRoom[] = [];
    if (!searchTerm.trim()) {
      result = roomList.filter((r) => r.type === 'public' && r.members && r.members.length > 0);
    } else {
      const lowerQuery = searchTerm.toLowerCase();
      for (const r of roomList) {
        if (r.type === 'public' && r.members && r.members.length > 0 &&
          ((r.name || '').toLowerCase().includes(lowerQuery) ||
            (r.description && r.description.toLowerCase().includes(lowerQuery)))) {
          result.push(r);
        }
      }
    }
    return result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [roomList, searchTerm]);

  const isChannelMember = (room: ChatRoom) => {
    if (!user) return false;
    const currentUserId = (user as any).id || (user as any)._id;
    if (!currentUserId || !room.members) return false;

    return room.members.some((member) => {
      const memberId = (member as any)?._id || (member as any)?.id || member;
      return memberId && memberId.toString() === currentUserId.toString();
    });
  };

  const isChannelOwner = (room: ChatRoom) => {
    if (!user) return false;
    const currentUserId = (user as any).id || (user as any)._id;
    if (!currentUserId) return false;

    if (room.createdBy) {
      if (typeof room.createdBy === 'string') {
        return room.createdBy === currentUserId.toString();
      }
      const creatorId = (room.createdBy as any)?._id || (room.createdBy as any)?.id;
      return creatorId && creatorId.toString() === currentUserId.toString();
    }

    // Fallback
    if (room.members && room.members.length > 0) {
      const firstMember = room.members[0];
      const firstMemberId = (firstMember as any)?._id || (firstMember as any)?.id || firstMember;
      return firstMemberId && firstMemberId.toString() === currentUserId.toString();
    }

    return false;
  };

  if (filteredChannels.length === 0) {
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
      {filteredChannels.map((room) => {
        const isOwner = isChannelOwner(room);
        const isMember = isChannelMember(room);
        return (
          <Grid item key={room._id} xs={4} sm={2} md={1}>
            <DirectoryItemCard
              title={room.name || '채널'}
              description={room.description}
              icon={<IconHash size={20} />}
              color={room.isPrivate || room.type === 'private' ? '#E73C7E' : '#509EE3'}
              onClick={() => onSelectChannel(room)}
              memberCount={room.members?.length}
              isPrivate={room.isPrivate || room.type === 'private'}
              badge={isMember ? '참여 중' : '참여 가능'}
              actions={
                isOwner ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="directory-card__action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditChannel(room);
                      }}
                    >
                      <IconEdit size={14} />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="directory-card__action-btn directory-card__action-btn--delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteChannel(room);
                      }}
                    >
                      <IconTrash size={14} />
                    </Button>
                  </>
                ) : null
              }
            />
          </Grid>
        );
      })}
    </Grid>
  );
};
