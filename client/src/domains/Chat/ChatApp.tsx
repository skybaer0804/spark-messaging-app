import { useChatApp } from './hooks/useChatApp';
import { useRef, useEffect, useState, useMemo } from 'preact/hooks';
import { useChat } from './context/ChatContext';
import { useTheme } from '@/core/context/ThemeProvider';
import { Box } from '@/components/ui/layout';
import { chatPendingJoinRoom, clearPendingJoinChatRoom } from '@/stores/chatRoomsStore';
import { useAuth } from '@/core/hooks/useAuth';
import { chatApi } from '@/core/api/ApiService';
import { useToast } from '@/core/context/ToastContext';
import { ChatDataProvider } from './context/ChatDataProvider';
import { useRouterState } from '@/routes/RouterState';
import { getDirectChatName } from './utils/chatUtils';
import { ChatSidebar } from './components/ChatSidebar/ChatSidebar';
import { ChatEmptyState } from './components/ChatEmptyState';
import { DirectoryView } from './components/Directory/DirectoryView';
import { ChatHeader } from './components/ChatHeader';
import { ChatMemberPanel } from './components/ChatMemberPanel';
import { ChatInput } from './components/ChatInput';
import { ChatMessages } from './components/ChatMessages';
import { ChatSettingPanel } from './components/ChatSettingPanel/ChatSettingPanel';
import { ImageModal } from './components/ImageModal';
import { ChatThreadPanel } from './components/ChatThreadPanel';
import { ChatInfoPanel } from './components/ChatInfoPanel';
import { Loading } from '@/components/ui/loading';
import { DialogForward } from './components/DialogForward';
import { FileAttachmentModal } from './components/MessageInput/FileAttachmentModal';
import type { Message } from './types';
import { MobileHeader } from '@/components/Mobile/MobileHeader';
import { MobileSlidePanel } from '@/components/Mobile/MobileSlidePanel';
import './components/Chat.scss';

function ChatAppContent() {
  const { pathname, navigate } = useRouterState();
  const { deviceSize } = useTheme(); // ✅ useTheme으로 올바르게 수정

  // 경로 방어 로직: /chatapp 경로가 아닐 경우 렌더링하지 않음
  if (!pathname.startsWith('/chatapp')) {
    return null;
  }

  const {
    isConnected,
    messages,
    input,
    setInput,
    currentRoom,
    roomList,
    userList,
    sendMessage,
    handleRoomSelect: handleRoomSelectRaw,
    handleCreateRoom,
    leaveRoom,
    sendFiles, // [v2.6.0] 추가
    retryUpload,
    isRoomLoading,
  } = useChatApp();

  const { setCurrentRoom } = useChat();
  const [isDragging, setIsDragging] = useState(false); // [v2.6.0] Drag & Drop 전용

  const view = useMemo(() => {
    if (pathname === '/chatapp/directory') return 'directory';
    if (pathname.startsWith('/chatapp/invite/')) return 'invite';
    if (pathname.startsWith('/chatapp/chat/')) return 'chat';
    return 'home';
  }, [pathname]);

  const [directoryTab, setDirectoryTab] = useState<'channel' | 'team' | 'user' | 'discussion'>('user');
  const { showSuccess, showError } = useToast();

  // [v2.6.0] Drag-and-Drop 핸들러
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (view === 'chat' && currentRoom) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 오버레이 자체에서 나갈 때만 false 처리 (pointer-events: none 이슈 방어)
    if ((e.target as HTMLElement).classList.contains('chat-app__drag-overlay')) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (view === 'chat' && currentRoom && e.dataTransfer?.files.length) {
      const files = Array.from(e.dataTransfer.files);
      setSelectedFiles(files);
      setAttachmentModalOpen(true);
    }
  };

  // 초대 링크로 입장 처리
  useEffect(() => {
    if (view === 'invite') {
      const slug = pathname.split('/').pop();
      if (slug) {
        chatApi
          .joinRoomByInvite(slug)
          .then((response) => {
            const room = response.data;
            if (room && room._id) {
              showSuccess('채널에 입장했습니다.');
              handleRoomSelectRaw(room);
              navigate(`/chatapp/chat/${room._id}`);
            }
          })
          .catch((error) => {
            console.error('Failed to join room by invite:', error);
            showError(error.response?.data?.message || '채널 입장에 실패했습니다.');
            navigate('/chatapp');
          });
      }
    }
  }, [view, pathname]);

  useEffect(() => {
    if (view === 'chat') {
      const roomId = pathname.split('/').pop();
      if (roomId && currentRoom?._id !== roomId && roomList.length > 0) {
        onRoomSelect(roomId);
        // 방이 변경되면 우측 패널 및 스레드 선택 상태 초기화
        setRightPanel('none');
        setSelectedThreadMessage(null);
      }
    }
  }, [pathname, currentRoom?._id, roomList, view]);

  const onRoomSelect = (roomId: string) => {
    const room = roomList.find((r) => r._id === roomId);
    if (room) {
      handleRoomSelectRaw(room);
      if (pathname !== `/chatapp/chat/${roomId}`) {
        navigate(`/chatapp/chat/${roomId}`);
      }
    }
  };

  const goToHome = () => {
    setCurrentRoom(null);
    navigate('/chatapp');
  };

  const startDirectChat = async (userId: string) => {
    // 서버에서 identifier 기반으로 기존 활성 방을 찾거나 새 방을 생성하도록 위임
    const newRoom = await handleCreateRoom('direct', { members: [userId] });
    if (newRoom && newRoom._id) {
      navigate(`/chatapp/chat/${newRoom._id}`);
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

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false);
  const [imageModal, setImageModal] = useState<{ url: string; fileName: string; groupId?: string; messageId?: string; fileIndex?: number } | null>(null);
  const [rightPanel, setRightPanel] = useState<'none' | 'members' | 'settings' | 'thread' | 'info'>('none');
  const [selectedThreadMessage, setSelectedThreadMessage] = useState<Message | null>(null);
  const [forwardModalMessage, setForwardModalMessage] = useState<Message | null>(null);
  const { user: currentUser } = useAuth();
  const messagesRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      setAttachmentModalOpen(true); // 모달 열기
    }
    // input value 초기화 (같은 파일 다시 선택 가능하도록)
    target.value = '';
  };



  const handleFileRemove = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageClick = (imageUrl: string, fileName: string, idOrGroupId?: string, fileIndex?: number) => {
    // [v2.8.0] idOrGroupId가 messageId일 수도 있고 groupId일 수도 있음
    // messageId로 먼저 매칭 시도
    const isMessageId = messages.some(m => m._id === idOrGroupId);
    setImageModal({ 
      url: imageUrl, 
      fileName, 
      messageId: isMessageId ? idOrGroupId : undefined,
      groupId: !isMessageId ? idOrGroupId : undefined,
      fileIndex
    });
  };

  const handleThreadClick = (message: Message) => {
    setSelectedThreadMessage(message);
    setRightPanel('thread');
  };

  const handleForwardClick = (message: Message) => {
    setForwardModalMessage(message);
  };

  const handleCloseImageModal = () => {
    setImageModal(null);
  };

  // 모바일에서는 깊이 구조로 뷰 전환
  const isMobile = deviceSize === 'mobile';

  const showSidebar = !isMobile || (view === 'home' && pathname === '/chatapp');
  const showMainContent = !isMobile || view === 'chat' || view === 'directory';

  return (
    <Box
      style={{
        display: 'flex',
        height: '100%', // 100dvh 대신 안전한 100%로 복구 (CSS에서 dvh 처리)
        width: '100%',
        minHeight: 0,
        position: 'relative',
        overflow: 'hidden'
      }}
      className="chat-app__container"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
    >
      {/* Drag Overlay */}
      {isDragging && (
        <Box
          className="chat-app__drag-overlay"
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'all'
          }}
        >
          <Box className="chat-app__drag-overlay-box" style={{ textAlign: 'center', pointerEvents: 'none' }}>
            <Box style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</Box>
            <Box style={{ fontSize: '1.2rem', fontWeight: 600 }}>파일을 여기에 놓아 업로드하세요</Box>
          </Box>
        </Box>
      )}
      {/* Forward Modal - Rendered at top level */}
      {forwardModalMessage && (
        <DialogForward
          open={!!forwardModalMessage}
          message={forwardModalMessage}
          roomList={roomList}
          userList={userList}
          onClose={() => setForwardModalMessage(null)}
          onSuccess={() => {
            setForwardModalMessage(null);
            showSuccess('메시지가 전달되었습니다.');
          }}
        />
      )}

      {/* Sidebar Area */}
      {showSidebar && (
        <Box
          style={{
            width: isMobile ? '100%' : '300px',
            height: '100%',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
          className="chat-app__sidebar-wrapper"
        >
          {isMobile && <MobileHeader />}
          <Box style={{ flex: 1, overflow: 'hidden' }}>
            <ChatSidebar />
          </Box>
        </Box>
      )}

      {/* Main Content Area */}
      {showMainContent && (
        <Box
          style={{
            flex: 1,
            height: '100%',
            minHeight: 0,
            overflow: 'hidden',
            display: view === 'home' || view === 'directory' ? 'block' : 'flex',
            flexDirection: view === 'chat' ? 'column' : 'initial',
          }}
          className="chat-app__main-content"
        >
          {view === 'directory' ? (
            <DirectoryView
              isMobile={isMobile}
              directoryTab={directoryTab}
              setDirectoryTab={setDirectoryTab}
              roomList={roomList}
              onRoomSelect={onRoomSelect}
              userList={userList}
              startDirectChat={startDirectChat}
              onBack={() => navigate('/chatapp')}
            />
          ) : view === 'chat' && currentRoom ? (
            <>
              {/* Chat Header */}
              <ChatHeader
                isMobile={isMobile}
                goToHome={goToHome}
                currentRoom={currentRoom}
                showUserList={rightPanel === 'members'}
                showSettings={rightPanel === 'settings'}
                showThreads={rightPanel === 'thread'}
                showInfo={rightPanel === 'info'}
                setShowUserList={(show: boolean) => setRightPanel(show ? 'members' : 'none')}
                setShowSettings={(show: boolean) => setRightPanel(show ? 'settings' : 'none')}
                setShowThreads={(show: boolean) => setRightPanel(show ? 'thread' : 'none')}
                setShowInfo={(show: boolean) => setRightPanel(show ? 'info' : 'none')}
                className="chat-app__header"
              />

              <Box style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }} className="chat-app__content-area">
                {/* 메인 채팅 영역 (메시지 + 입력창) */}
                <Box style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
                  {isRoomLoading ? (
                    <Box style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--color-background-primary)',
                      opacity: 0.8,
                      zIndex: 10
                    }}>
                      <Loading size="large" />
                    </Box>
                  ) : (
                    <ChatMessages
                      messages={messages}
                      currentUser={currentUser as any}
                      currentRoom={currentRoom}
                      messagesRef={messagesRef}
                      messagesEndRef={messagesEndRef}
                      onImageClick={handleImageClick}
                      onThreadClick={handleThreadClick}
                      onForwardClick={handleForwardClick}
                      onRetry={retryUpload}
                    />
                  )}

                  {/* Input Area */}
                  <ChatInput
                    input={input}
                    setInput={setInput}
                    members={userList}
                    roomMembers={currentRoom.members}
                    isConnected={isConnected}
                    placeholder={
                      !isConnected
                        ? 'Connecting...'
                        : `Message #${currentRoom.displayName ||
                        getDirectChatName(currentRoom, currentUser?.id || (currentUser as any)?._id)
                        }`
                    }
                    showFileUpload={true}
                    onSendMessage={sendMessage}
                    onFileSelect={handleFileSelect}
                    onKeyPress={handleKeyPress}
                    classNamePrefix="chat-input"
                  />
                </Box>

                {/* Right Sidebar */}
                {isMobile ? (
                  <>
                    <MobileSlidePanel open={rightPanel === 'members'} onClose={() => setRightPanel('none')} noHeader>
                      <ChatMemberPanel members={currentRoom.members} currentRoom={currentRoom} onClose={() => setRightPanel('none')} />
                    </MobileSlidePanel>
                    <MobileSlidePanel open={rightPanel === 'settings'} onClose={() => setRightPanel('none')} noHeader>
                      <ChatSettingPanel roomId={currentRoom._id} currentRoom={currentRoom} onClose={() => setRightPanel('none')} />
                    </MobileSlidePanel>
                    <MobileSlidePanel open={rightPanel === 'info'} onClose={() => setRightPanel('none')} noHeader>
                      <ChatInfoPanel currentRoom={currentRoom} onClose={() => setRightPanel('none')} onLeave={() => leaveRoom(currentRoom._id)} />
                    </MobileSlidePanel>
                    <MobileSlidePanel open={rightPanel === 'thread'} onClose={() => setRightPanel('none')} noHeader>
                      <ChatThreadPanel
                        roomId={currentRoom._id}
                        currentRoom={currentRoom}
                        currentUser={currentUser as any}
                        onClose={() => setRightPanel('none')}
                        initialSelectedMessage={selectedThreadMessage}
                      />
                    </MobileSlidePanel>
                  </>
                ) : (
                  <>
                    {rightPanel === 'members' && <ChatMemberPanel members={currentRoom.members} currentRoom={currentRoom} onClose={() => setRightPanel('none')} />}
                    {rightPanel === 'settings' && <ChatSettingPanel roomId={currentRoom._id} currentRoom={currentRoom} onClose={() => setRightPanel('none')} />}
                    {rightPanel === 'info' && <ChatInfoPanel currentRoom={currentRoom} onClose={() => setRightPanel('none')} onLeave={() => leaveRoom(currentRoom._id)} />}
                    {rightPanel === 'thread' && (
                      <ChatThreadPanel
                        roomId={currentRoom._id}
                        currentRoom={currentRoom}
                        currentUser={currentUser as any}
                        onClose={() => setRightPanel('none')}
                        initialSelectedMessage={selectedThreadMessage}
                      />
                    )}
                  </>
                )}
              </Box>
            </>
          ) : (
            <ChatEmptyState />
          )}
        </Box>
      )}

      {/* Image Modal */}
      {imageModal && (
        <ImageModal
          url={imageModal.url}
          fileName={imageModal.fileName}
          groupId={imageModal.groupId}
          messageId={imageModal.messageId}
          fileIndex={imageModal.fileIndex}
          allMessages={messages}
          onClose={handleCloseImageModal}
        />
      )}

      {/* File Attachment Modal */}
      <FileAttachmentModal
        open={attachmentModalOpen}
        onClose={() => {
          setAttachmentModalOpen(false);
          setSelectedFiles([]); // 모달 닫으면 선택 초기화
        }}
        files={selectedFiles}
        onSend={async (files) => {
          // [v2.6.0] sendFiles 사용하여 그룹화 전송
          await sendFiles(files);
        }}
        onRemove={handleFileRemove}
      />
    </Box>
  );
}

export function ChatApp() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <ChatDataProvider>
      <ChatAppContent />
    </ChatDataProvider>
  );
}
