import { useRouterState } from '@/routes/RouterState';
import { useAuth } from '@/core/hooks/useAuth';
import { useSidebarLayout } from '@/layouts/SidebarLayout/SidebarLayoutContext';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Typography } from '@/ui-components/Typography/Typography';
import { Flex } from '@/ui-components/Layout/Flex';
import {
  IconMessageCircle,
  IconBell,
  IconVideo,
  IconPalette,
  IconUsers,
  IconUser,
  IconChevronRight
} from '@tabler/icons-preact';
import './MobileSidebar.scss';

export function MobileSidebar() {
  const { pathname, navigate } = useRouterState();
  const { user } = useAuth();
  const { closeMobileSidebar } = useSidebarLayout();

  const menuItems = [
    { id: 'chatapp', label: '채팅', path: '/chatapp', icon: <IconMessageCircle size={24} /> },
    { id: 'notification', label: '알림', path: '/notification', icon: <IconBell size={24} /> },
    { id: 'video-meeting', label: '회의', path: '/video-meeting', icon: <IconVideo size={24} /> },
    { id: 'settings', label: '테마', path: '/settings', icon: <IconPalette size={24} /> },
    { id: 'workspace', label: '워크스페이스', path: '/workspace', icon: <IconUsers size={24} /> },
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
    closeMobileSidebar();
  };

  return (
    <div className="mobile-sidebar">
      {/* 프로필 영역 */}
      <div className="mobile-sidebar__profile" onClick={() => handleNavigate('/profile')}>
        <Flex align="center" gap="md">
          <Avatar
            src={user?.profileImage}
            size="lg"
            variant="circular"
            style={{ backgroundColor: 'var(--color-interactive-primary)' }}
          >
            {user?.username?.substring(0, 1).toUpperCase() || <IconUser size={24} />}
          </Avatar>
          <div className="mobile-sidebar__profile-info">
            <Typography variant="h3" style={{ fontWeight: 600 }}>
              {user?.username || '사용자'}
            </Typography>
            <Typography variant="body-small" color="text-secondary">
              내 프로필 보기
            </Typography>
          </div>
          <IconChevronRight size={20} style={{ marginLeft: 'auto', color: 'var(--color-text-secondary)' }} />
        </Flex>
      </div>

      <div className="mobile-sidebar__divider" />

      {/* 메뉴 리스트 */}
      <nav className="mobile-sidebar__nav">
        {menuItems.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <button
              key={item.id}
              className={`mobile-sidebar__item ${isActive ? 'mobile-sidebar__item--active' : ''}`}
              onClick={() => handleNavigate(item.path)}
            >
              <span className="mobile-sidebar__item-icon">{item.icon}</span>
              <span className="mobile-sidebar__item-label">{item.label}</span>
              {isActive && <div className="mobile-sidebar__item-active-indicator" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
