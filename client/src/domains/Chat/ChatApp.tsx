import { useChatApp } from './hooks/useChatApp';
import { formatTimestamp } from '@/core/utils/messageUtils';
import { formatFileSize, downloadFile } from '@/core/utils/fileUtils';
import { useRef, useEffect, useState, useMemo } from 'preact/hooks';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Input } from '@/ui-components/Input/Input';
import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { List, ListItem, ListItemText, ListItemAvatar } from '@/ui-components/List/List';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Divider } from '@/ui-components/Divider/Divider';
import {
  IconArrowLeft,
  IconSend,
  IconPaperclip,
  IconX,
  IconFile,
  IconDownload,
  IconBug,
  IconBugOff,
  IconUsers,
  IconSettings,
  IconVideo,
  IconHash,
  IconLock,
  IconMessageCircle,
  IconHierarchy,
  IconChevronDown,
  IconChevronRight,
  IconHome,
  IconSearch,
  IconAddressBook,
  IconArrowsExchange,
  IconEdit,
  IconDotsVertical,
} from '@tabler/icons-preact';
import { Button } from '@/ui-components/Button/Button';
import { chatPendingJoinRoom, clearPendingJoinChatRoom } from '@/stores/chatRoomsStore';
import { useAuth } from '@/core/hooks/useAuth';
import { authApi } from '@/core/api/ApiService';
import { useToast } from '@/core/context/ToastContext';
import { ChatProvider } from './context/ChatContext';
import { ChatDataProvider } from './context/ChatDataProvider';
import { useRouterState } from '@/routes/RouterState';
import './ChatApp.scss';

import type { ChatRoom, ChatUser } from './types';
import type { Organization } from './hooks/useChatApp';

interface ChatRoomSidebarProps {
  isConnected: boolean;
  roomIdInput: string;
  setRoomIdInput: (next: string) => void;
  handleCreateRoom: (type?: ChatRoom['roomType']) => void;
  roomList: ChatRoom[];
  userList: ChatUser[];
  orgList: Organization[];
  selectedUserIds: string[];
  selectedOrgIds: string[];
  toggleUserSelection: (userId: string) => void;
  toggleOrgSelection: (orgId: string) => void;
  currentRoom: ChatRoom | null;
  handleRoomSelect: (roomId: string) => void;
  leaveRoom: () => void;
}

function ChatRoomSidebar({
  roomIdInput,
  setRoomIdInput,
  handleCreateRoom,
  roomList,
  userList,
  selectedUserIds,
  toggleUserSelection,
  currentRoom,
  handleRoomSelect,
  leaveRoom,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isConnected: _isConnected,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  orgList: _orgList,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedOrgIds: _selectedOrgIds,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toggleOrgSelection: _toggleOrgSelection,
}: ChatRoomSidebarProps) {
  const [showInviteList, setShowInviteList] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; roomId: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    DIRECT: true,
    TEAM: true,
    CHANNEL: true,
    DISCUSSION: true,
  });
  const { showInfo } = useToast();
  const { user: currentUser } = useAuth();
  const { navigate } = useRouterState();

  const handleContextMenu = (e: MouseEvent, roomId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, roomId });
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setShowCreateMenu(false);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const getDirectChatName = (room: ChatRoom) => {
    if (room.roomType !== 'DIRECT') return room.name;
    const otherMember = room.members.find((m) => m._id !== currentUser?.id);
    return otherMember ? otherMember.username : 'Unknown';
  };

  const getRoomIcon = (room: ChatRoom) => {
    switch (room.roomType) {
      case 'DIRECT':
        return null;
      case 'CHANNEL':
        return room.isPrivate ? <IconLock size={18} /> : <IconHash size={18} />;
      case 'TEAM':
        return <IconHierarchy size={18} />;
      case 'DISCUSSION':
        return <IconMessageCircle size={18} />;
      default:
        return <IconHash size={18} />;
    }
  };

  const groupedRooms = useMemo(() => {
    return {
      DIRECT: roomList.filter((r) => r.roomType === 'DIRECT'),
      TEAM: roomList.filter((r) => r.roomType === 'TEAM'),
      CHANNEL: roomList.filter((r) => r.roomType === 'CHANNEL'),
      DISCUSSION: roomList.filter((r) => r.roomType === 'DISCUSSION'),
      OTHER: roomList.filter((r) => !['DIRECT', 'TEAM', 'CHANNEL', 'DISCUSSION'].includes(r.roomType)),
    };
  }, [roomList]);

  const renderRoomItem = (room: ChatRoom) => {
    const isActive = currentRoom?._id === room._id;
    const directMember = room.roomType === 'DIRECT' ? room.members.find((m) => m._id !== currentUser?.id) : null;
    const roomName = getDirectChatName(room);

    return (
      <div
        key={room._id}
        className={`chat-app__sidebar-item ${isActive ? 'chat-app__sidebar-item--active' : ''}`}
        onClick={() => handleRoomSelect(room._id)}
        onContextMenu={(e) => handleContextMenu(e, room._id)}
      >
        <div className="avatar">
          {room.roomType === 'DIRECT' ? (
            <>
              <Avatar src={directMember?.avatar} size="sm">
                {roomName?.substring(0, 1)}
              </Avatar>
              <div className={`avatar-status avatar-status--${directMember?.status || 'offline'}`} />
            </>
          ) : (
            <Avatar
              variant="rounded"
              size="sm"
              style={{ backgroundColor: room.roomType === 'TEAM' ? '#e11d48' : '#64748b' }}
            >
              {room.roomType === 'TEAM' ? roomName?.substring(0, 1).toUpperCase() : getRoomIcon(room)}
            </Avatar>
          )}
        </div>
        <div className="chat-app__sidebar-item-content">
          <div className="chat-app__sidebar-item-name">{roomName}</div>
        </div>
      </div>
    );
  };

  const renderSection = (type: keyof typeof groupedRooms, label: string) => {
    const rooms = groupedRooms[type];
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
      {/* Top Toolbar - 이미지 기반 */}
      <div className="chat-app__sidebar-toolbar">
        <IconButton size="small" onClick={() => navigate('/')}>
          <IconHome size={20} />
        </IconButton>
        <IconButton size="small">
          <IconSearch size={20} />
        </IconButton>
        <IconButton size="small" title="디렉토리">
          <IconAddressBook size={20} />
        </IconButton>
        <IconButton size="small">
          <IconArrowsExchange size={20} />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setShowCreateMenu(!showCreateMenu);
          }}
        >
          <IconEdit size={20} />
        </IconButton>
        <IconButton size="small">
          <IconDotsVertical size={20} />
        </IconButton>
      </div>

      {/* Create Menu Dropdown */}
      {showCreateMenu && (
        <div className="chat-app__create-menu" onClick={(e) => e.stopPropagation()}>
          <div className="chat-app__create-menu-header">새로 만들기</div>
          <div
            className="chat-app__create-menu-item"
            onClick={() => {
              setShowInviteList(true);
              setShowCreateMenu(false);
            }}
          >
            <IconMessageCircle size={18} className="icon" /> 1:1 대화방
          </div>
          <div className="chat-app__create-menu-item">
            <IconMessageCircle size={18} className="icon" /> 토론
          </div>
          <div
            className="chat-app__create-menu-item"
            onClick={() => {
              handleCreateRoom('CHANNEL');
              setShowCreateMenu(false);
            }}
          >
            <IconHash size={18} className="icon" /> 채널
          </div>
          <div
            className="chat-app__create-menu-item"
            onClick={() => {
              handleCreateRoom('TEAM');
              setShowCreateMenu(false);
            }}
          >
            <IconHierarchy size={18} className="icon" /> 팀
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {renderSection('DIRECT', '개인 대화방')}
        {renderSection('TEAM', 'Teams')}
        {renderSection('CHANNEL', 'Channel')}
        {renderSection('DISCUSSION', 'Discussion')}

        {showInviteList && (
          <div
            style={{
              position: 'fixed',
              top: '10%',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2000,
              width: '90%',
              maxWidth: '500px',
            }}
          >
            <Paper elevation={4} padding="md" style={{ backgroundColor: 'var(--color-bg-default)' }}>
              <Flex justify="space-between" align="center" style={{ marginBottom: '16px' }}>
                <Typography variant="h3">New direct message</Typography>
                <IconButton onClick={() => setShowInviteList(false)}>
                  <IconX />
                </IconButton>
              </Flex>
              <Typography variant="body-small" color="text-secondary" style={{ marginBottom: '16px' }}>
                여러 사용자와 채팅을 하려고 합니다. 1:1 메시지를 사용하여 같은 대화방에 있는 모든 사람과 대화하고 싶은
                사람을 추가하십시오.
              </Typography>
              <Input
                fullWidth
                placeholder="이름 입력"
                value={roomIdInput}
                onInput={(e) => setRoomIdInput(e.currentTarget.value)}
                style={{ marginBottom: '16px' }}
              />
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
                <List>
                  {userList
                    .filter((u) => u.username.includes(roomIdInput))
                    .map((user) => (
                      <ListItem
                        key={user._id}
                        onClick={() => toggleUserSelection(user._id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <ListItemAvatar>
                          <Avatar src={user.avatar} size="sm">
                            {user.username.substring(0, 1)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={user.username} secondary={`@${user.username}`} />
                        <input type="checkbox" checked={selectedUserIds.includes(user._id)} readOnly />
                      </ListItem>
                    ))}
                </List>
              </div>
              <Flex justify="flex-end" gap="sm">
                <Button onClick={() => setShowInviteList(false)}>취소</Button>
                <Button
                  variant="primary"
                  disabled={selectedUserIds.length === 0}
                  onClick={() => {
                    handleCreateRoom(selectedUserIds.length > 1 ? 'DISCUSSION' : 'DIRECT');
                    setShowInviteList(false);
                  }}
                >
                  개설
                </Button>
              </Flex>
            </Paper>
          </div>
        )}
      </div>

      {contextMenu && (
        <Paper
          elevation={4}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000,
            padding: '4px 0',
            minWidth: '120px',
            backgroundColor: 'var(--color-bg-default)',
            border: '1px solid var(--color-border-default)',
          }}
        >
          <List style={{ padding: 0 }}>
            <ListItem
              onClick={() => {
                if (currentRoom?._id === contextMenu.roomId) {
                  leaveRoom();
                } else {
                  showInfo('해당 방에 먼저 들어가주세요.');
                }
                setContextMenu(null);
              }}
              style={{ cursor: 'pointer' }}
            >
              <ListItemText primary="방 나가기" />
            </ListItem>
          </List>
        </Paper>
      )}
    </div>
  );
}

function ChatAppContent() {
  const { pathname } = useRouterState();

  // 경로 방어 로직: /chatapp 경로가 아닐 경우 렌더링하지 않음
  // (SidebarLayout에서 content로 들어오므로 중복 노출 방지)
  if (!pathname.startsWith('/chatapp')) {
    return null;
  }

  const {
    isConnected,
    messages,
    input,
    setInput,
    roomIdInput,
    setRoomIdInput,
    currentRoom,
    roomList,
    userList,
    orgList,
    selectedUserIds,
    selectedOrgIds,
    toggleUserSelection,
    toggleOrgSelection,
    sendMessage,
    handleRoomSelect: handleRoomSelectRaw,
    handleCreateRoom,
    leaveRoom,
    sendFile,
    uploadingFile,
    uploadProgress,
    debugEnabled,
    toggleDebug,
  } = useChatApp();

  const onRoomSelect = (roomId: string) => {
    const room = roomList.find((r) => r._id === roomId);
    if (room) {
      handleRoomSelectRaw(room);
    }
  };

  // Sidebar에서 "이 룸으로 들어가기" 요청을 보내면 여기서 실제 join을 수행
  const pendingJoinRoom = chatPendingJoinRoom.value;
  useEffect(() => {
    if (!pendingJoinRoom) return;
    if (!isConnected) return;

    onRoomSelect(pendingJoinRoom);
    clearPendingJoinChatRoom();
  }, [handleRoomSelectRaw, isConnected, pendingJoinRoom, roomList]);

  const messagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageModal, setImageModal] = useState<{ url: string; fileName: string } | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useAuth();
  const { showSuccess } = useToast();

  const toggleGlobalNotifications = async (enabled: boolean) => {
    try {
      await authApi.updateNotificationSettings({ globalEnabled: enabled });
      showSuccess(`Notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages.length, currentRoom]);

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSend = async () => {
    if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        await sendFile(file);
      }
      setSelectedFiles([]);
    }
  };

  const handleFileRemove = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageClick = (imageUrl: string, fileName: string) => {
    setImageModal({ url: imageUrl, fileName });
  };

  const handleCloseImageModal = () => {
    setImageModal(null);
  };

  // --- Components Renderers ---

  // Empty State for Chat Area
  const EmptyState = () => (
    <Flex
      direction="column"
      align="center"
      justify="center"
      style={{ height: '100%', color: 'var(--color-text-tertiary)' }}
    >
      <Typography variant="h2" style={{ marginBottom: '8px' }}>
        Start Messaging
      </Typography>
      <Typography variant="body-medium">Select a room from the sidebar to join the conversation.</Typography>
    </Flex>
  );

  // 모바일에서는 깊이 구조로 뷰 전환
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!currentRoom) {
    return (
      <Box style={{ display: 'flex', height: '100%', minHeight: 0 }} className="chat-app__container">
        <Box
          style={{
            width: isMobile ? '100%' : '300px',
            flexShrink: 0,
          }}
          className="chat-app__sidebar-wrapper"
        >
          <ChatRoomSidebar
            isConnected={isConnected}
            roomIdInput={roomIdInput}
            setRoomIdInput={setRoomIdInput}
            handleCreateRoom={handleCreateRoom}
            roomList={roomList}
            userList={userList}
            orgList={orgList}
            selectedUserIds={selectedUserIds}
            selectedOrgIds={selectedOrgIds}
            toggleUserSelection={toggleUserSelection}
            toggleOrgSelection={toggleOrgSelection}
            currentRoom={currentRoom}
            handleRoomSelect={onRoomSelect}
            leaveRoom={leaveRoom}
          />
        </Box>
        {!isMobile && (
          <Box style={{ flex: 1, backgroundColor: 'var(--color-background-default)', height: '100%', minHeight: 0 }}>
            <EmptyState />
          </Box>
        )}
      </Box>
    );
  }

  // Active Chat Room - 모바일에서는 채팅창만 표시
  return (
    <Box style={{ display: 'flex', height: '100%', minHeight: 0 }} className="chat-app__container">
      {!isMobile && (
        <Box style={{ width: '300px', flexShrink: 0 }} className="chat-app__sidebar-wrapper">
          <ChatRoomSidebar
            isConnected={isConnected}
            roomIdInput={roomIdInput}
            setRoomIdInput={setRoomIdInput}
            handleCreateRoom={handleCreateRoom}
            roomList={roomList}
            userList={userList}
            orgList={orgList}
            selectedUserIds={selectedUserIds}
            selectedOrgIds={selectedOrgIds}
            toggleUserSelection={toggleUserSelection}
            toggleOrgSelection={toggleOrgSelection}
            currentRoom={currentRoom}
            handleRoomSelect={onRoomSelect}
            leaveRoom={leaveRoom}
          />
        </Box>
      )}
      <Flex
        direction="column"
        style={{
          flex: 1,
          backgroundColor: 'var(--color-background-default)',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Chat Header */}
        <Paper square elevation={1} padding="md" style={{ zIndex: 10, flexShrink: 0 }}>
          <Stack direction="row" align="center" spacing="md">
            <IconButton onClick={leaveRoom}>
              <IconArrowLeft />
            </IconButton>
            <Avatar variant="rounded">{(currentRoom.name || 'Room').substring(0, 2)}</Avatar>
            <Box style={{ flex: 1 }}>
              <Typography variant="h3">{currentRoom.name || 'Unnamed Room'}</Typography>
            </Box>
            <IconButton
              onClick={() => {
                showSuccess('화상회의를 시작합니다.');
                // VideoMeeting 도메인 연동 로직
              }}
              title="화상회의"
            >
              <IconVideo size={20} />
            </IconButton>
            <IconButton
              onClick={() => setShowUserList(!showUserList)}
              color={showUserList ? 'primary' : 'secondary'}
              title="참여자 목록"
            >
              <IconUsers size={20} />
            </IconButton>
            <IconButton onClick={() => setShowSettings(true)} color="secondary" title="설정">
              <IconSettings size={20} />
            </IconButton>
            <IconButton onClick={toggleDebug} color={debugEnabled ? 'primary' : 'secondary'} title="디버그 모드 토글">
              {debugEnabled ? <IconBug size={20} /> : <IconBugOff size={20} />}
            </IconButton>
          </Stack>
        </Paper>

        <Box style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {/* Messages Area - Slack 스타일 배경 적용 */}
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff', // 메시지 영역은 다시 밝게
            }}
            ref={messagesRef}
          >
            <Stack spacing="md" style={{ flex: 1, minHeight: 0 }}>
              {messages.map((msg) => {
                const isOwnMessage = msg.senderId === user?.id || msg.status === 'sending';
                return (
                  <Flex
                    key={msg._id}
                    direction="column"
                    align={isOwnMessage ? 'flex-end' : 'flex-start'}
                    style={{ width: '100%' }}
                  >
                    <Flex
                      direction="column"
                      align={isOwnMessage ? 'flex-end' : 'flex-start'}
                      style={{ maxWidth: '70%' }}
                    >
                      <Flex align="center" gap="sm" style={{ marginBottom: '4px' }}>
                        {!isOwnMessage && (
                          <Typography variant="caption" color="text-secondary">
                            {msg.senderName || (msg.senderId ? msg.senderId.substring(0, 6) : 'Unknown')}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text-tertiary">
                          {formatTimestamp(msg.timestamp)}
                        </Typography>
                      </Flex>
                      <Paper
                        elevation={1}
                        padding="sm"
                        style={{
                          borderRadius: isOwnMessage ? '12px 0 12px 12px' : '0 12px 12px 12px',
                          backgroundColor: isOwnMessage
                            ? 'var(--color-interactive-primary)'
                            : 'var(--color-surface-level-1)',
                          color: isOwnMessage ? 'var(--primitive-gray-0)' : 'inherit',
                          alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                        }}
                      >
                        {msg.fileData ? (
                          <Box>
                            {msg.fileData.fileType === 'image' && msg.fileData.data ? (
                              <Box>
                                <img
                                  src={msg.fileData.data}
                                  alt={msg.fileData.fileName}
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '200px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => handleImageClick(msg.fileData!.data!, msg.fileData!.fileName)}
                                />
                              </Box>
                            ) : (
                              <Flex align="center" gap="sm">
                                <IconFile size={24} />
                                <Box>
                                  <Typography variant="body-small" style={{ fontWeight: 'bold' }}>
                                    {msg.fileData.fileName}
                                  </Typography>
                                  <Typography variant="caption">{formatFileSize(msg.fileData.size)}</Typography>
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    downloadFile(
                                      msg.fileData!.fileName,
                                      msg.fileData!.data || '',
                                      msg.fileData!.mimeType,
                                    )
                                  }
                                >
                                  <IconDownload size={16} />
                                </IconButton>
                              </Flex>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body-medium">{msg.content}</Typography>
                        )}
                      </Paper>
                    </Flex>
                  </Flex>
                );
              })}
            </Stack>
          </Box>

          {/* User List Sidebar */}
          {showUserList && (
            <Paper
              elevation={0}
              square
              style={{
                width: '240px',
                borderLeft: '1px solid var(--color-border-default)',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              <Box padding="md" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
                <Typography variant="h4">참여자 ({currentRoom.members?.length || 0})</Typography>
              </Box>
              <Box style={{ flex: 1, overflowY: 'auto' }}>
                <List>
                  {currentRoom.members?.map((member) => (
                    <ListItem key={member._id}>
                      <ListItemAvatar>
                        <Avatar
                          src={member.avatar}
                          variant="circular"
                          size="sm"
                          style={{
                            border: `2px solid ${
                              member.status === 'online' ? 'var(--color-success-main)' : 'var(--color-text-tertiary)'
                            }`,
                          }}
                        >
                          {member.username.substring(0, 1).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={member.username}
                        secondary={member.status === 'online' ? 'Online' : 'Offline'}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Paper>
          )}
        </Box>

        {/* Input Area */}
        <Paper square elevation={4} padding="md" style={{ flexShrink: 0 }}>
          <Stack spacing="sm">
            {/* File Previews */}
            {selectedFiles.length > 0 && (
              <Flex gap="sm" wrap="wrap">
                {selectedFiles.map((file, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    padding="sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <IconFile size={16} />
                    <Typography variant="caption">{file.name}</Typography>
                    <IconButton size="small" onClick={() => handleFileRemove(index)}>
                      <IconX size={14} />
                    </IconButton>
                  </Paper>
                ))}
              </Flex>
            )}
            {uploadingFile && (
              <Box>
                <Typography variant="caption">
                  Uploading {uploadingFile.name}... {Math.round(uploadProgress)}%
                </Typography>
                <div
                  style={{
                    height: '4px',
                    width: '100%',
                    backgroundColor: 'var(--primitive-gray-200)',
                    borderRadius: '2px',
                    marginTop: '4px',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${uploadProgress}%`,
                      backgroundColor: 'var(--primitive-primary-500)',
                      borderRadius: '2px',
                    }}
                  ></div>
                </div>
              </Box>
            )}

            <Flex gap="sm" align="center">
              <input ref={fileInputRef} type="file" onChange={handleFileSelect} style={{ display: 'none' }} multiple />
              <IconButton onClick={() => fileInputRef.current?.click()} color="secondary">
                <IconPaperclip />
              </IconButton>
              <Box style={{ flex: 1 }} ref={inputWrapperRef}>
                <Input
                  value={input}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  onInput={(e) => {
                    const target = e.currentTarget as HTMLInputElement;
                    setInput(target.value);
                    // 한글 입력 시 포커스 유지 로직 최적화
                    if (isComposing) {
                      const inputElement = e.currentTarget;
                      requestAnimationFrame(() => {
                        if (document.activeElement !== inputElement) {
                          inputElement.focus();
                        }
                      });
                    }
                  }}
                  onKeyPress={(e) => {
                    if (!isComposing) {
                      handleKeyPress(e);
                    }
                  }}
                  placeholder={!isConnected ? 'Connecting...' : `Message #${currentRoom.name}`}
                  disabled={!isConnected}
                  fullWidth
                  className="chat-app__input"
                />
              </Box>
              <IconButton
                onClick={selectedFiles.length > 0 ? handleFileSend : sendMessage}
                color="primary"
                disabled={!isConnected || (!input.trim() && selectedFiles.length === 0)}
              >
                <IconSend />
              </IconButton>
            </Flex>
          </Stack>
        </Paper>

        {/* Image Modal */}
        {imageModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={handleCloseImageModal}
          >
            <img src={imageModal.url} alt={imageModal.fileName} style={{ maxWidth: '90%', maxHeight: '90%' }} />
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 3000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setShowSettings(false)}
          >
            <Paper
              padding="lg"
              style={{ width: '400px', backgroundColor: 'var(--color-bg-default)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <Typography variant="h3" style={{ marginBottom: '16px' }}>
                Notification Settings
              </Typography>
              <Stack spacing="md">
                <Flex justify="space-between" align="center">
                  <Typography variant="body-medium">Global Notifications</Typography>
                  {/* Switch component usage depends on implementation, assuming common props */}
                  <input
                    type="checkbox"
                    checked={(user as any)?.notificationSettings?.globalEnabled !== false}
                    onChange={(e) => toggleGlobalNotifications(e.currentTarget.checked)}
                  />
                </Flex>
                <Divider />
                <Typography variant="caption" color="text-secondary">
                  More detailed per-room settings coming soon...
                </Typography>
                <Button fullWidth onClick={() => setShowSettings(false)}>
                  Close
                </Button>
              </Stack>
            </Paper>
          </div>
        )}
      </Flex>
    </Box>
  );
}

export function ChatApp() {
  return (
    <ChatProvider>
      <ChatDataProvider>
        <ChatAppContent />
      </ChatDataProvider>
    </ChatProvider>
  );
}
