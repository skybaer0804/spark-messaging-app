import { memo, useState } from 'preact/compat';
import type { Message, ChatUser } from '../types';
import { formatTimestamp } from '@/core/utils/messageUtils';
import { downloadFile, downloadFileFromUrl } from '@/core/utils/fileUtils';
import { Paper } from '@/ui-components/Paper/Paper';
import { Typography } from '@/ui-components/Typography/Typography';
import { Flex } from '@/ui-components/Layout/Flex';
import { Box } from '@/ui-components/Layout/Box';
import { chatApi } from '@/core/api/ApiService';
import { ModelModal } from './ModelModal/ModelModal';

// 메시지 타입별 서브 컴포넌트 임포트
import { TextMessage } from './MessageTypes/TextMessage';
import { ImageMessage } from './MessageTypes/ImageMessage';
import { Model3DMessage } from './MessageTypes/Model3DMessage';
import { FileMessage } from './MessageTypes/FileMessage';
import { VideoMessage } from './MessageTypes/VideoMessage';
import { AudioMessage } from './MessageTypes/AudioMessage';

import { IconCheck, IconClock, IconAlertCircle, IconShare } from '@tabler/icons-preact';
import { messagesSignal } from '../hooks/useOptimisticUpdate';
import { ChatMessageItemToolbar } from './ChatMessageItemToolbar';
import { ChatMessageItemThread } from './ChatMessageItemThread';
import { ProfileItem } from './ProfileItem/ProfileItem';
import './Chat.scss';

interface ChatMessageItemProps {
  message: Message;
  currentUser?: ChatUser | null;
  onImageClick?: (url: string, fileName: string) => void;
  onThreadClick?: (message: Message) => void;
  onForwardClick?: (message: Message) => void;
  unreadCount?: number;
  classNamePrefix?: string;
  isGrouped?: boolean;
  hideToolbar?: boolean;
  isParentInThread?: boolean;
}

function ChatMessageItemComponent({ 
  message, 
  currentUser, 
  onImageClick, 
  onThreadClick,
  onForwardClick,
  unreadCount,
  isGrouped = false,
  hideToolbar = false,
  isParentInThread = false
}: ChatMessageItemProps) {
  const [showModelModal, setShowModelModal] = useState(false);
  const [isSnapshotUploading, setIsSnapshotUploading] = useState(false);
  const [localThumbnail, setLocalPreview] = useState<string | null>(null); // 로컬 프리뷰 상태 추가
  const [isHovered, setIsHovered] = useState(false);

  // 1. 안전한 senderId 및 이름 추출 로직 (v2.4.3 보호)
  const senderIdStr =
    typeof message.senderId === 'object' ? (message.senderId as any)?._id?.toString() : message.senderId?.toString();
  
  const senderName = 
    message.senderName || 
    (typeof message.senderId === 'object' ? (message.senderId as any)?.username : null) ||
    (senderIdStr ? `User_${senderIdStr.substring(0, 6)}` : 'Unknown');

  // 2. 현재 로그인한 사용자 ID 추출 (id 또는 _id 모두 대응)
  const currentUserIdStr = (currentUser as any)?.id?.toString() || currentUser?._id?.toString();

  // 3. 본인 메시지 여부 판별
  const isOwnMessage =
    (senderIdStr && currentUserIdStr && senderIdStr === currentUserIdStr) || 
    message.status === 'sending';

  // 3D 스냅샷 업로드 핸들러
  const handleSnapshot = async (base64: string) => {
    if (message.fileData?.thumbnail || isSnapshotUploading) return;
    try {
      setIsSnapshotUploading(true);
      
      // 즉시 로컬 프리뷰 반영 (업로더 사이드)
      setLocalPreview(base64);
      
      // 전역 상태에도 즉시 반영 시도 (동기화)
      if (messagesSignal.value) {
        messagesSignal.value = messagesSignal.value.map(m => 
          m._id === message._id ? { 
            ...m, 
            fileData: { ...m.fileData!, thumbnail: base64 } 
          } : m
        );
      }

      const res = await fetch(base64);
      const blob = await res.blob();
      const file = new File([blob], `thumb_${message._id}.png`, { type: 'image/png' });
      const formData = new FormData();
      formData.append('thumbnail', file);
      formData.append('messageId', message._id);
      formData.append('roomId', message.roomId);
      await chatApi.uploadThumbnail(formData);
    } catch (err) {
      console.error('❌ [3D] 스냅샷 업로드 실패:', err);
    } finally {
      setIsSnapshotUploading(false);
    }
  };

  const handleDownload = async (e: any) => {
    e.stopPropagation();
    if (!message.fileData) return;
    const { fileName, url, data, mimeType } = message.fileData;
    const downloadUrl = url || data;
    if (!downloadUrl) return;
    
    if (downloadUrl.startsWith('http')) {
      await downloadFileFromUrl(downloadUrl, fileName || 'download');
    } else {
      downloadFile(fileName || 'download', downloadUrl, mimeType || 'application/octet-stream');
    }
  };

  const renderContent = () => {
    // 로컬 프리뷰가 있는 경우 메시지 객체를 복제하여 썸네일 주입
    const displayMessage = localThumbnail ? {
      ...message,
      fileData: { ...message.fileData!, thumbnail: localThumbnail }
    } : message;

    if (!displayMessage.fileData) {
      return <TextMessage message={displayMessage} isOwnMessage={isOwnMessage} />;
    }

    switch (displayMessage.fileData.fileType) {
      case 'image': return <ImageMessage message={displayMessage} handleDownload={handleDownload} onImageClick={onImageClick} />;
      case '3d': return <Model3DMessage message={displayMessage} handleDownload={handleDownload} setShowModelModal={setShowModelModal} />;
      case 'video': return <VideoMessage message={displayMessage} handleDownload={handleDownload} />;
      case 'audio': return <AudioMessage message={displayMessage} handleDownload={handleDownload} />;
      default: return <FileMessage message={displayMessage} handleDownload={handleDownload} />;
    }
  };

  const renderStatus = () => {
    if (!isOwnMessage) return null;
    switch (message.status) {
      case 'sending': return <IconClock size={12} style={{ opacity: 0.6 }} />;
      case 'sent': return <IconCheck size={12} style={{ color: isOwnMessage ? 'inherit' : 'var(--color-status-success)' }} />;
      case 'failed': return <IconAlertCircle size={12} style={{ color: 'var(--color-status-error)' }} />;
      default: return null;
    }
  };

  const renderInfoSuffix = () => (
    <Flex align="center" gap="xs">
      <Typography variant="caption" color="text-tertiary" style={{ fontSize: '12px' }}>
        {formatTimestamp(message.timestamp)}
      </Typography>
      {renderStatus()}
      {message.isForwarded && (
        <Typography variant="caption" color="text-tertiary" style={{ fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '11px' }}>
          <IconShare size={10} /> 전달됨: {message.originSenderName}
        </Typography>
      )}
      {isParentInThread && (
        <Typography variant="caption" color="primary" style={{ fontWeight: 'bold', fontSize: '11px', marginLeft: '4px' }}>
          원본 메시지
        </Typography>
      )}
    </Flex>
  );

  return (
    <Box 
      className={`chat-app__message-item ${isGrouped ? 'chat-app__message-item--grouped' : 'chat-app__message-item--not-grouped'} ${isOwnMessage ? 'chat-app__message-item--own' : 'chat-app__message-item--other'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        width: '100%',
        alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
      }}
    >
      {!isOwnMessage && (
        <ProfileItem
          name={senderName}
          avatar={typeof message.senderId === 'object' ? (message.senderId as any)?.profileImage : undefined}
          type="direct"
          styleOption={{
            mode: 'chat',
            isGrouped: isGrouped,
            showDesc: false,
            statusPosition: 'name-left',
            nameSuffix: renderInfoSuffix()
          }}
        />
      )}

      <Flex 
        direction="column" 
        align={isOwnMessage ? 'flex-end' : 'flex-start'} 
        className="chat-app__message-item-content-wrapper"
        style={{ width: '100%' }}
      >
        {isOwnMessage && !isGrouped && (
          <Box className="chat-app__message-item-info chat-app__message-item-info--own">
            <Typography variant="body-medium" style={{ fontWeight: 'normal', fontSize: '15px' }}>{senderName}</Typography>
            {renderInfoSuffix()}
          </Box>
        )}
        
        <Box style={{ 
          position: 'relative', 
          width: '100%', 
          display: 'flex', 
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start', 
          paddingLeft: !isOwnMessage ? '44px' : '0',
          paddingRight: isOwnMessage ? '4px' : '0' 
        }}>
          <Box style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Paper
              elevation={isOwnMessage ? 1 : 0}
              padding="sm"
              className={`chat-app__message-bubble ${isOwnMessage ? 'chat-app__message-bubble--own' : 'chat-app__message-bubble--other'}`}
              style={{
                borderRadius: isOwnMessage ? '12px 0 12px 12px' : '0 12px 12px 12px',
                position: 'relative',
              }}
            >
              {unreadCount !== undefined && unreadCount > 0 && (
                <Typography variant="caption" style={{ position: 'absolute', [isOwnMessage ? 'left' : 'right']: '-24px', bottom: '2px', color: 'var(--primitive-yellow-600)', fontWeight: 'bold' }}>
                  {unreadCount}
                </Typography>
              )}
              {renderContent()}
            </Paper>

            {/* 메시지 툴바 (Hover 시 노출) */}
            {isHovered && !hideToolbar && (
              <ChatMessageItemToolbar 
                message={message}
                isOwnMessage={isOwnMessage}
                onThreadClick={onThreadClick}
                onForwardClick={onForwardClick}
              />
            )}
          </Box>
        </Box>

        {/* 스레드 요약 정보 (답글이 있는 경우, 원본 메시지가 아닐 때만 노출) */}
        {!isParentInThread && (
          <Box style={{ paddingLeft: !isOwnMessage ? '44px' : '0' }}>
            <ChatMessageItemThread 
              message={message} 
              onClick={onThreadClick} 
            />
          </Box>
        )}
      </Flex>

      {/* 내 메시지일 때 좌측 정렬을 위한 빈 공간 확보 (flex-reverse 때문) */}
      {isOwnMessage && <Box style={{ height: isGrouped ? '0' : '1px' }} />}

      {showModelModal && (message.fileData?.renderUrl || message.renderUrl || message.fileData?.url) && (
        <ModelModal
          modelUrl={message.fileData?.renderUrl || message.renderUrl || message.fileData?.url || ''}
          originalUrl={message.fileData?.url || ''}
          fileName={message.fileData?.fileName || '3D 모델'}
          onClose={() => setShowModelModal(false)}
          handleSnapshot={handleSnapshot}
        />
      )}
    </Box>
  );
}

export const ChatMessageItem = memo(ChatMessageItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.message._id === nextProps.message._id &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.fileData?.thumbnail === nextProps.message.fileData?.thumbnail &&
    prevProps.message.fileData?.url === nextProps.message.fileData?.url &&
    prevProps.message.fileData?.renderUrl === nextProps.message.fileData?.renderUrl &&
    prevProps.message.renderUrl === nextProps.message.renderUrl &&
    prevProps.message.replyCount === nextProps.message.replyCount &&
    prevProps.message.lastReplyAt?.getTime() === nextProps.message.lastReplyAt?.getTime() &&
    prevProps.unreadCount === nextProps.unreadCount &&
    prevProps.isGrouped === nextProps.isGrouped
  );
});
