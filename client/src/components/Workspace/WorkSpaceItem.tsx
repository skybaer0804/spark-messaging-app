import { memo } from 'preact/compat';
import { Typography } from '@/components/ui/typography';
import { Box, Flex } from '@/components/ui/layout';
import { IconChevronRight } from '@tabler/icons-preact';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';

interface WorkSpaceItemProps {
  id: string;
  name: string;
  description?: string;
  color?: string;
  initials?: string;
  onClick?: () => void;
  className?: string;
  active?: boolean;
}

export const WorkSpaceItem = memo(
  ({ name, description, color, initials, onClick, className = '', active = false }: WorkSpaceItemProps) => {
    return (
      <Box
        onClick={onClick}
        className={cn(
          'p-4 bg-card rounded-xl border border-border flex items-center gap-4 cursor-pointer transition-all duration-200',
          'hover:bg-muted/30 hover:shadow-sm hover:border-primary/20',
          active && 'ring-2 ring-primary/20 border-primary bg-primary/5',
          className,
        )}
      >
        <Avatar
          className="w-10 h-10 text-sm font-bold shadow-sm"
          style={{ backgroundColor: color || 'var(--primary)' }}
        >
          {initials || name.substring(0, 1).toUpperCase()}
        </Avatar>
        <Box className="flex-1 min-w-0 space-y-0.5">
          <Typography variant="body-medium" fontWeight="bold" className="truncate text-foreground">
            {name}
          </Typography>
          <Typography variant="caption" className="truncate block text-muted-foreground opacity-80">
            {description || '워크스페이스 설명이 없습니다.'}
          </Typography>
        </Box>
        <IconChevronRight
          size={20}
          className={cn(
            'text-muted-foreground/50 transition-transform group-hover:translate-x-0.5',
            active && 'text-primary',
          )}
        />
      </Box>
    );
  },
);
