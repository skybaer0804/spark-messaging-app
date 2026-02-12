import { useMemo } from 'preact/hooks';
import { Grid } from '@/ui-components/Layout/Grid';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { Button } from '@/ui-components/Button/Button';
import { IconMessageCircle, IconEdit, IconTrash } from '@tabler/icons-preact';
import { useAuth } from '@/core/hooks/useAuth';
import { DirectoryItemCard } from '../DirectoryItemCard';
import type { ChatRoom } from '../../../types';

interface DirectoryDiscussionTabProps {
  roomList: ChatRoom[];
  searchTerm: string;
  onSelectDiscussion: (room: ChatRoom) => void;
  onEditDiscussion: (room: ChatRoom) => void;
  onDeleteDiscussion: (room: ChatRoom) => void;
}

export const DirectoryDiscussionTab = ({
  roomList,
  searchTerm,
  onSelectDiscussion,
  onEditDiscussion,
  onDeleteDiscussion,
}: DirectoryDiscussionTabProps) => {
  const { user } = useAuth();

  const filteredDiscussions = useMemo(() => {
    let result: ChatRoom[] = [];
    const lowerQuery = searchTerm.toLowerCase();
    for (const r of roomList) {
      if (r.type === 'discussion' &&
        ((r.name || '').toLowerCase().includes(lowerQuery) ||
          (r.description && r.description.toLowerCase().includes(lowerQuery)))) {
        result.push(r);
      }
    }
    return result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [roomList, searchTerm]);

  const isDiscussionMember = (room: ChatRoom) => {
    if (!user) return false;
    const currentUserId = (user as any).id || (user as any)._id;
    if (!currentUserId || !room.members) return false;

    return room.members.some((member) => {
      const memberId = (member as any)?._id || (member as any)?.id || member;
      return memberId && memberId.toString() === currentUserId.toString();
    });
  };

  const isDiscussionOwner = (room: ChatRoom) => {
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

  if (filteredDiscussions.length === 0) {
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
      {filteredDiscussions.map((room) => {
        const isOwner = isDiscussionOwner(room);
        const isMember = isDiscussionMember(room);
        return (
          <Grid item key={room._id} xs={4} sm={2} md={1}>
            <DirectoryItemCard
              title={room.name || '토론'}
              description={room.description}
              icon={<IconMessageCircle size={20} />}
              color={room.isPrivate || room.type === 'private' ? '#E73C7E' : '#FF9F43'}
              onClick={() => onSelectDiscussion(room)}
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
                        onEditDiscussion(room);
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
                        onDeleteDiscussion(room);
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
