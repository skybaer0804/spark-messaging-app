import { memo, useState } from 'preact/compat';
import { Box } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import { IconButton } from '@/components/ui/icon-button';
import { IconDownload, IconPhotoOff } from '@tabler/icons-preact';
import { Message } from '../../types';

interface ImageMessageProps {
  message: Message;
  handleDownload: (e: any) => void;
  onImageClick?: (url: string, fileName: string, groupId?: string) => void;
  onRetry?: (messageId: string) => void;
}

export const ImageMessage = memo(({ message, handleDownload, onImageClick, onRetry }: ImageMessageProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const fileData = message.fileData;

  if (!fileData) return null;

  const isSending = message.status === 'sending';
  const isFailed = message.status === 'failed';

  return (
    <Box style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
      {imageError ? (
        <Box
          style={{
            width: '300px',
            height: '200px',
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: 'var(--shape-radius-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-gap-sm)',
            border: '1px dashed var(--color-border-default)',
          }}
        >
          <IconPhotoOff size={32} style={{ opacity: 0.5 }} />
          <Typography variant="caption">이미지를 불러올 수 없습니다</Typography>
          <IconButton size="small" onClick={handleDownload} style={{ marginTop: 'var(--space-gap-xs)' }}>
            <IconDownload size={16} />
          </IconButton>
        </Box>
      ) : (
        <>
          {imageLoading && (
            <Box
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.05)',
                borderRadius: 'var(--shape-radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              <Typography variant="caption">로딩 중...</Typography>
            </Box>
          )}
          
          {/* Sending Overlay */}
          {isSending && (
            <Box
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                borderRadius: 'var(--shape-radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              <div className="spinner-border text-light" role="status" style={{ width: '2rem', height: '2rem', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }}>
                <span className="visually-hidden">Sending...</span>
              </div>
            </Box>
          )}

          {/* Failed Overlay */}
          {isFailed && (
            <Box
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                borderRadius: 'var(--shape-radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                flexDirection: 'column',
                gap: '8px',
                color: 'white',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation();
                onRetry?.(message._id);
              }}
            >
              <Typography variant="body-small" style={{ fontWeight: 'bold' }}>전송 실패</Typography>
              <Typography variant="caption" style={{ textDecoration: 'underline' }}>재시도</Typography>
            </Box>
          )}

          <img
            src={fileData.thumbnail || fileData.data}
            alt={fileData.fileName}
            loading="lazy"
            style={{
              maxWidth: '100%',
              maxHeight: '400px',
              borderRadius: 'var(--shape-radius-md)',
              cursor: 'pointer',
              display: 'block',
              opacity: imageLoading ? 0 : 1,
              transition: 'opacity 0.2s',
              objectFit: 'cover',
            }}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
            onClick={() => {
              const originalUrl = fileData.url || fileData.data;
              if (originalUrl) onImageClick?.(originalUrl, fileData.fileName, message.groupId);
            }}
          />
          {!isSending && !isFailed && (
            <IconButton
              size="small"
              onClick={handleDownload}
              style={{
                position: 'absolute',
                top: 'var(--space-gap-xs)',
                right: 'var(--space-gap-xs)',
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: 'white',
              }}
            >
              <IconDownload size={16} />
            </IconButton>
          )}
        </>
      )}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
});
