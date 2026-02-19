import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconDownload, Icon3dCubeSphere, IconClick, IconPlayerPlay } from '@tabler/icons-preact';
import { downloadFileFromUrl } from '@/core/utils/fileUtils';

interface ImageMessageGridProps {
  images: {
    url: string;
    fileName: string;
    messageId: string;
    status?: 'sending' | 'sent' | 'failed' | 'read' | 'delivered';
    groupId?: string;
    processingStatus?: 'processing' | 'completed' | 'failed' | 'cancelled';
    fileType?: string;
  }[];
  onImageClick?: (url: string, fileName: string, idOrGroupId?: string, index?: number) => void;
  onRetry?: (messageId: string) => void;
  totalCount?: number;
}

const ImageOverlay = ({ 
  status, 
  onRetry, 
  messageId,
  processingStatus,
  fileType,
  hasThumbnail, // hasThumbnail 추가
  isLast = false,
  extraCount = 0,
  showSpinner = true
}: { 
  status?: string; 
  onRetry?: (id: string) => void; 
  messageId: string;
  processingStatus?: string;
  fileType?: string;
  hasThumbnail?: boolean; // 타입 추가
  isLast?: boolean;
  extraCount?: number;
  showSpinner?: boolean;
}) => {
  const isProcessing = processingStatus === 'processing';
  const isCompleted = processingStatus === 'completed';
  const isSending = status === 'sending';
  const isFailed = status === 'failed';

  if (isSending || isProcessing) {
    // [v2.9.2] 썸네일이 이미 있는 경우, 오버레이("처리 중")를 숨겨서 이미지를 보여줌
    if (hasThumbnail && isProcessing) return null;

    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        gap: '8px'
      }}>
        {showSpinner && (
          <>
            <div className="spinner-border text-light" style={{ width: '1.2rem', height: '1.2rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: isProcessing ? 'var(--color-primary-main)' : '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            {isSending && <Typography variant="caption" color="white" style={{ fontSize: '10px' }}>전송 중...</Typography>}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}
      </div>
    );
  }

  // 3D/Video 파일 완료 시 호버 효과를 위한 오버레이
  if ((fileType === '3d' || fileType === 'video') && isCompleted && !isLast) {
    const is3D = fileType === '3d';
    return (
      <div className="image-overlay-hover" style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        transition: 'background-color 0.2s',
        opacity: 0,
        color: 'white',
        gap: '4px'
      }}>
        {is3D ? <Icon3dCubeSphere size={24} /> : <IconPlayerPlay size={24} />}
        <Typography variant="caption" color="white" style={{ fontSize: '10px', fontWeight: 'bold' }}>
          {is3D ? '3D 상세보기' : '비디오 재생'}
        </Typography>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4,
          cursor: 'pointer',
          color: 'white',
          gap: '4px'
        }}
        onClick={(e) => {
          e.stopPropagation();
          onRetry?.(messageId);
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>전송 실패</span>
        <span style={{ fontSize: '10px', textDecoration: 'underline' }}>재시도</span>
      </div>
    );
  }

  if (isLast && extraCount > 0) {
    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '20px',
        fontWeight: 'bold',
        zIndex: 3
      }}>
        +{extraCount}
      </div>
    );
  }

  return null;
};

export function ImageMessageGrid({ images, onImageClick, onRetry, totalCount }: ImageMessageGridProps) {
  const displayImages = images.slice(0, 6);
  const count = images.length;
  const effectiveTotal = totalCount || count;
  const extraCount = effectiveTotal - 6;

  if (count === 0) return null;

  const readyCount = images.filter(img => img.status === 'sent').length;
  const isUploading = images.some(img => img.status === 'sending');
  const isAnyLoading = isUploading; // 오직 업로드 중일 때만 로딩 상태로 간주
  const firstLoadingIndex = images.findIndex(img => img.status === 'sending');

  const handleClick = (image: { url: string; fileName: string; status?: string; messageId: string; groupId?: string; processingStatus?: string }, index: number) => {
    if (image.status === 'failed' || image.status === 'sending') return;
    if (onImageClick) {
      // [v2.8.0] 단일 메시지 내 다중 파일의 경우 messageId와 index를 함께 전달하여 모달에서 정확한 위치 인식 가능하게 함
      onImageClick(image.url, image.fileName, image.messageId, index);
    }
  };

  const renderImageBox = (img: typeof images[0], style: any, isLast = false, index: number) => {
    // 다중 파일 전송 시, 현재 화면에 보이는 이미지 중 첫 번째 로딩 중인 이미지에만 스피너 표시
    // 만약 로딩 중인 이미지가 화면에 보이지 않는 위치(6번째 이후)에 있다면 마지막 보이는 이미지(isLast)에 표시
    const shouldShowSpinner = index === firstLoadingIndex || (isLast && firstLoadingIndex > index);

    // 썸네일 표시 여부: 이미지 타입이거나 url이 존재하는 경우 (3D 변환 중이라도 썸네일이 있으면 표시)
    // 비디오의 경우 원본 URL만 있어도 프리뷰를 보여줄 수 있으므로 조건 완화
    const hasPreview = !!(img.url && !img.url.startsWith('blob:')) || (img.fileType === 'video' && !!img.url);

    return (
      <Box
        key={img.messageId + (img.url || img.fileName) + index}
        style={{
          ...style,
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: img.status === 'failed' || img.status === 'sending' ? 'default' : 'pointer',
          border: '1px solid var(--color-border-default)',
          position: 'relative',
          backgroundColor: 'var(--color-bg-tertiary)'
        }}
        onClick={() => handleClick(img, index)}
      >
        {hasPreview ? (
          <Box style={{ width: '100%', height: '100%', position: 'relative' }}>
            {img.fileType === 'video' ? (
              <video
                src={img.url}
                muted
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
                onMouseLeave={(e) => {
                  const v = e.currentTarget as HTMLVideoElement;
                  v.pause();
                  v.currentTime = 0;
                }}
              />
            ) : (
              <img
                src={img.url}
                alt={img.fileName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
            {img.fileType === '3d' && (
              <Box style={{ position: 'absolute', top: '6px', left: '6px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '4px', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                <Icon3dCubeSphere size={12} color="white" />
                <Typography variant="caption" color="white" style={{ fontSize: '9px', fontWeight: 'bold' }}>3D</Typography>
              </Box>
            )}
            {img.fileType === 'video' && (
              <Box style={{ position: 'absolute', top: '6px', left: '6px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '4px', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 1 }}>
                <IconPlayerPlay size={12} color="white" />
                <Typography variant="caption" color="white" style={{ fontSize: '9px', fontWeight: 'bold' }}>VIDEO</Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Flex align="center" justify="center" direction="column" style={{ width: '100%', height: '100%', backgroundColor: 'var(--color-bg-secondary)', gap: '8px', padding: '12px' }}>
            <Box style={{ color: 'var(--color-text-tertiary)', opacity: 0.6 }}>
              {img.fileType === '3d' ? <Icon3dCubeSphere size={32} /> : 
               img.fileType === 'video' ? <IconPlayerPlay size={32} /> : '🖼️'}
            </Box>
            <Flex direction="column" align="center" gap="xs">
              <Typography variant="caption" color="text-secondary" style={{ fontSize: '11px', fontWeight: 'bold', textAlign: 'center' }}>
                {img.fileType === '3d' ? '3D 모델' : 
                 img.fileType === 'video' ? '비디오' : '이미지 없음'}
              </Typography>
              <Flex align="center" gap="xs" style={{ color: 'var(--color-primary-main)' }}>
                <IconClick size={12} />
                <Typography variant="caption" color="primary" style={{ fontSize: '10px', fontWeight: 500 }}>클릭하여 확인</Typography>
              </Flex>
            </Flex>
          </Flex>
        )}
        <ImageOverlay 
          status={img.status} 
          onRetry={onRetry} 
          messageId={img.messageId} 
          processingStatus={img.processingStatus}
          fileType={img.fileType}
          hasThumbnail={hasPreview} // 수정
          isLast={isLast}
          extraCount={extraCount}
          showSpinner={shouldShowSpinner}
        />
        <style>{`
          .image-overlay-hover:hover {
            background-color: rgba(0,0,0,0.4) !important;
            opacity: 1 !important;
          }
        `}</style>
      </Box>
    );
  };

  const handleDownloadAll = async (e: any) => {
    e.stopPropagation();
    for (const img of images) {
      if (img.url) {
        await downloadFileFromUrl(img.url, img.fileName);
        // 브라우저 동시 다운로드 제한 방지를 위해 약간의 간격
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  };

  return (
    <Box style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
      <Flex align="center" justify="space-between" style={{ marginBottom: '8px', padding: '0 4px' }}>
        {isAnyLoading ? (
          <Typography variant="caption" color="primary" style={{ fontWeight: 'bold' }}>
            전송 중... ({readyCount}/{effectiveTotal})
          </Typography>
        ) : (
          <Typography variant="caption" color="text-tertiary">
            미디어 {effectiveTotal}개
          </Typography>
        )}
        
        {count > 1 && !isAnyLoading && (
          <IconButton size="small" onClick={handleDownloadAll} title="전체 다운로드">
            <IconDownload size={14} />
          </IconButton>
        )}
      </Flex>

      {isAnyLoading && (
        <Box style={{ marginBottom: '8px', padding: '0 4px' }}>
          <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--color-bg-tertiary)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${(readyCount / effectiveTotal) * 100}%`, height: '100%', backgroundColor: 'var(--color-primary-main)', transition: 'width 0.3s' }} />
          </div>
        </Box>
      )}

      {/* Grid Layouts */}
      {count === 1 ? (
        renderImageBox(images[0], { width: '100%', aspectRatio: '1' }, false, 0)
      ) : count === 2 ? (
        <Box style={{ display: 'flex', gap: '4px', width: '100%', aspectRatio: '1.6' }}>
          {images.map((img, idx) => renderImageBox(img, { flex: 1 }, false, idx))}
        </Box>
      ) : count === 3 ? (
        <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', width: '100%', aspectRatio: '1' }}>
          {renderImageBox(images[0], { gridColumn: '1 / 3', height: '100%' }, false, 0)}
          {renderImageBox(images[1], {}, false, 1)}
          {renderImageBox(images[2], {}, false, 2)}
        </Box>
      ) : count === 4 ? (
        <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', width: '100%', aspectRatio: '1' }}>
          {displayImages.slice(0, 3).map((img, idx) => renderImageBox(img, {}, false, idx))}
          {renderImageBox(displayImages[3], {}, extraCount > 0, 3)}
        </Box>
      ) : (
        <Box style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '4px', 
          width: '100%', 
          aspectRatio: count === 5 ? '1' : '0.66' // 5개면 1:1에 가깝게, 6개면 가로가 더 길게
        }}>
          {displayImages.slice(0, count === 5 ? 4 : 5).map((img, idx) => renderImageBox(img, {}, false, idx))}
          {renderImageBox(displayImages[count === 5 ? 4 : 5], {}, extraCount > 0, count === 5 ? 4 : 5)}
        </Box>
      )}
    </Box>
  );
}
