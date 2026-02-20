import { IconX, IconMessageCircle, IconUsers, IconHash, IconLock, IconCheck } from '@tabler/icons-preact';
import { Dialog } from '@/components/ui/dialog';
import { Flex, Grid, Box } from '@/components/ui/layout';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { useTheme } from '@/core/context/ThemeProvider';
import type { ChatRoom, ChatUser } from '../types';

interface DialogRoomInfoProps {
  open: boolean;
  onClose: () => void;
  onJoin: () => void;
  room?: ChatRoom | any; // Supports both ChatRoom and Team
  type: 'team' | 'channel' | 'discussion';
  isMember?: boolean;
}

export const DialogRoomInfo = ({
  open,
  onClose,
  onJoin,
  room,
  type,
  isMember = false,
}: DialogRoomInfoProps) => {
  const { deviceSize } = useTheme();
  const isMobile = deviceSize === 'mobile';

  if (!room) return null;

  const name = room.name || room.teamName || '정보 없음';
  const description = room.description || room.teamDesc || '설명이 없습니다.';
  const memberCount = room.members?.length || 0;
  const isPrivate = room.isPrivate || room.private || false;

  const getColor = () => {
    if (isPrivate) return '#E73C7E';
    switch (type) {
      case 'team':
        return '#23D5AB';
      case 'discussion':
        return '#FF9F43';
      default:
        return '#509EE3';
    }
  };

  const color = getColor();

  const getIcon = () => {
    switch (type) {
      case 'team':
        return <IconUsers size={24} />;
      case 'discussion':
        return <IconMessageCircle size={24} />;
      default:
        return <IconHash size={24} />;
    }
  };

  const getTypeName = () => {
    switch (type) {
      case 'team':
        return '팀';
      case 'discussion':
        return '토론';
      default:
        return '채널';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`${getTypeName()} 정보`}
      maxWidth={false}
      style={{ maxWidth: '500px' }}
      fullWidth
      className="dialog--mobile-overlay"
      actions={
        <Flex gap="sm" style={isMobile ? { width: '100%' } : {}}>
          <Button
            onClick={onClose}
            variant="secondary"
            size="sm"
            style={isMobile ? { flex: 1 } : { minWidth: '80px' }}
          >
            <Flex align="center" gap="xs" justify="center">
              <IconX size={16} />
              <span>닫기</span>
            </Flex>
          </Button>
          {!isMember && (
            <Button
              variant="primary"
              size="sm"
              onClick={onJoin}
              style={isMobile ? { flex: 1 } : { minWidth: '80px' }}
            >
              <Flex align="center" gap="xs" justify="center">
                <IconMessageCircle size={16} />
                <span>참여하기</span>
              </Flex>
            </Button>
          )}
          {isMember && (
            <Button
              variant="primary"
              size="sm"
              onClick={onJoin}
              style={isMobile ? { flex: 1 } : { minWidth: '80px' }}
            >
              <Flex align="center" gap="xs" justify="center">
                <IconCheck size={16} />
                <span>입장</span>
              </Flex>
            </Button>
          )}
        </Flex>
      }
    >
      <Box style={{ padding: '8px 0' }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Flex align="center" gap="md">
              <Box
                className="directory-card__icon-box"
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  backgroundColor: `${color}15`,
                  color: color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  flexShrink: 0,
                }}
              >
                {getIcon()}
                {isPrivate && (
                  <div className="directory-card__private-badge" style={{ width: '18px', height: '18px', bottom: '-4px', right: '-4px' }}>
                    <IconLock size={12} stroke={3} />
                  </div>
                )}
                {memberCount !== undefined && memberCount > 0 && (
                  <div className="directory-card__member-badge" style={{ minWidth: '18px', height: '18px', top: '-6px', right: '-6px', fontSize: '0.7rem' }}>
                    {memberCount > 99 ? '99+' : memberCount}
                  </div>
                )}
              </Box>
              <Box style={{ flex: 1 }}>
                <Flex align="center" gap="xs">
                  <Typography variant="h3" style={{ fontWeight: 700 }}>
                    {name}
                  </Typography>
                </Flex>
                <Typography variant="body-small" color="text-secondary">
                  멤버 {memberCount}명 · {isPrivate ? '비공개' : '공개'} {getTypeName()}
                </Typography>
              </Box>
            </Flex>
          </Grid>

          <Grid item xs={12}>
            <Box
              style={{
                padding: '16px',
                backgroundColor: 'var(--color-background-subtle)',
                borderRadius: '8px',
                border: '1px solid var(--color-border-subtle)',
              }}
            >
              <Typography
                variant="body-medium"
                style={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.6,
                }}
              >
                {description}
              </Typography>
            </Box>
          </Grid>

          {room.createdBy && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text-secondary">
                개설자:{' '}
                <span style={{ color: 'var(--color-text-primary)', fontWeight: 500 }}>
                  {typeof room.createdBy === 'string' 
                    ? room.createdBy 
                    : (room.createdBy.username || room.createdBy.name)}
                </span>
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    </Dialog>
  );
};
