import type { ComponentChildren } from 'preact';
import { useEffect, useMemo } from 'preact/hooks';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { BottomTab } from '@/components/BottomTab/BottomTab';
import { Content } from '@/layouts/Content/Content';
import { Drawer } from '@/ui-components/Drawer/Drawer';
import { Grid } from '@/ui-components/Layout/Grid';
import { useTheme } from '@/core/context/ThemeProvider';
import { useRouterState } from '@/routes/RouterState';
import { appRoutes, type AppRouteNode } from '@/routes/appRoutes';
import { SecondMenuDrawer } from '@/components/Sidebar/SecondMenuDrawer';
import { SidebarLayoutProvider, useSidebarLayout } from './SidebarLayoutContext';
import './SidebarLayout.scss';

interface SidebarLayoutInnerProps {
  children: ComponentChildren;
}

function SidebarLayoutInner({ children }: SidebarLayoutInnerProps) {
  const { deviceSize, sidebarConfig } = useTheme();
  const { isMobileSidebarOpen, closeMobileSidebar } = useSidebarLayout();
  const { pathname } = useRouterState();
  const { secondMenuPinned } = sidebarConfig;

  // 모바일 → PC 전환 시 Drawer가 열려있으면 자동 닫기
  useEffect(() => {
    if (deviceSize === 'pc') closeMobileSidebar();
  }, [closeMobileSidebar, deviceSize]);

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

  return (
    <div className="sidebar-layout">
      {/* 2.2.0: 글로벌 헤더 제거 - 각 도메인 내부에서 필요시 처리 */}
      <Grid
        className={`sidebar-layout__container ${
          secondMenuPinned && pinnedSecondMenuRoute ? 'sidebar-layout--with-second-menu' : ''
        }`}
        columns="var(--sidebar-layout-columns)"
        gap="none"
      >
        {/* 데스크톱: 고정 사이드바 (Column 1: Workspace/Main Icons) */}
        <aside className="sidebar-layout__sidebar" aria-label="사이드바">
          <Sidebar />
        </aside>

        {/* 고정된 2차 사이드메뉴 (Column 2: Room List or Submenu) */}
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

        {/* 메인 콘텐츠 (Column 3: Main App Area) */}
        <div className="sidebar-layout__content">
          <Content>{children}</Content>
          {/* 모바일 하단 탭바 */}
          {deviceSize === 'mobile' && <BottomTab />}
        </div>

        {/* 모바일: 오버레이 Drawer */}
        <Drawer
          open={deviceSize === 'mobile' && isMobileSidebarOpen}
          onClose={closeMobileSidebar}
          anchor="left"
          title="메뉴"
          width="var(--sidebar-width)"
          className="sidebar-layout__mobile-drawer"
        >
          <Sidebar />
        </Drawer>
      </Grid>
    </div>
  );
}

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
