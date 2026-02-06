import { memo, useState } from 'preact/compat';
import { useEffect } from 'preact/hooks';
import { useChatSidebar } from './hooks/useChatSidebar';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Button } from '@/ui-components/Button/Button';
import { Input } from '@/ui-components/Input/Input';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import {
  IconX,
  IconChevronDown,
  IconChevronRight,
  IconLogout,
} from '@tabler/icons-preact';
import { ProfileItem } from '../ProfileItem/ProfileItem';
import { ChatSidebarHeader } from './ChatSidebarHeader';

export const ChatSidebar = memo(() => {
  const {
    userList,
    selectedUserIds,
    toggleUserSelection,
    currentRoom,
    handleRoomSelect,
    leaveRoom,
    startDirectChat,
    handleCreateRoom,
    roomIdInput,
    setRoomIdInput,
    isSearching,
    setIsSearching,
    searchQuery,
    setSearchQuery,
    searchFocusIndex,
    allSearchResults,
    handleSearchKeyDown,
    expandedSections,
    toggleSection,
    groupedRooms,
    filteredUserList,
  } = useChatSidebar();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // 검색창이 열릴 때 자동 포커스
  useEffect(() => {
    if (isSearching) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 포커스
      setTimeout(() => {
        const inputElement = document.querySelector('#chat-sidebar-search-input') as HTMLInputElement;
        if (inputElement) {
          inputElement.focus();
        }
      }, 0);
    }
  }, [isSearching]);

  const renderRoomItem = (room: any) => {
    const isActive = currentRoom?._id === room._id;
    const isFocused = searchFocusIndex >= 0 && allSearchResults[searchFocusIndex]?.data?._id === room._id;
    const roomName = room.displayName;
    const displayAvatar = room.displayAvatar;
    const displayStatus = room.displayStatus;
    const statusText = room.displayStatusText;

    return (
      <div key={room._id} style={{ position: 'relative' }}>
        <ProfileItem
          name={roomName}
          desc={room.type === 'direct' ? statusText : room.description || room.displayStatusText}
          type={room.type}
          avatar={displayAvatar}
          status={displayStatus}
          isActive={isActive || isFocused}
          unreadCount={room.unreadCount}
          onClick={() => {
            handleRoomSelect(room._id, room);
            setIsSearching(false);
            setSearchQuery('');
          }}
          onMenuClick={(e) => {
            e.stopPropagation();
            setActiveMenuId(room._id);
          }}
        />

        {activeMenuId === room._id && (
          <Paper
            elevation={2}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px 0 16px',
              backgroundColor: 'var(--color-surface-level-1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Typography variant="body-medium" style={{ fontWeight: 600, color: 'var(--color-text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>
              {roomName}
            </Typography>
            <Flex gap="xs" align="center">
              <IconButton
                color="warning"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  leaveRoom(room._id);
                  setActiveMenuId(null);
                }}
              >
                <IconLogout size={20} />
              </IconButton>
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenuId(null);
                }}
              >
                <IconX size={16} />
              </IconButton>
            </Flex>
          </Paper>
        )}
      </div>
    );
  };

  const renderUserItem = (user: any) => {
    const isFocused = searchFocusIndex >= 0 && allSearchResults[searchFocusIndex]?.data?._id === user._id;
    return (
      <ProfileItem
        key={user._id}
        name={user.username}
        desc={`${user.status || 'offline'} • ${user.role || 'Member'}`}
        type="direct"
        avatar={user.profileImage || user.avatar}
        status={user.status}
        isActive={isFocused}
        onClick={() => {
          startDirectChat(user._id);
          setIsSearching(false);
          setSearchQuery('');
        }}
      />
    );
  };

  const renderSection = (type: keyof typeof groupedRooms, label: string) => {
    const rooms = (groupedRooms as any)[type];
    if (rooms.length === 0 && (isSearching || type !== 'direct')) return null;

    const isExpanded = expandedSections[type] !== false;

    return (
      <div key={type}>
        <div className="chat-app__sidebar-section-header" onClick={() => toggleSection(type)}>
          <span className="icon">{isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}</span>
          {label}
        </div>
        {isExpanded && <div className="chat-app__sidebar-section-content">{rooms.map(renderRoomItem)}</div>}
      </div>
    );
  };

  return (
    <div
      className="chat-app__sidebar"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}
    >
      <div className="chat-app__sidebar-header">
        <Flex align="center" justify="space-between" style={{ padding: '12px 16px' }}>
          {isSearching ? (
            <Flex align="center" style={{ flex: 1, gap: '8px' }}>
              <Input
                id="chat-sidebar-search-input"
                fullWidth
                placeholder="검색어를 입력하세요..."
                value={searchQuery}
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
                onKeyDown={(e) => {
                  // ESC 키로 검색창 닫기
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsSearching(false);
                    setSearchQuery('');
                    return;
                  }
                  handleSearchKeyDown(e as any);
                }}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                }}
                className="chat-sidebar-search-input"
              />
              <IconButton
                size="small"
                onClick={() => {
                  setIsSearching(false);
                  setSearchQuery('');
                }}
              >
                <IconX size={20} />
              </IconButton>
            </Flex>
          ) : (
            <ChatSidebarHeader
              setIsSearching={setIsSearching}
              userList={userList}
              selectedUserIds={selectedUserIds}
              toggleUserSelection={toggleUserSelection}
              handleCreateRoom={handleCreateRoom}
              roomIdInput={roomIdInput}
              setRoomIdInput={setRoomIdInput}
            />
          )}
        </Flex>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
        {isSearching && filteredUserList.length > 0 && (
          <div>
            <div className="chat-app__sidebar-section-header">사용자</div>
            <div className="chat-app__sidebar-section-content">{filteredUserList.map(renderUserItem)}</div>
          </div>
        )}
        {renderSection('direct', '개인 대화방')}
        {renderSection('team', 'Teams')}
        {renderSection('public', 'Channels')}
        {renderSection('private', 'Private Groups')}
        {renderSection('discussion', 'Discussion')}
      </div>
    </div>
  );
});
