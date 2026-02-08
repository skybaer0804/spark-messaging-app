import { memo } from 'preact/compat';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Typography } from '@/ui-components/Typography/Typography';
import {
  IconHash,
  IconLock,
  IconMessageCircle,
  IconHierarchy,
  IconX,
  IconDots,
} from '@tabler/icons-preact';
import { RoomType } from '../../types/ChatRoom';
import './ProfileItem.scss';

interface ProfileItemProps {
  name: string;
  desc?: string;
  type?: RoomType | 'private'; // 'private'는 하위 호환성을 위해 유지
  isPrivate?: boolean;
  avatar?: string;
  status?: string;
  isActive?: boolean;
  unreadCount?: number;
  onClick?: () => void;
  onDelete?: (e: MouseEvent) => void;
  onContextMenu?: (e: MouseEvent) => void;
  onMenuClick?: (e: MouseEvent) => void;
  className?: string;
  style?: any;
  styleOption?: {
    showDesc?: boolean;
    statusPosition?: 'icon' | 'name-left' | 'name-right';
    mode?: 'list' | 'chat' | 'chip';
    isGrouped?: boolean;
    nameSuffix?: any;
    noHover?: boolean;
  };
}

export const ProfileItem = memo(({
  name,
  desc,
  type = 'direct',
  isPrivate = false,
  avatar,
  status,
  isActive,
  unreadCount,
  onClick,
  onDelete,
  onMenuClick,
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
    noHover = false,
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
      case 'public': 
      case 'private': return <IconHash size={16} />;
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
    const isReallyPrivate = isPrivate || (type as any) === 'private';
    
    return (
      <div className="profile-item__type-icon">
        {typeIcon}
        {isReallyPrivate && (
          <div className="profile-item__type-icon-badge">
            <IconLock size={12} stroke={3} />
          </div>
        )}
      </div>
    );
  };

  if (mode === 'chip') {
    return (
      <div
        className={`profile-item profile-item--chip ${noHover ? 'profile-item--no-hover' : ''} ${className}`}
        onClick={onClick}
        style={{ '--app-color': getBgColor(), ...style } as any}
      >
        <Avatar src={avatar} variant="rounded" size="sm" style={{ backgroundColor: getBgColor(), width: '20px', height: '20px', fontSize: '10px' }}>
          {firstLetter}
        </Avatar>
        {renderTypeIcon()}
        <span className="profile-item__name">{name}</span>
        {onDelete && (
          <div 
            className="profile-item__delete-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(e as any);
            }}
          >
            <IconX size={14} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`profile-item profile-item--${mode} ${isGrouped ? 'profile-item--grouped' : ''} ${noHover ? 'profile-item--no-hover' : ''} ${isActive ? 'profile-item--active' : ''} ${className}`}
      onClick={onClick}
      style={{ '--app-color': getBgColor(), ...style } as any}
    >
      <div className="profile-item__main-content">
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
              
              <div className="profile-item__actions">
                {unreadCount ? (
                  <div className="profile-item__unread-badge">{unreadCount}</div>
                ) : null}
                {onMenuClick && (
                  <div 
                    className="profile-item__menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMenuClick(e as any);
                    }}
                  >
                    <IconDots size={18} />
                  </div>
                )}
              </div>
            </div>
            {showDesc && desc && (
              <Typography variant="caption" className="profile-item__desc">
                {desc}
              </Typography>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
