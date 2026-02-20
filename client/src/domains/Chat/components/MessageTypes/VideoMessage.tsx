import { memo } from 'preact/compat';
import { Box, Flex } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import { IconButton } from '@/components/ui/icon-button';
import { IconDownload, IconPlayerPlay } from '@tabler/icons-preact';
import { formatFileSize } from '@/core/utils/fileUtils';
import { Message } from '../../types';
import { useRef, useState } from 'preact/hooks';

interface VideoMessageProps {
  message: Message;
  handleDownload: (e: any) => void;
  onImageClick?: (url: string, fileName: string, idOrGroupId?: string, index?: number) => void;
}

export const VideoMessage = memo(({ message, handleDownload, onImageClick }: VideoMessageProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const fileData = message.fileData;

  if (!fileData) return null;

  const url = fileData.thumbnailUrl || fileData.thumbnail || fileData.url || (fileData as any).fileUrl || fileData.data;

  return (
    <Box 
      style={{ 
        position: 'relative', 
        maxWidth: '300px', 
        width: '100%',
        aspectRatio: '16/9',
        backgroundColor: 'var(--color-bg-tertiary)',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid var(--color-border-default)'
      }}
      onClick={() => onImageClick?.(url || '', fileData.fileName, message._id, 0)}
    >
      {videoError ? (
        <Flex align="center" gap="sm" direction="column" justify="center" style={{ width: '100%', height: '100%', padding: '16px' }}>
          <Box style={{ fontSize: '2rem' }}>🎬</Box>
          <Typography variant="body-small" style={{ textAlign: 'center', wordBreak: 'break-all' }}>{fileData.fileName}</Typography>
          <IconButton size="small" onClick={handleDownload}><IconDownload size={18} /></IconButton>
        </Flex>
      ) : (
        <video 
          ref={videoRef} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          muted
          playsInline
          onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play().catch(() => {})}
          onMouseLeave={(e) => {
            const v = e.currentTarget as HTMLVideoElement;
            v.pause();
            v.currentTime = 0;
          }}
          onError={() => setVideoError(true)}
        >
          <source src={url} type={fileData.mimeType || 'video/mp4'} />
        </video>
      )}
      
      {/* 재생 오버레이 아이콘 (hover 전에도 보이게 하거나 hover 시에만 보이게 선택 가능) */}
      {!videoError && (
        <Box style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0,0,0,0.4)',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          pointerEvents: 'none',
          opacity: 0.8
        }}>
          <IconPlayerPlay size={24} />
        </Box>
      )}
    </Box>
  );
});
