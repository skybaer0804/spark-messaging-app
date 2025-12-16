import type { ComponentChildren, JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import {
  IconSparkles,
  IconPin,
  IconPinFilled,
} from '@tabler/icons-react';
import { Flex } from '@/ui-component/Layout/Flex';
import { Typography } from '@/ui-component/Typography/Typography';
import { List, ListItem, ListItemText } from '@/ui-component/List/List';
import { IconButton } from '@/ui-component/Button/IconButton';
import { useTheme } from '@/context/ThemeProvider';
import { appRoutes, type AppRouteNode } from '@/routes/appRoutes';
import { useRouterState } from '@/routes/RouterState';
import './Sidebar.scss';

function NavLink(props: {
  to: string;
  className?: string;
  onMouseEnter?: JSX.MouseEventHandler<HTMLAnchorElement>;
  children: ComponentChildren;
}) {
  const { navigate } = useRouterState();
  return (
    <a
      href={props.to}
      className={props.className}
      onMouseEnter={props.onMouseEnter}
      onClick={(e) => {
        e.preventDefault();
        navigate(props.to);
      }}
    >
      {props.children}
    </a>
  );
}

export function Sidebar() {
  const { sidebarConfig, setSidebarConfig } = useTheme();
  const { pathname } = useRouterState();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [flyoutMainId, setFlyoutMainId] = useState<string | null>(null);

  const { miniDrawer, pinned, submenuPinned } = sidebarConfig;
  const isExpanded = pinned || (!miniDrawer && !pinned) || (miniDrawer && isSidebarHovered);

  const mainRoutes = useMemo(() => appRoutes, []);

  const activeMainRoute: AppRouteNode | undefined = useMemo(() => {
    if (pathname.startsWith('/design-system')) return mainRoutes.find((r) => r.id === 'design-system');
    return mainRoutes.find((r) => pathname === r.path);
  }, [mainRoutes, pathname]);

  const flyoutRoute: AppRouteNode | undefined = useMemo(() => {
    if (flyoutMainId) return mainRoutes.find((r) => r.id === flyoutMainId);
    if (submenuPinned) return activeMainRoute?.children ? activeMainRoute : mainRoutes.find((r) => r.id === 'design-system');
    return undefined;
  }, [activeMainRoute, flyoutMainId, mainRoutes, submenuPinned]);

  const handleTogglePin = () => {
    setSidebarConfig({ pinned: !pinned });
  };

  const handleToggleSubmenuPin = () => {
    setSidebarConfig({ submenuPinned: !submenuPinned });
  };

  const handleSidebarMouseLeave = () => {
    setIsSidebarHovered(false);
    if (!submenuPinned) setFlyoutMainId(null);
  };

  const handleMainItemHover = (routeId: string, hasChildren: boolean) => {
    if (!hasChildren) {
      if (!submenuPinned) setFlyoutMainId(null);
      return;
    }
    setFlyoutMainId(routeId);
  };

  return (
    <aside
      className={`sidebar ${miniDrawer ? 'sidebar--mini' : ''} ${isExpanded ? 'sidebar--expanded' : ''}`}
      onMouseEnter={() => setIsSidebarHovered(true)}
      onMouseLeave={handleSidebarMouseLeave}
    >
      <div className="sidebar__container">
        {/* 상단 헤더 */}
        <div className="sidebar__header">
          {isExpanded && (
            <Flex align="center" gap="sm" style={{ flex: 1 }}>
              <div className="sidebar__logo">
                <IconSparkles size={24} />
              </div>
              <Typography variant="body-large" className="sidebar__header-title">
                Spark
              </Typography>
            </Flex>
          )}
          {!isExpanded && (
            <div className="sidebar__logo sidebar__logo--centered">
              <IconSparkles size={24} />
            </div>
          )}
          <div className="sidebar__header-actions">
            {isExpanded && (
              <IconButton
                size="small"
                color="default"
                onClick={handleTogglePin}
                title={pinned ? '고정 해제' : '고정'}
                className="sidebar__pin-button"
              >
                {pinned ? <IconPinFilled size={18} /> : <IconPin size={18} />}
              </IconButton>
            )}
          </div>
        </div>

        {/* 메인 네비게이션 */}
        <nav className="sidebar__nav">
          <List disablePadding>
            {mainRoutes.map((r) => {
              const isActive = activeMainRoute?.id === r.id;
              const hasChildren = !!r.children?.length;
              return (
                <NavLink
                  key={r.id}
                  to={r.path}
                  className={`sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`}
                  onMouseEnter={() => handleMainItemHover(r.id, hasChildren)}
                >
                  <ListItem
                    className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
                    disableGutters
                  >
                    {miniDrawer && !isExpanded ? (
                      <div className="sidebar__nav-item-mini">
                        <div className="sidebar__nav-item-icon">{r.icon}</div>
                        <Typography variant="body-small" className="sidebar__nav-item-label">
                          {r.label}
                        </Typography>
                      </div>
                    ) : (
                      <>
                        <div className="sidebar__nav-item-icon">{r.icon}</div>
                        <ListItemText primary={r.label} />
                      </>
                    )}
                  </ListItem>
                </NavLink>
              );
            })}
          </List>
        </nav>
      </div>

      {/* 2차 메뉴 플라이아웃 */}
      {!!flyoutRoute?.children?.length && (submenuPinned || isSidebarHovered) && (
        <aside className="sidebar__flyout" onMouseEnter={() => setIsSidebarHovered(true)}>
          <div className="sidebar__flyout-header">
            <Typography variant="body-large" className="sidebar__flyout-title">
              {flyoutRoute.label}
            </Typography>
            <IconButton
              size="small"
              color="default"
              onClick={handleToggleSubmenuPin}
              title={submenuPinned ? '2차 메뉴 고정 해제' : '2차 메뉴 고정'}
              className="sidebar__flyout-pin-button"
            >
              {submenuPinned ? <IconPinFilled size={18} /> : <IconPin size={18} />}
            </IconButton>
          </div>
          <div className="sidebar__flyout-body">
            <List disablePadding>
              {flyoutRoute.children.map((c) => {
                const isActive = pathname === c.path;
                return (
                  <NavLink
                    key={c.id}
                    to={c.path}
                    className={`sidebar__flyout-link ${isActive ? 'sidebar__flyout-link--active' : ''}`}
                  >
                    <ListItem className="sidebar__flyout-item" disableGutters>
                      <ListItemText primary={c.label} />
                    </ListItem>
                  </NavLink>
                );
              })}
            </List>
          </div>
        </aside>
      )}
    </aside>
  );
}
