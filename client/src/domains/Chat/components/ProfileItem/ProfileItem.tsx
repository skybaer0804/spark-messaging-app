import { memo } from 'preact/compat';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Typography } from '@/ui-components/Typography/Typography';
import {
  IconHash,
  IconLock,
  IconMessageCircle,
  IconHierarchy,
} from '@tabler/icons-preact';
import './ProfileItem.scss';

interface ProfileItemProps {
  name: string;
  desc?: string;
  type?: 'direct' | 'team' | 'public' | 'private' | 'discussion';
  avatar?: string;
  status?: string;
  isActive?: boolean;
  unreadCount?: number;
  onClick?: () => void;
  onContextMenu?: (e: MouseEvent) => void;
  className?: string;
  style?: any;
  styleOption?: {
    showDesc?: boolean;
    statusPosition?: 'icon' | 'name-left' | 'name-right';
    mode?: 'list' | 'chat';
    isGrouped?: boolean;
    nameSuffix?: any;
  };
}

export const ProfileItem = memo(({
  name,
  desc,
  type = 'direct',
  avatar,
  status,
  isActive,
  unreadCount,
  onClick,
  onContextMenu,
  className = '',
  style,
  styleOption = {
    showDesc: true,
    statusPosition: 'name-left',
    mode: 'list',
  },
}: ProfileItemProps) => {
  const { 
    showDesc = true, 
    statusPosition = 'name-left',
    mode = 'list',
    isGrouped = false,
    nameSuffix,
  } = styleOption;

  const getBgColor = () => {
    switch (type) {
      case 'team': return '#e11d48';
      case 'public':
      case 'private': return '#509EE3';
      case 'discussion': return '#64748b';
      default: return '#23D5AB'; // personal/direct
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'team': return <IconHierarchy size={16} />;
      case 'public': return <IconHash size={16} />;
      case 'private': return <IconLock size={16} />;
      case 'discussion': return <IconMessageCircle size={16} />;
      default: return null;
    }
  };

  const firstLetter = name?.substring(0, 1).toUpperCase();
  const typeIcon = getIcon();

  const renderStatus = (position: 'icon' | 'name-left' | 'name-right') => {
    if (type !== 'direct' || !status || statusPosition !== position) return null;
    
    return (
      <div className={`profile-item__status profile-item__status--${status} profile-item__status--pos-${position}`} />
    );
  };

  const renderTypeIcon = () => {
    if (type === 'direct' || !typeIcon) return null;
    return (
      <div className="profile-item__type-icon">
        {typeIcon}
      </div>
    );
  };

  return (
    <div
      className={`profile-item profile-item--${mode} ${isGrouped ? 'profile-item--grouped' : ''} ${isActive ? 'profile-item--active' : ''} ${className}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{ '--app-color': getBgColor(), ...style } as any}
    >
      <div className="profile-item__avatar-container">
        {!isGrouped ? (
          <Avatar src={avatar} variant="rounded" size="sm" style={{ backgroundColor: getBgColor() }}>
            {firstLetter}
          </Avatar>
        ) : (
          <div className="profile-item__avatar-placeholder" />
        )}
        {!isGrouped && renderStatus('icon')}
      </div>
      
      {!isGrouped && (
        <div className="profile-item__content">
          <div className="profile-item__name-container">
            <div className="profile-item__name-wrapper">
              {renderStatus('name-left')}
              {renderTypeIcon()}
              <Typography variant="body-medium" className="profile-item__name">
                {unreadCount ? <strong>{name}</strong> : name}
              </Typography>
              {renderStatus('name-right')}
              {nameSuffix && <div className="profile-item__name-suffix">{nameSuffix}</div>}
            </div>
            {unreadCount ? (
              <div className="profile-item__unread-badge">{unreadCount}</div>
            ) : null}
          </div>
          {showDesc && desc && (
            <Typography variant="caption" className="profile-item__desc">
              {desc}
            </Typography>
          )}
        </div>
      )}
    </div>
  );
});
