import { memo } from 'preact/compat';
import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconDownload } from '@tabler/icons-preact';
import { formatFileSize, getFileIcon } from '@/core/utils/fileUtils';
import { Message } from '../../types';

interface FileMessageProps {
  message: Message;
  handleDownload: (e: any) => void;
}

export const FileMessage = memo(({ message, handleDownload }: FileMessageProps) => {
  const fileData = message.fileData;
  if (!fileData) return null;

  return (
    <Flex 
      align="center" 
      gap="sm" 
      style={{ 
        padding: 'var(--space-gap-sm)',
        borderRadius: 'var(--shape-radius-md)',
        backgroundColor: 'rgba(0,0,0,0.05)',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
      }}
      onClick={handleDownload}
    >
      <Box style={{ fontSize: '2rem' }}>{getFileIcon(fileData.mimeType)}</Box>
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Typography 
          variant="body-medium" 
          style={{ 
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {fileData.fileName}
        </Typography>
        <Typography variant="caption" style={{ opacity: 0.7 }}>
          {formatFileSize(fileData.size)}
          {fileData.mimeType && (
            <span style={{ marginLeft: 'var(--space-gap-xs)' }}>
              • {fileData.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
            </span>
          )}
        </Typography>
      </Box>
      <IconButton size="small" onClick={handleDownload}>
        <IconDownload size={18} />
      </IconButton>
    </Flex>
  );
});
