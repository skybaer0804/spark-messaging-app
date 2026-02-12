import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import { memo } from 'preact/compat';
import { Paper } from '@/ui-components/Paper/Paper';
import { List } from '@/ui-components/List/List';
import { Typography } from '@/ui-components/Typography/Typography';
import { ProfileItem } from '../../ProfileItem/ProfileItem';
import { ChatUser } from '../../../types';
import { useMentionPicker } from './hooks/useMentionPicker';
import './MentionPicker.scss';

interface MentionPickerProps {
  members: ChatUser[];
  roomMembers: ChatUser[];
  search: string;
  existingMentions?: string[];
  onSelect: (user: ChatUser | 'all' | 'here') => void;
  onClose: () => void;
  anchorRef: any;
}

function MentionPickerComponent({ members, roomMembers, search, existingMentions = [], onSelect, onClose, anchorRef }: MentionPickerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const position = useMentionPicker(anchorRef, true);
  const pickerRef = useRef<HTMLDivElement>(null);

  const specialMentions: Array<{ _id: 'all' | 'here'; username: string; description: string }> = [
    { _id: 'all', username: 'all', description: '이 대화방의 모든 이에게 알림' },
    { _id: 'here', username: 'here', description: '이 대화방에 있는 활성 사용자에게 알립니다.' },
  ];

  // 1. 데이터 가공 및 정렬
  const filteredSpecial = specialMentions.filter(m => 
    m.username.toLowerCase().includes(search.toLowerCase()) && 
    !existingMentions.includes(m.username)
  );

  // v2.7.5: 멘션 리스트 중복 제거
  const uniqueMembers = useMemo(() => {
    if (!members) return [];
    const seen = new Set();
    return members.filter(m => {
      const id = m._id || (m as any).id;
      if (!id || seen.has(id.toString())) return false;
      seen.add(id.toString());
      return true;
    });
  }, [members]);

  // 방에 있는지 확인하는 헬퍼 함수
  const roomMemberIds = useMemo(() => {
    return new Set(roomMembers.map(rm => rm._id));
  }, [roomMembers]);

  const isInRoom = (userId: string) => {
    return roomMemberIds.has(userId);
  };

  const sortedMembers = useMemo(() => {
    // 검색어로 필터링 및 이미 멘션된 유저 제외
    const filtered = uniqueMembers.filter(m => 
      m.username.toLowerCase().includes(search.toLowerCase()) &&
      !existingMentions.includes(m.username)
    );

    // 정렬 로직: 방 멤버 우선 -> 이름순
    return [...filtered].sort((a, b) => {
      const aInRoom = isInRoom(a._id);
      const bInRoom = isInRoom(b._id);

      if (aInRoom && !bInRoom) return -1;
      if (!aInRoom && bInRoom) return 1;
      
      return a.username.localeCompare(b.username);
    });
  }, [members, search, isInRoom]);

  // 특수 멘션(@all, @here)은 맨 마지막에 위치
  const allItems = [...sortedMembers, ...filteredSpecial];

  useEffect(() => {
    if (pickerRef.current) {
      const listElement = pickerRef.current.querySelector('.mention-picker__list');
      const activeItem = listElement?.querySelector('.profile-item--active');
      if (activeItem) {
        activeItem.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % allItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          const item = allItems[selectedIndex];
          onSelect(item._id === 'all' || item._id === 'here' ? item._id : item as ChatUser);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, allItems, onSelect, onClose]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (pickerRef.current && !pickerRef.current.contains(target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (allItems.length === 0) return null;

  return (
    <div
      ref={pickerRef}
      className="mention-picker"
      style={{
        position: 'fixed',
        top: position.top !== undefined ? `${position.top}px` : 'auto',
        bottom: position.bottom !== undefined ? `${position.bottom}px` : 'auto',
        left: `${position.left}px`,
        width: `${position.width}px`,
        zIndex: 1100,
        visibility: position.isReady ? 'visible' : 'hidden',
      }}
    >
      <Paper elevation={8} padding="none" className="mention-picker__paper">
        <Typography variant="caption" className="mention-picker__title" style={{ display: 'block', borderBottom: '1px solid var(--color-border-default)', background: 'transparent' }}>
          사람들
        </Typography>
        <List disablePadding className="mention-picker__list">
          {allItems.map((item, index) => {
            const isSelected = index === selectedIndex;
            const isSpecial = item._id === 'all' || item._id === 'here';
            
            return (
              <ProfileItem
                key={item._id}
                className="mention-item"
                name={item.username}
                desc={isSpecial ? (item as any).description : `${(item as ChatUser).status || 'offline'} • ${(item as ChatUser).role || 'Member'}`}
                avatar={isSpecial ? undefined : (item as ChatUser).profileImage || (item as ChatUser).avatar}
                status={isSpecial ? undefined : (item as ChatUser).status || 'offline'}
                type={isSpecial ? 'discussion' : 'direct'}
                isActive={isSelected}
                onClick={() => onSelect(isSpecial ? item._id as any : item as ChatUser)}
                styleOption={{
                  showDesc: true,
                  statusPosition: 'name-left',
                  noHover: false,
                  nameSuffix: !isSpecial && !isInRoom(item._id) && (
                    <Typography variant="caption" color="error">
                      채널에 없음
                    </Typography>
                  )
                }}
                style={{
                  cursor: 'pointer',
                  borderRadius: '0',
                  margin: '0',
                  width: '100%',
                  borderBottom: index < allItems.length - 1 ? '1px solid var(--color-bg-subtle)' : 'none'
                }}
              />
            );
          })}
        </List>
      </Paper>
    </div>
  );
}

export const MentionPicker = memo(MentionPickerComponent);
