import { memo, useState, useMemo, useEffect, useCallback } from 'preact/compat';
import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconX, IconDownload, IconPhotoOff, IconChevronLeft, IconChevronRight, IconRefresh } from '@tabler/icons-preact';
import { downloadFileFromUrl } from '@/core/utils/fileUtils';
import { Typography } from '@/ui-components/Typography/Typography';
import { useChat } from '../context/ChatContext';
import { chatApi } from '@/core/api/ApiService';
import type { Message } from '../types';
import { ModelViewer } from './ModelViewer/ModelViewer'; // 3D 렌더링 지원용
import './Chat.scss';

interface ImageModalProps {
  url: string;
  fileName: string;
  groupId?: string;
  messageId?: string; // [v2.8.0] 단일 메시지 내 다중 파일 지원을 위한 추가
  allMessages?: Message[];
  onClose: () => void;
  classNamePrefix?: string;
}

function ImageModalComponent({ url, fileName, groupId, messageId, allMessages = [], onClose }: ImageModalProps) {
  const { services } = useChat();
  const { chat: chatService } = services;
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [isSnapshotUploading, setIsSnapshotUploading] = useState(false);
  const [loadedUrls] = useState(() => new Set<string>());

  // [v2.8.0] 그룹화된 미디어 목록 추출 (이미지 + 3D)
  const groupMedia = useMemo(() => {
    // 1. 단일 메시지 내 다중 파일인 경우 (최우선)
    if (messageId) {
      const targetMsg = allMessages.find(m => m._id === messageId);
      if (targetMsg && targetMsg.files && targetMsg.files.length > 0) {
        return targetMsg.files
          .filter(f => f.fileType === 'image' || f.fileType === '3d')
          .map((f, idx) => ({
            ...f,
            url: f.url || f.data,
            thumbnailUrl: f.thumbnailUrl || f.thumbnail,
            messageId: targetMsg._id, // Navigation용
            fileIndex: idx
          }));
      }
    }

    // 2. 여러 메시지가 groupId로 묶인 경우 (레거시)
    if (groupId && allMessages.length > 0) {
      return allMessages
        .filter(msg => msg.groupId === groupId && (msg.type === 'image' || msg.type === '3d'))
        .map(msg => ({
          ...msg.fileData!,
          url: msg.fileData?.url || msg.fileData?.data,
          thumbnailUrl: msg.fileData?.thumbnail || msg.fileData?.thumbnailUrl,
          messageId: msg._id,
          fileIndex: null
        }));
    }

    return [];
  }, [groupId, messageId, allMessages]);

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (groupMedia.length > 0) {
      const foundIndex = groupMedia.findIndex(m => m.url === url || m.thumbnailUrl === url || (m as any).thumbnail === url);
      return foundIndex >= 0 ? foundIndex : 0;
    }
    return -1;
  });

  // 현재 표시할 미디어 정보
  const currentMedia = currentIndex >= 0 ? groupMedia[currentIndex] : null;
  const currentUrl = currentMedia?.url || url;
  const currentName = currentMedia?.fileName || fileName;
  const currentType = currentMedia?.fileType || (currentMedia as any)?.type || 'image';
  const currentRenderUrl = currentMedia?.renderUrl;
  const currentThumbnailUrl = currentMedia?.thumbnailUrl;
  const currentStatus = currentMedia?.processingStatus;

  useEffect(() => {
    if (loadedUrls.has(currentUrl)) {
      setImageLoading(false);
    } else {
      setImageLoading(true);
    }
    setImageError(false);
  }, [currentUrl]);

  const handlePrev = (e?: Event) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = (e?: Event) => {
    e?.stopPropagation();
    if (currentIndex < groupMedia.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDownload = async (e: Event) => {
    e.stopPropagation();
    await downloadFileFromUrl(currentUrl, currentName);
  };

  const handleReprocess = async (e: Event) => {
    e.stopPropagation();
    if (!currentMedia) return;
    try {
      await chatService.reprocessFile(currentMedia.messageId!, currentMedia.fileIndex);
    } catch (err) {
      console.error('Failed to trigger reprocess:', err);
    }
  };

  const handleSnapshot = useCallback(async (base64: string) => {
    if (!currentMedia || isSnapshotUploading || currentThumbnailUrl) return;
    
    try {
      setIsSnapshotUploading(true);
      const res = await fetch(base64);
      const blob = await res.blob();
      const file = new File([blob], `thumb_${currentMedia.messageId}_${currentMedia.fileIndex}.png`, { type: 'image/png' });
      
      const formData = new FormData();
      formData.append('thumbnail', file);
      formData.append('messageId', currentMedia.messageId!);
      // [v2.9.2] fileIndex가 있으면 함께 전송 (서버에서 해당 인덱스 업데이트용)
      if (currentMedia.fileIndex !== null) {
        formData.append('fileIndex', currentMedia.fileIndex.toString());
      }
      
      const targetMsg = allMessages.find(m => m._id === currentMedia.messageId);
      if (targetMsg) {
        formData.append('roomId', targetMsg.roomId);
      }

      await chatApi.uploadThumbnail(formData);
    } catch (err) {
      console.error('Failed to upload snapshot:', err);
    } finally {
      setIsSnapshotUploading(false);
    }
  }, [currentMedia, isSnapshotUploading, currentThumbnailUrl, allMessages]);

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, groupMedia.length]);

  const StatusIndicator = ({ label, exists, processing }: { label: string; exists: boolean; processing?: boolean }) => (
    <Flex align="center" gap="xs" style={{ 
      padding: '4px 8px', 
      borderRadius: '4px', 
      backgroundColor: 'rgba(0,0,0,0.5)',
      border: `1px solid ${processing ? 'var(--color-status-warning)' : exists ? 'var(--color-status-success)' : 'var(--color-status-error)'}`
    }}>
      <div style={{ 
        width: '8px', 
        height: '8px', 
        borderRadius: '50%', 
        backgroundColor: processing ? 'var(--color-status-warning)' : exists ? 'var(--color-status-success)' : 'var(--color-status-error)' 
      }} />
      <Typography variant="caption" style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>{label}</Typography>
    </Flex>
  );

  return (
    <Box
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '2rem',
      }}
      onClick={onClose}
    >
      {/* 컨트롤 버튼 */}
      <Box style={{ position: 'absolute', top: '2rem', right: '2rem', display: 'flex', gap: '1rem', zIndex: 1010 }}>
        {currentType === '3d' && (
          <IconButton
            onClick={handleReprocess}
            disabled={currentStatus === 'processing'}
            title="렌더링 재생성"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
          >
            <IconRefresh size={24} className={currentStatus === 'processing' ? 'spin' : ''} />
          </IconButton>
        )}
        <IconButton
          onClick={handleDownload}
          title="다운로드"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
        >
          <IconDownload size={24} />
        </IconButton>
        <IconButton
          onClick={onClose}
          title="닫기"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white' }}
        >
          <IconX size={24} />
        </IconButton>
      </Box>

      {/* 좌측 상단 상태 인디케이터 */}
      {currentType === '3d' && (
        <Box style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', gap: '0.5rem', zIndex: 1010 }}>
          <StatusIndicator label="ORIGIN" exists={!!currentUrl} />
          <StatusIndicator label="RENDER" exists={!!currentRenderUrl} processing={currentStatus === 'processing'} />
          <StatusIndicator label="THUMB" exists={!!currentThumbnailUrl} processing={isSnapshotUploading} />
        </Box>
      )}

      {/* 좌우 네비게이션 */}
      {groupMedia.length > 1 && currentIndex > 0 && (
        <IconButton
          onClick={handlePrev}
          style={{
            position: 'absolute',
            left: '2rem',
            zIndex: 1010,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            width: '48px',
            height: '48px'
          }}
        >
          <IconChevronLeft size={32} />
        </IconButton>
      )}

      {groupMedia.length > 1 && currentIndex < groupMedia.length - 1 && (
        <IconButton
          onClick={handleNext}
          style={{
            position: 'absolute',
            right: '2rem',
            zIndex: 1010,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            width: '48px',
            height: '48px'
          }}
        >
          <IconChevronRight size={32} />
        </IconButton>
      )}

      <Box
        style={{
          position: 'relative',
          maxWidth: '85vw',
          maxHeight: '85vh',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {imageError ? (
          <Box
            style={{
              width: '400px',
              height: '300px',
              backgroundColor: 'var(--color-surface-level-1)',
              borderRadius: 'var(--shape-radius-md)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-gap-md)',
            }}
          >
            <IconPhotoOff size={48} style={{ opacity: 0.5 }} />
            <Typography variant="body-medium" color="text-secondary">미디어를 불러올 수 없습니다</Typography>
            <Typography variant="caption" color="text-tertiary">{currentName}</Typography>
          </Box>
        ) : (
          <Box style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {imageLoading && currentType === 'image' && (
              <Box style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                <Typography variant="body-medium" style={{ color: 'white' }}>로딩 중...</Typography>
              </Box>
            )}
            
            {currentType === '3d' ? (
              <Box style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box style={{ 
                  width: '100%', 
                  height: '100%', 
                  maxWidth: '800px', 
                  maxHeight: '600px', 
                  aspectRatio: '4/3',
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  backgroundColor: '#f5f5f5'
                }}>
                  <ModelViewer 
                    modelUrl={currentRenderUrl || currentUrl} 
                    autoRotate={true}
                    onSnapshot={handleSnapshot}
                  />
                </Box>
              </Box>
            ) : (
              <img
                src={currentUrl}
                alt={currentName}
                style={{
                  maxWidth: '100%',
                  maxHeight: '85vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  opacity: imageLoading ? 0 : 1,
                  transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}
                onLoad={() => {
                  loadedUrls.add(currentUrl);
                  setImageLoading(false);
                }}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
            )}
          </Box>
        )}

        {/* 하단 정보 */}
        <Box style={{ position: 'absolute', bottom: '-3rem', textAlign: 'center', width: '100%' }}>
          {groupMedia.length > 1 && (
            <Typography variant="body-small" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>
              {currentIndex + 1} / {groupMedia.length}
            </Typography>
          )}
          <Typography variant="body-medium" style={{ color: 'white', fontWeight: 500 }}>
            {currentName}
          </Typography>
        </Box>
      </Box>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 2s linear infinite; }
      `}</style>
    </Box>
  );
}

export const ImageModal = memo(ImageModalComponent);
