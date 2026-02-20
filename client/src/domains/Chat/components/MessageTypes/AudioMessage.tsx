import { memo } from 'preact/compat';
import { Box, Flex } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import { IconButton } from '@/components/ui/icon-button';
import { IconDownload } from '@tabler/icons-preact';
import { formatFileSize } from '@/core/utils/fileUtils';
import { Message } from '../../types';
import { useRef } from 'preact/hooks';

interface AudioMessageProps {
  message: Message;
  handleDownload: (e: any) => void;
}

export const AudioMessage = memo(({ message, handleDownload }: AudioMessageProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileData = message.fileData;

  if (!fileData) return null;

  return (
    <Box style={{ padding: '12px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '8px', minWidth: '250px' }}>
      <Flex direction="column" gap="sm">
        <Flex align="center" gap="sm">
          <Box style={{ fontSize: '2rem' }}>🎵</Box>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body-medium" style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fileData.fileName}
            </Typography>
            <Typography variant="caption" style={{ opacity: 0.7 }}>
              {formatFileSize(fileData.size)}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleDownload}>
            <IconDownload size={18} />
          </IconButton>
        </Flex>
        <audio ref={audioRef} controls style={{ width: '100%', height: '32px' }}>
          <source src={fileData.url || fileData.data} type={fileData.mimeType || 'audio/mpeg'} />
        </audio>
      </Flex>
    </Box>
  );
});
