import { Flex, Box } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import { IconMenu2 } from '@tabler/icons-preact';
import { useSidebarLayout } from '@/layouts/SidebarLayout/SidebarLayoutContext';
import { IconButton } from '@/components/ui/icon-button';
import { Paper } from '@/components/ui/paper';
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
        paddingTop: 'calc(var(--space-gap-sm) + var(--safe-area-inset-top))',
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
