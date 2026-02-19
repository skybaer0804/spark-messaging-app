import { useState, useCallback } from 'preact/hooks';
import { Box } from '@/ui-components/Layout/Box';
import { Paper } from '@/ui-components/Paper/Paper';
import { Typography } from '@/ui-components/Typography/Typography';
import { Button } from '@/ui-components/Button/Button';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Stack } from '@/ui-components/Layout/Stack';
import { IconX, IconFile, IconUpload } from '@tabler/icons-preact';
import { formatFileSize } from '@/core/utils/fileUtils';

interface FileAttachmentModalProps {
  open: boolean;
  onClose: () => void;
  files: File[];
  onSend: (files: File[]) => Promise<void>;
  onRemove: (index: number) => void;
  maxTotalSize?: number; // Default 1GB
}

export function FileAttachmentModal({
  open,
  onClose,
  files,
  onSend,
  onRemove,
  maxTotalSize = 1024 * 1024 * 1024 // 1GB
}: FileAttachmentModalProps) {
  const [isSending, setIsSending] = useState(false);

  // 총 용량 계산
  const totalSize = files.reduce((acc, file) => acc + file.size, 0);
  const isOverLimit = totalSize > maxTotalSize;

  const handleSend = useCallback(async () => {
    if (isSending || isOverLimit || files.length === 0) return;

    setIsSending(true);
    try {
      await onSend(files);
      onClose(); // 성공 시 모달 닫기
    } catch (error) {
      console.error('Failed to send files:', error);
      // 에러 처리는 부모 컴포넌트나 onSend 내부에서 Toast로 처리됨
    } finally {
      setIsSending(false);
    }
  }, [files, isSending, isOverLimit, onSend, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <Paper
        elevation={2}
        style={{
          width: '90%',
          maxWidth: '500px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundColor: 'var(--color-background-primary)',
        }}
        onClick={(e: Event) => e.stopPropagation()}
      >
        <Stack direction="row" justify="space-between" align="center" spacing="md" style={{ marginBottom: '16px' }}>
          <Typography variant="h6" fontWeight="bold">
            파일 전송 ({files.length}개)
          </Typography>
          <IconButton onClick={onClose} size="sm" icon={<IconX size={20} />} />
        </Stack>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', border: '1px solid var(--color-border-default)', borderRadius: '8px' }}>
          {files.map((file, index) => (
            <Stack
              key={`${file.name}-${index}`}
              direction="row"
              align="center"
              justify="space-between"
              spacing="sm"
              style={{
                padding: '12px',
                borderBottom: index < files.length - 1 ? '1px solid var(--color-border-default)' : 'none'
              }}
            >
              <Stack direction="row" align="center" spacing="md" style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'var(--color-background-secondary)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-secondary)',
                    flexShrink: 0
                  }}
                >
                  <IconFile size={24} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <Typography variant="body2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={file.name}>
                    {file.name}
                  </Typography>
                  <Typography variant="caption" color="secondary">
                    {formatFileSize(file.size)}
                  </Typography>
                </div>
              </Stack>
              <IconButton onClick={() => onRemove(index)} size="sm" color="error" icon={<IconX size={16} />} />
            </Stack>
          ))}
          {files.length === 0 && (
            <Box padding="xl" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              선택된 파일이 없습니다.
            </Box>
          )}
        </div>

        <Stack spacing="sm">
          <Stack direction="row" justify="space-between" align="center">
            <Typography variant="body2" color={isOverLimit ? 'error' : 'secondary'}>
              총 용량: {formatFileSize(totalSize)} / {formatFileSize(maxTotalSize)}
            </Typography>
            {isOverLimit && (
              <Typography variant="caption" color="error">
                용량 초과
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing="sm" justify="flex-end">
            <Button onClick={onClose} variant="text" disabled={isSending}>
              취소
            </Button>
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={isSending || isOverLimit || files.length === 0}
              startIcon={<IconUpload size={18} />}
            >
              {isSending ? '전송 중...' : '전송'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </div>
  );
}
