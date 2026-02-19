import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconDownload } from '@tabler/icons-preact';
import { downloadFileFromUrl } from '@/core/utils/fileUtils';

interface ImageMessageGridProps {
  images: {
    url: string;
    fileName: string;
    messageId: string;
    status?: 'sending' | 'sent' | 'failed' | 'read' | 'delivered';
    groupId?: string;
    processingStatus?: 'processing' | 'completed' | 'failed' | 'cancelled';
  }[];
  onImageClick?: (url: string, fileName: string, groupId?: string) => void;
  onRetry?: (messageId: string) => void;
  totalCount?: number;
}

const ImageOverlay = ({ 
  status, 
  onRetry, 
  messageId,
  processingStatus,
  isLast = false,
  extraCount = 0,
  showSpinner = true
}: { 
  status?: string; 
  onRetry?: (id: string) => void; 
  messageId: string;
  processingStatus?: string;
  isLast?: boolean;
  extraCount?: number;
  showSpinner?: boolean;
}) => {
  const isProcessing = processingStatus === 'processing';
  const isSending = status === 'sending';
  const isFailed = status === 'failed';

  if (isSending || isProcessing) {
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
            <div className="spinner-border text-light" style={{ width: '1.5rem', height: '1.5rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            {isProcessing && <Typography variant="caption" color="white" style={{ fontSize: '10px' }}>처리 중...</Typography>}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}
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
  const displayImages = images.slice(0, 4);
  const count = images.length;
  const effectiveTotal = totalCount || count;
  const extraCount = effectiveTotal - 4;

  if (count === 0) return null;

  const readyCount = images.filter(img => img.status === 'sent' && img.processingStatus === 'completed').length;
  const isUploading = images.some(img => img.status === 'sending');
  const isAnyLoading = images.some(img => img.status === 'sending' || img.processingStatus === 'processing');
  const firstLoadingIndex = images.findIndex(img => img.status === 'sending' || img.processingStatus === 'processing');

  const handleClick = (image: { url: string; fileName: string; status?: string; messageId: string; groupId?: string; processingStatus?: string }) => {
    if (image.status === 'failed' || image.status === 'sending') return;
    if (onImageClick) {
      // [v2.8.0] 단일 메시지 내 다중 파일의 경우 messageId를 함께 전달하여 모달에서 그룹 인식 가능하게 함
      onImageClick(image.url, image.fileName, image.messageId);
    }
  };

  const renderImageBox = (img: typeof images[0], style: any, isLast = false, index: number) => {
    // 다중 파일 전송 시, 현재 화면에 보이는 이미지 중 첫 번째 로딩 중인 이미지에만 스피너 표시
    // 만약 로딩 중인 이미지가 화면에 보이지 않는 위치(4번째 이후)에 있다면 마지막 보이는 이미지(isLast)에 표시
    const shouldShowSpinner = index === firstLoadingIndex || (isLast && firstLoadingIndex > index);

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
        onClick={() => handleClick(img)}
      >
        {img.url ? (
          <img
            src={img.url}
            alt={img.fileName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <Flex align="center" justify="center" style={{ width: '100%', height: '100%' }}>
            <Typography variant="caption" color="text-tertiary">이미지 없음</Typography>
          </Flex>
        )}
        <ImageOverlay 
          status={img.status} 
          onRetry={onRetry} 
          messageId={img.messageId} 
          processingStatus={img.processingStatus}
          isLast={isLast}
          extraCount={extraCount}
          showSpinner={shouldShowSpinner}
        />
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
            {isUploading ? '전송 중...' : '처리 중...'} ({readyCount}/{effectiveTotal})
          </Typography>
        ) : (
          <Typography variant="caption" color="text-tertiary">
            이미지 {effectiveTotal}개
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
      ) : (
        <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', width: '100%', aspectRatio: '1' }}>
          {displayImages.slice(0, 3).map((img, idx) => renderImageBox(img, {}, false, idx))}
          {renderImageBox(displayImages[3], {}, true, 3)}
        </Box>
      )}
    </Box>
  );
}
