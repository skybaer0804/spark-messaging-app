import type { ComponentChildren } from 'preact';
import { useEffect, useMemo } from 'preact/hooks';
import { memo } from 'preact/compat';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { MobileSidebar } from '@/components/Mobile/MobileSidebar';
import { Content } from '@/layouts/Content/Content';
import { Grid } from '@/components/ui/layout';
import { useTheme } from '@/core/context/ThemeProvider';
import { useRouterState } from '@/routes/RouterState';
import { appRoutes, type AppRouteNode } from '@/routes/appRoutes';
import { SecondMenuDrawer } from '@/components/Sidebar/SecondMenuDrawer';
import { SidebarLayoutProvider, useSidebarLayout } from './SidebarLayoutContext';
import './SidebarLayout.scss';

interface SidebarLayoutInnerProps {
  children: ComponentChildren;
}

const SidebarLayoutInner = memo(({ children }: SidebarLayoutInnerProps) => {
  const { deviceSize, sidebarConfig } = useTheme();
  const { isMobileSidebarOpen, closeMobileSidebar } = useSidebarLayout();
  const { pathname } = useRouterState();
  const { secondMenuPinned } = sidebarConfig;

  const isMobile = deviceSize === 'mobile';

  // 모바일 → PC 전환 시 Drawer가 열려있으면 자동 닫기
  useEffect(() => {
    if (!isMobile) closeMobileSidebar();
  }, [closeMobileSidebar, isMobile]);

  // 고정된 2차 메뉴 라우트 찾기
  const pinnedSecondMenuRoute: AppRouteNode | undefined = useMemo(() => {
    if (!secondMenuPinned) return undefined;
    const mainRoutes = appRoutes;
    const activeMainRoute = pathname.startsWith('/design-system')
      ? mainRoutes.find((r) => r.id === 'design-system')
      : mainRoutes.find((r) => pathname === r.path);
    if (activeMainRoute?.secondMenu && activeMainRoute?.children?.length) {
      return activeMainRoute;
    }
    return undefined;
  }, [pathname, secondMenuPinned]);

  // 1. 모바일 레이아웃 (Push 효과 적용)
  if (isMobile) {
    return (
      <div className="sidebar-layout">
        <aside 
          className={`sidebar-layout__mobile-sidebar ${isMobileSidebarOpen ? 'sidebar-layout__mobile-sidebar--open' : ''}`}
        >
          <MobileSidebar />
        </aside>

        <div
          className={`sidebar-layout__container ${isMobileSidebarOpen ? 'sidebar-layout__mobile-push-container--pushed' : ''} sidebar-layout__mobile-push-container`}
        >
          <div className="sidebar-layout__content">
            <Content>{children}</Content>
            {isMobileSidebarOpen && (
              <div className="sidebar-layout__mobile-overlay" onClick={closeMobileSidebar} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. PC 레이아웃 (기존 안정적인 Grid 구조)
  return (
    <div className="sidebar-layout">
      <Grid
        className={`sidebar-layout__container ${
          secondMenuPinned && pinnedSecondMenuRoute ? 'sidebar-layout--with-second-menu' : ''
        }`}
        columns="var(--sidebar-layout-columns)"
        gap="none"
      >
        <aside className="sidebar-layout__sidebar" aria-label="사이드바">
          <Sidebar />
        </aside>

        {secondMenuPinned && pinnedSecondMenuRoute && (
          <aside className="sidebar-layout__second-menu" aria-label="2차 사이드메뉴">
            <SecondMenuDrawer
              open={true}
              onClose={() => {}}
              title={pinnedSecondMenuRoute.label}
              children={pinnedSecondMenuRoute.children}
            />
          </aside>
        )}

        <div className="sidebar-layout__content">
          <Content>{children}</Content>
        </div>
      </Grid>
    </div>
  );
});

interface SidebarLayoutProps {
  children: ComponentChildren;
}

export function SidebarLayout(props: SidebarLayoutProps) {
  return (
    <SidebarLayoutProvider>
      <SidebarLayoutInner {...props} />
    </SidebarLayoutProvider>
  );
}
