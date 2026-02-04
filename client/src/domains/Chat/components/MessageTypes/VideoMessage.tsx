import { memo } from 'preact/compat';
import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconDownload } from '@tabler/icons-preact';
import { formatFileSize } from '@/core/utils/fileUtils';
import { Message } from '../../types';
import { useRef, useState } from 'preact/hooks';

interface VideoMessageProps {
  message: Message;
  handleDownload: (e: any) => void;
}

export const VideoMessage = memo(({ message, handleDownload }: VideoMessageProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const fileData = message.fileData;

  if (!fileData) return null;

  return (
    <Box style={{ position: 'relative', maxWidth: '100%' }}>
      {videoError ? (
        <Flex align="center" gap="sm" direction="column" justify="center" style={{ padding: '16px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
          <Box style={{ fontSize: '3rem' }}>🎬</Box>
          <Typography variant="body-medium">{fileData.fileName}</Typography>
          <IconButton size="small" onClick={handleDownload}><IconDownload size={18} /></IconButton>
        </Flex>
      ) : (
        <video 
          ref={videoRef} 
          controls 
          style={{ width: '100%', maxWidth: '600px', maxHeight: '400px', borderRadius: '8px', display: 'block' }}
          onError={() => setVideoError(true)}
        >
          <source src={fileData.url || fileData.data} type={fileData.mimeType || 'video/mp4'} />
        </video>
      )}
    </Box>
  );
});
