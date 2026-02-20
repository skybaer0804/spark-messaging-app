import { useMemo, useEffect } from 'preact/hooks';
import { memo } from 'preact/compat';
import { IconSparkles, IconUser, IconPalette } from '@tabler/icons-preact';
import { useRouterState } from '@/routes/RouterState';
import { appRoutes, type AppRouteNode } from '@/routes/appRoutes';
import { currentWorkspaceId, setCurrentWorkspaceId, totalUnreadCount, workspacesList } from '@/stores/chatRoomsStore';
import { workspaceApi } from '@/core/api/ApiService';
import { useAuth } from '@/core/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import './Sidebar.scss';

// v2.4.0: 뱃지 렌더링 최적화를 위한 개별 컴포넌트 분리
const NavItem = memo(({ route, isActive, onClick }: { route: AppRouteNode; isActive: boolean; onClick: () => void }) => {
  const isChat = route.id === 'chatapp';
  const unread = totalUnreadCount.value;

  return (
    <button
      type="button"
      className={`lnb__item ${isActive ? 'lnb__item--active' : ''}`}
      onClick={onClick}
      title={route.label}
    >
      <div className="lnb__item-icon">
        {isChat && unread > 0 ? (
          <Badge badgeContent={unread} color="error">
            {route.icon}
          </Badge>
        ) : (
          route.icon
        )}
      </div>
    </button>
  );
});

export const Sidebar = memo(() => {
  const { pathname, navigate } = useRouterState();
  const { user } = useAuth();
  const workspaces = workspacesList.value;

  // Set으로 최적화: O(n) find() 반복 대신 Map 사용
  const lnbRouteIds = useMemo(() => new Set(['chatapp', 'video-meeting', 'notification']), []);

  const lnbRoutes = useMemo(() => {
    // 단일 루프로 최적화
    const result: AppRouteNode[] = [];
    for (const route of appRoutes) {
      if (lnbRouteIds.has(route.id)) {
        result.push(route);
      }
    }
    return result;
  }, [lnbRouteIds]);

  const fetchWorkspaces = async () => {
    try {
      const res = await workspaceApi.getWorkspaces();
      workspacesList.value = res.data;
      if (res.data.length > 0 && !currentWorkspaceId.value) {
        setCurrentWorkspaceId(res.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWorkspaces();
    }
  }, [user]);

  const activeWorkspaceId = currentWorkspaceId.value;

  return (
    <aside className="lnb">
      <div className="lnb__container">
        {/* 2.2.0: 홈 아이콘 (상단 배치) */}
        <div className="lnb__header">
          <div
            className={`lnb__workspace-item ${pathname === '/' ? 'lnb__workspace-item--active' : ''}`}
            onClick={() => navigate('/')}
            title="Home"
          >
            <div className="lnb__logo">
              <IconSparkles size={28} />
            </div>
          </div>
        </div>

        <div className="lnb__divider" />

        {/* 워크스페이스 목록 (Column 1) - 현재 활성화된 것만 표시 */}
        <div className="lnb__workspaces">
          {workspaces
            .filter((ws) => ws._id === activeWorkspaceId)
            .map((ws) => (
              <div
                key={ws._id}
                className="lnb__workspace-item lnb__workspace-item--active"
                onClick={() => navigate('/workspace')}
                title={ws.name}
              >
                <div className="lnb__workspace-icon" style={{ backgroundColor: ws.color }}>
                  {ws.initials || ws.name.substring(0, 1).toUpperCase()}
                </div>
              </div>
            ))}
        </div>

        <div className="lnb__divider" />

        {/* 메인 메뉴 아이콘들 */}
        <nav className="lnb__nav">
          {lnbRoutes.map((route) => (
            <NavItem
              key={route.id}
              route={route}
              isActive={pathname.startsWith(route.path) && (route.path !== '/' || pathname === '/')}
              onClick={() => navigate(route.path)}
            />
          ))}
        </nav>

        <div className="lnb__divider" />

        <div className="lnb__footer">
          <div
            className={`lnb__workspace-item ${pathname.startsWith('/profile') ? 'lnb__workspace-item--active' : ''}`}
            onClick={() => navigate('/profile')}
            title="Profile"
          >
            <Avatar
              src={user?.profileImage}
              variant="circular"
              size="lg"
              className="lnb__workspace-icon lnb__workspace-icon--profile"
              style={{ backgroundColor: 'var(--color-interactive-primary)' }}
            >
              {user?.username?.substring(0, 1).toUpperCase() || <IconUser size={24} />}
            </Avatar>
          </div>
        </div>
      </div>
    </aside>
  );
});

