import { Paper } from '@/ui-components/Paper/Paper';
import { Flex } from '@/ui-components/Layout/Flex';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconLock } from '@tabler/icons-preact';

interface DirectoryItemCardProps {
  title: string;
  description?: string;
  icon?: any;
  color?: string;
  onClick?: () => void;
  actions?: any;
  badge?: string;
  memberCount?: number;
  isPrivate?: boolean;
}

export const DirectoryItemCard = ({
  title,
  description,
  icon,
  color,
  onClick,
  actions,
  badge,
  memberCount,
  isPrivate = false,
}: DirectoryItemCardProps) => (
  <Paper
    className="directory-card"
    elevation={0}
    onClick={onClick}
    style={
      {
        cursor: onClick ? 'pointer' : 'default',
        '--app-color': color || '#509EE3',
      } as any
    }
  >
    <Flex align="center" gap="sm" style={{ width: '100%' }}>
      <div
        className="directory-card__icon-box"
        style={{ backgroundColor: `${color || '#509EE3'}15`, color: color || '#509EE3', position: 'relative' }}
      >
        {icon}
        {isPrivate && (
          <div className="directory-card__private-badge">
            <IconLock size={10} stroke={3} />
          </div>
        )}
        {memberCount !== undefined && memberCount > 0 && (
          <div className="directory-card__member-badge">
            {memberCount > 99 ? '99+' : memberCount}
          </div>
        )}
      </div>

      <Stack spacing="none" className="directory-card__body" style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h4" className="directory-card__title-text">
          {title}
        </Typography>
        <Typography variant="body-small" color="text-secondary" className="directory-card__desc">
          {description || '설명이 없습니다.'}
        </Typography>
      </Stack>

      {(actions || badge) && (
        <Flex align="center" gap="sm" style={{ marginLeft: 'auto', flexShrink: 0 }}>
          {badge && <span className="directory-card__badge">{badge}</span>}
          {actions && (
            <div className="directory-card__actions" onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
          )}
        </Flex>
      )}
    </Flex>
  </Paper>
);
