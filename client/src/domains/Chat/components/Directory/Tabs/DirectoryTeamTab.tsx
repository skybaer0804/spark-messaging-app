import { useState, useEffect, useMemo } from 'preact/hooks';
import { Grid } from '@/ui-components/Layout/Grid';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { Button } from '@/ui-components/Button/Button';
import { IconUsers, IconEdit, IconTrash } from '@tabler/icons-preact';
import { teamApi } from '@/core/api/ApiService';
import { currentWorkspaceId } from '@/stores/chatRoomsStore';
import { useAuth } from '@/core/hooks/useAuth';
import { DirectoryItemCard } from '../DirectoryItemCard';
import type { ChatUser } from '../../../types';

interface Team {
  _id: string;
  teamName: string;
  teamDesc?: string;
  private: boolean;
  members: (ChatUser & { role?: string })[];
  createdBy: ChatUser;
  createdAt: string;
}

interface DirectoryTeamTabProps {
  searchTerm: string;
  onSelectTeam: (team: Team) => void;
  onEditTeam: (team: Team) => void;
  onDeleteTeam: (team: Team) => void;
}

export const DirectoryTeamTab = ({
  searchTerm,
  onSelectTeam,
  onEditTeam,
  onDeleteTeam,
}: DirectoryTeamTabProps) => {
  const { user } = useAuth();
  const [teamList, setTeamList] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentWorkspaceId.value) {
      setIsLoading(true);
      teamApi
        .getTeams(currentWorkspaceId.value)
        .then((response) => {
          setTeamList(response.data);
        })
        .catch((error) => {
          console.error('Failed to load teams:', error);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [currentWorkspaceId.value]);

  const filteredTeams = useMemo(() => {
    const result = teamList.filter(
      (t) =>
        t.members && t.members.length > 0 &&
        (t.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (t.teamDesc && t.teamDesc.toLowerCase().includes(searchTerm.toLowerCase()))),
    );
    return result.sort((a, b) => (a.teamName || '').localeCompare(b.teamName || ''));
  }, [teamList, searchTerm]);

  const isTeamOwner = (team: Team) => {
    if (!user) return false;
    const currentUserId = (user as any).id || (user as any)._id;
    if (!currentUserId) return false;

    if (team.createdBy && typeof team.createdBy === 'object' && team.createdBy !== null) {
      const createdById = (team.createdBy as any)?._id || (team.createdBy as any)?.id;
      return createdById && createdById.toString() === currentUserId.toString();
    }

    if (typeof team.createdBy === 'string') {
      return team.createdBy === currentUserId.toString();
    }

    return false;
  };

  const isTeamMember = (team: Team) => {
    if (!user) return false;
    const currentUserId = (user as any).id || (user as any)._id;
    return team.members?.some((m) => {
      const memberId = (m as any)._id || m;
      return memberId.toString() === currentUserId.toString();
    });
  };

  if (isLoading) {
    return (
      <Flex align="center" justify="center" style={{ padding: '64px' }}>
        <Typography variant="body-medium">팀 목록을 불러오는 중...</Typography>
      </Flex>
    );
  }

  if (filteredTeams.length === 0) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ padding: '64px', width: '100%' }}>
        <Typography variant="h4" color="text-secondary">
          {searchTerm ? '검색 결과가 없습니다.' : '생성된 팀이 없습니다.'}
        </Typography>
        {!searchTerm && (
          <Typography variant="body-medium" color="text-secondary">
            새로운 프로젝트 팀을 만들어보세요.
          </Typography>
        )}
      </Flex>
    );
  }

  return (
    <Grid container spacing={2} columns={4}>
      {filteredTeams.map((team) => {
        const isOwner = isTeamOwner(team);
        const isMember = isTeamMember(team);
        return (
          <Grid item key={team._id} xs={4} sm={2} md={1}>
            <DirectoryItemCard
              title={team.teamName}
              description={team.teamDesc}
              icon={<IconUsers size={20} />}
              color={team.private ? '#E73C7E' : '#23D5AB'}
              onClick={() => onSelectTeam(team)}
              memberCount={team.members?.length}
              isPrivate={team.private}
              badge={
                isMember ? `${team.private ? '비공개' : '공개'} · 참여 중` : team.private ? '비공개' : '공개'
              }
              actions={
                isOwner ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="directory-card__action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTeam(team);
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
                        onDeleteTeam(team);
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
