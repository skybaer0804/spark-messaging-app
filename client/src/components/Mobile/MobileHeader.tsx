import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconMenu2 } from '@tabler/icons-preact';
import { useSidebarLayout } from '@/layouts/SidebarLayout/SidebarLayoutContext';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Paper } from '@/ui-components/Paper/Paper';
import { useRouterState } from '@/routes/RouterState';
import { findRouteTitleByPath } from '@/routes/appRoutes';
import { useTheme } from '@/core/context/ThemeProvider';

export function MobileHeader() {
  const { openMobileSidebar } = useSidebarLayout();
  const { pathname } = useRouterState();
  const { deviceSize } = useTheme();
  const title = findRouteTitleByPath(pathname);

  if (deviceSize !== 'mobile') return null;

  return (
    <Paper
      square
      elevation={1}
      padding="sm"
      className="mobile-header"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--color-bg-default)',
        borderBottom: '1px solid var(--color-border-default)',
      }}
    >
      <Flex align="center" gap="xs">
        <IconButton onClick={openMobileSidebar} color="default">
          <IconMenu2 size={24} />
        </IconButton>
        
        <Typography variant="h4" style={{ fontWeight: 700, marginLeft: '4px', fontSize: '1.1rem' }}>
          {title}
        </Typography>
      </Flex>
    </Paper>
  );
}
