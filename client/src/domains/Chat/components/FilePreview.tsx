import { memo } from 'preact/compat';
import { formatFileSize, getFileIcon } from '@/core/utils/fileUtils';
import { Paper } from '@/ui-components/Paper/Paper';
import { Typography } from '@/ui-components/Typography/Typography';
import { Flex } from '@/ui-components/Layout/Flex';
import { Box } from '@/ui-components/Layout/Box';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Stack } from '@/ui-components/Layout/Stack';
import { IconX } from '@tabler/icons-preact';
import './Chat.scss';

interface FilePreviewProps {
  files: File[];
  uploadingFile?: File | null;
  uploadProgress?: number;
  onRemove: (index: number) => void;
  classNamePrefix?: string;
}

function FilePreviewComponent({ files, uploadingFile, uploadProgress = 0, onRemove }: FilePreviewProps) {
  if (files.length === 0 && !uploadingFile) {
    return null;
  }

  return (
    <Box
      className="file-preview-container"
      style={{
        width: '100%',
        overflowX: 'auto',
        padding: 'var(--space-padding-xs) 0',
      }}
    >
      <Flex gap="xs" style={{ minWidth: 'min-content' }}>
        {files.map((file: File, index: number) => (
          <Paper
            key={index}
            variant="outlined"
            padding="sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-gap-xs)',
              width: '240px',
              flexShrink: 0,
              backgroundColor: 'var(--color-background-secondary)'
            }}
          >
            <Box style={{ fontSize: '1.25rem' }}>{getFileIcon(file.type)}</Box>
            <Box style={{ flex: 1, overflow: 'hidden' }}>
              <Typography
                variant="body-medium"
                style={{
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {file.name}
              </Typography>
              <Typography variant="caption" color="text-tertiary">
                {formatFileSize(file.size)}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => onRemove(index)} color="error">
              <IconX size={14} />
            </IconButton>
          </Paper>
        ))}
        {uploadingFile && (
          <Box
            style={{
              padding: 'var(--space-padding-card-xs) var(--space-padding-card-sm)',
              background: 'var(--color-background-secondary)',
              borderRadius: 'var(--shape-radius-sm)',
              width: '240px',
              flexShrink: 0,
            }}
          >
            <Flex align="center" gap="sm">
              <Box style={{ flex: 1 }}>
                <Typography variant="caption" color="interactive-primary" style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {uploadingFile.name} 전송 중...
                </Typography>
                <Box
                  style={{
                    height: '6px',
                    width: '100%',
                    background: 'var(--color-border-default)',
                    borderRadius: 'var(--shape-radius-xs)',
                    marginTop: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    style={{
                      height: '100%',
                      width: `${uploadProgress}%`,
                      background: 'var(--color-interactive-primary)',
                      borderRadius: 'var(--shape-radius-xs)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
              </Box>
            </Flex>
          </Box>
        )}
      </Flex>
    </Box>
  );
}

// memo로 메모이제이션하여 files 배열과 uploadProgress가 변경되지 않으면 리렌더링 방지
export const FilePreview = memo(FilePreviewComponent, (prevProps, nextProps) => {
  return (
    prevProps.files.length === nextProps.files.length &&
    prevProps.uploadProgress === nextProps.uploadProgress &&
    prevProps.classNamePrefix === nextProps.classNamePrefix
  );
});
