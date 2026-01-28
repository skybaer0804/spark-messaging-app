import { memo, useState } from 'preact/compat';
import { Box } from '@/ui-components/Layout/Box';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconDownload, IconPhotoOff } from '@tabler/icons-preact';
import { Message } from '../../types';

interface ImageMessageProps {
  message: Message;
  handleDownload: (e: any) => void;
  onImageClick?: (url: string, fileName: string) => void;
}

export const ImageMessage = memo(({ message, handleDownload, onImageClick }: ImageMessageProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const fileData = message.fileData;

  if (!fileData) return null;

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
              }}
            >
              <Typography variant="caption">로딩 중...</Typography>
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
              if (originalUrl) onImageClick?.(originalUrl, fileData.fileName);
            }}
          />
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
        </>
      )}
    </Box>
  );
});
