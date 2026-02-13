import { memo, useState, useMemo, useEffect } from 'preact/compat';
import { Box } from '@/ui-components/Layout/Box';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconX, IconDownload, IconPhotoOff, IconChevronLeft, IconChevronRight } from '@tabler/icons-preact';
import { downloadFileFromUrl } from '@/core/utils/fileUtils';
import { Typography } from '@/ui-components/Typography/Typography';
import type { Message } from '../types';
import './Chat.scss';

interface ImageModalProps {
  url: string;
  fileName: string;
  groupId?: string;
  allMessages?: Message[];
  onClose: () => void;
  classNamePrefix?: string;
}

function ImageModalComponent({ url, fileName, groupId, allMessages = [], onClose }: ImageModalProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  // [v2.6.0] 캐시된 이미지 관리 (한 번 로드된 이미지는 다시 로딩을 띄우지 않음)
  const [loadedUrls] = useState(() => new Set<string>());

  // [v2.6.0] 그룹화된 이미지 목록 추출
  const groupImages = useMemo(() => {
    if (!groupId || !allMessages.length) return [];
    return allMessages.filter(msg => 
      msg.groupId === groupId && msg.fileData?.fileType === 'image'
    );
  }, [groupId, allMessages]);

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (groupImages.length > 0) {
      const foundIndex = groupImages.findIndex(img => img.fileData?.url === url || img.fileData?.thumbnail === url);
      return foundIndex >= 0 ? foundIndex : 0;
    }
    return -1;
  });

  // 현재 표시할 이미지 정보
  const currentImage = currentIndex >= 0 ? groupImages[currentIndex] : null;
  const currentUrl = currentImage?.fileData?.url || url;
  const currentName = currentImage?.fileData?.fileName || fileName;

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
    if (currentIndex < groupImages.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleDownload = async (e: Event) => {
    e.stopPropagation();
    await downloadFileFromUrl(currentUrl, currentName);
  };

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, groupImages.length]);

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
      {/* 닫기 버튼 (최상단) */}
      <Box style={{ position: 'absolute', top: '2rem', right: '2rem', display: 'flex', gap: '1rem', zIndex: 1010 }}>
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

      {/* 좌측 화살표 */}
      {groupImages.length > 1 && currentIndex > 0 && (
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

      {/* 우측 화살표 */}
      {groupImages.length > 1 && currentIndex < groupImages.length - 1 && (
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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 이미지 또는 에러 표시 */}
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
            <Typography variant="body-medium" color="text-secondary">
              이미지를 불러올 수 없습니다
            </Typography>
            <Typography variant="caption" color="text-tertiary">
              {currentName}
            </Typography>
          </Box>
        ) : (
          <>
            {imageLoading && (
              <Box
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.1)',
                  zIndex: 5
                }}
              >
                <Typography variant="body-medium" style={{ color: 'white' }}>로딩 중...</Typography>
              </Box>
            )}
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
          </>
        )}

        {/* 하단 정보 (카운트 및 파일명) */}
        <Box style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          {groupImages.length > 1 && (
            <Typography variant="body-small" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.25rem' }}>
              {currentIndex + 1} / {groupImages.length}
            </Typography>
          )}
          <Typography variant="body-medium" style={{ color: 'white', fontWeight: 500 }}>
            {currentName}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// memo로 메모이제이션하여 props 변경 시만 리렌더링
export const ImageModal = memo(ImageModalComponent);
