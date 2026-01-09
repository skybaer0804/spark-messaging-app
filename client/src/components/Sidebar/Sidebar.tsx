import { useMemo, useState } from 'preact/hooks';
import { IconSparkles, IconPlus } from '@tabler/icons-preact';
import { useRouterState } from '@/routes/RouterState';
import { appRoutes, type AppRouteNode } from '@/routes/appRoutes';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { useAuth } from '@/core/hooks/useAuth';
import './Sidebar.scss';

export function Sidebar() {
  const { pathname, navigate } = useRouterState();
  const { user } = useAuth();

  const lnbRouteIds = ['chatapp', 'notification', 'video-meeting'];

  const lnbRoutes = useMemo(() => {
    return lnbRouteIds.map((id) => appRoutes.find((r) => r.id === id)).filter(Boolean) as AppRouteNode[];
  }, []);

  // 가상의 워크스페이스 목록
  const workspaces = [
    { id: '1', name: 'Spark', initials: 'S', color: '#4f46e5' },
    { id: '2', name: 'Development', initials: 'D', color: '#10b981' },
    { id: '3', name: 'DevStudy', initials: 'DS', color: '#f59e0b' },
  ];

  const [activeOrg, setActiveOrg] = useState(workspaces[0].id);

  return (
    <aside className="lnb">
      <div className="lnb__container">
        {/* 2.2.0: 사용자 프로필 (상단 배치) */}
        <div className="lnb__user">
          <Avatar src={user?.profileImage} size="sm" className="lnb__user-avatar" title={user?.username}>
            {user?.username?.substring(0, 1)}
          </Avatar>
          <div className="lnb__user-status lnb__user-status--online" />
        </div>

        <div className="lnb__divider" />

        {/* 워크스페이스 목록 (Column 1) */}
        <div className="lnb__workspaces">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className={`lnb__workspace-item ${activeOrg === ws.id ? 'lnb__workspace-item--active' : ''}`}
              onClick={() => setActiveOrg(ws.id)}
              title={ws.name}
            >
              <div className="lnb__workspace-icon" style={{ backgroundColor: ws.color }}>
                {ws.initials}
              </div>
            </div>
          ))}
          <button className="lnb__add-workspace" title="Add workspace">
            <IconPlus size={20} />
          </button>
        </div>

        <div className="lnb__divider" />

        {/* 메인 메뉴 아이콘들 */}
        <nav className="lnb__nav">
          {lnbRoutes.map((route) => {
            const isActive = pathname.startsWith(route.path) && (route.path !== '/' || pathname === '/');
            return (
              <button
                key={route.id}
                type="button"
                className={`lnb__item ${isActive ? 'lnb__item--active' : ''}`}
                onClick={() => navigate(route.path)}
                title={route.label}
              >
                <div className="lnb__item-icon">{route.icon}</div>
              </button>
            );
          })}
        </nav>

        {/* 하단 로고 */}
        <div className="lnb__footer">
          <div className="lnb__logo" onClick={() => navigate('/')} title="Spark Messaging">
            <IconSparkles size={24} />
          </div>
        </div>
      </div>
    </aside>
  );
}
