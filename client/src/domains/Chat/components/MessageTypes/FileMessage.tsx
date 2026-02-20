import { memo } from 'preact/compat';
import { Box, Flex } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import { IconButton } from '@/components/ui/icon-button';
import { IconDownload } from '@tabler/icons-preact';
import { formatFileSize, getFileIcon } from '@/core/utils/fileUtils';
import { Message } from '../../types';

interface FileMessageProps {
  message: Message;
  handleDownload: (e: any) => void;
  onRetry?: (messageId: string) => void;
}

export const FileMessage = memo(({ message, handleDownload, onRetry }: FileMessageProps) => {
  const fileData = message.fileData;
  if (!fileData) return null;

  const isFailed = message.status === 'failed';
  const isSending = message.status === 'sending';

  return (
    <Flex 
      direction="column"
      gap="xs"
      style={{ width: '100%' }}
    >
      <Flex 
        align="center" 
        gap="sm" 
        style={{ 
          padding: 'var(--space-gap-sm)',
          borderRadius: 'var(--shape-radius-md)',
          backgroundColor: isFailed ? 'rgba(239, 68, 68, 0.1)' : 'rgba(0,0,0,0.05)',
          cursor: isFailed ? 'default' : 'pointer',
          transition: 'background-color 0.2s',
          border: isFailed ? '1px solid var(--color-status-error)' : 'none',
          opacity: isSending ? 0.7 : 1,
        }}
        onClick={isFailed ? undefined : handleDownload}
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
        {!isFailed ? (
          <IconButton size="small" onClick={handleDownload} disabled={isSending}>
            <IconDownload size={18} />
          </IconButton>
        ) : (
          <Box 
            style={{ 
              fontSize: '11px', 
              color: 'var(--color-status-error)', 
              fontWeight: 'bold',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onRetry?.(message._id);
            }}
          >
            재시도
          </Box>
        )}
      </Flex>
      {isSending && (
        <Box style={{ width: '100%', height: '2px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '1px', overflow: 'hidden' }}>
          <Box style={{ width: '30%', height: '100%', backgroundColor: 'var(--color-primary-main)', animation: 'progress-indefinite 2s infinite linear' }} />
        </Box>
      )}
      <style>{`
        @keyframes progress-indefinite {
          from { transform: translateX(-100%); }
          to { transform: translateX(300%); }
        }
      `}</style>
    </Flex>
  );
});
