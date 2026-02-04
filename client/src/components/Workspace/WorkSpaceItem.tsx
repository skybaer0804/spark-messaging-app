import { memo } from 'preact/compat';
import { Typography } from '@/ui-components/Typography/Typography';
import { Box } from '@/ui-components/Layout/Box';
import { IconChevronRight } from '@tabler/icons-preact';
import './WorkSpaceItem.scss';

interface WorkSpaceItemProps {
  id: string;
  name: string;
  description?: string;
  color?: string;
  initials?: string;
  onClick?: () => void;
  className?: string;
}

export const WorkSpaceItem = memo(({
  name,
  description,
  color,
  initials,
  onClick,
  className = '',
}: WorkSpaceItemProps) => {
  return (
    <Box
      onClick={onClick}
      className={`workspace-item ${className}`}
    >
      <div
        className="workspace-item__avatar"
        style={{ backgroundColor: color || 'var(--color-interactive-primary)' }}
      >
        {initials || name.substring(0, 1).toUpperCase()}
      </div>
      <Box className="workspace-item__content">
        <Typography variant="body-medium" className="workspace-item__name">
          {name}
        </Typography>
        <Typography variant="caption" className="workspace-item__desc">
          {description || '워크스페이스 설명이 없습니다.'}
        </Typography>
      </Box>
      <IconChevronRight size={18} className="workspace-item__chevron" />
    </Box>
  );
});
