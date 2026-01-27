import { memo } from 'preact/compat';
import { Box } from '@/ui-components/Layout/Box';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconX, IconDownload } from '@tabler/icons-preact';
import { downloadFileFromUrl } from '@/core/utils/fileUtils';
import { ModelViewer } from '../ModelViewer/ModelViewer';

interface ModelModalProps {
  modelUrl: string;
  originalUrl: string;
  fileName: string;
  onClose: () => void;
  classNamePrefix?: string;
}

function ModelModalComponent({ modelUrl, originalUrl, fileName, onClose }: ModelModalProps) {
  const handleDownload = async (e: Event) => {
    e.stopPropagation();
    await downloadFileFromUrl(originalUrl, fileName);
  };

  return (
    <Box
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'var(--color-background-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--space-padding-card-lg)',
      }}
      onClick={onClose}
    >
      <Box
        style={{
          position: 'relative',
          maxWidth: '90vw',
          maxHeight: '90vh',
          width: '800px',
          height: '600px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-surface-level-1)',
          borderRadius: 'var(--shape-radius-lg)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <Box
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-padding-md)',
            borderBottom: '1px solid var(--color-border-default)',
          }}
        >
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Box
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 500,
              }}
            >
              {fileName}
            </Box>
          </Box>
          <Box style={{ display: 'flex', gap: 'var(--space-gap-xs)' }}>
            {/* 다운로드 버튼 */}
            <IconButton onClick={handleDownload} size="small">
              <IconDownload size={20} />
            </IconButton>
            {/* 닫기 버튼 */}
            <IconButton onClick={onClose} size="small">
              <IconX size={20} />
            </IconButton>
          </Box>
        </Box>

        {/* 3D 뷰어 */}
        <Box style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <ModelViewer
            modelUrl={modelUrl}
            width={800}
            height={600}
            interactive={true}
            autoRotate={true}
          />
        </Box>
      </Box>
    </Box>
  );
}

// memo로 메모이제이션
export const ModelModal = memo(ModelModalComponent, (prevProps, nextProps) => {
  return (
    prevProps.modelUrl === nextProps.modelUrl &&
    prevProps.originalUrl === nextProps.originalUrl &&
    prevProps.fileName === nextProps.fileName &&
    prevProps.classNamePrefix === nextProps.classNamePrefix
  );
});
