import { memo, useState, useEffect } from 'preact/compat';
import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconButton } from '@/ui-components/Button/IconButton';
import { DotsLoading } from '@/ui-components/Loading';
import { IconDownload, Icon3dCubeSphere, IconClick } from '@tabler/icons-preact';
import { formatFileSize } from '@/core/utils/fileUtils';
import { ModelViewer } from '../ModelViewer/ModelViewer';
import { Message } from '../../types';

interface Model3DMessageProps {
  message: Message;
  handleDownload: (e: any) => void;
  setShowModelModal: (show: boolean) => void;
}

export const Model3DMessage = memo(({ message, handleDownload, setShowModelModal }: Model3DMessageProps) => {
  const [isTimedOut, setIsTimedOut] = useState(false);
  const fileData = message.fileData;
  if (!fileData) return null;

  const hasRenderUrl = !!(fileData.renderUrl || message.renderUrl);
  const hasThumbnail = !!fileData.thumbnail;
  
  // [v2.9.0] 60초 변환 대기 타임아웃 (서버 순차 처리 대기 고려)
  useEffect(() => {
    if (!hasRenderUrl && !hasThumbnail && message.status !== 'failed') {
      const timer = setTimeout(() => {
        setIsTimedOut(true);
      }, 60000); // 60초
      return () => clearTimeout(timer);
    } else {
      setIsTimedOut(false);
    }
  }, [hasRenderUrl, hasThumbnail, message.status]);

  // [v2.9.0] GLB 렌더 URL만 뷰어에 사용 (원본 .ply/.stl/.obj는 GLTFLoader로 로드 불가)
  const availableUrl = fileData.renderUrl || message.renderUrl || '';
  const canOpenModal = hasRenderUrl;

  // 렌더링 우선순위: 썸네일(이미지) > 렌더파일(3D 뷰어) > 로딩/타임아웃
  const renderPreview = () => {
    if (hasThumbnail) {
      return (
        <img
          src={fileData.thumbnail}
          alt={fileData.fileName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.2s'
          }}
        />
      );
    }
    
    if (hasRenderUrl) {
      return (
        <ModelViewer
          modelUrl={availableUrl}
          width={150}
          height={150}
          interactive={false}
        />
      );
    }

    if (isTimedOut) {
      return (
        <Flex direction="column" align="center" justify="center" gap="xs" style={{ padding: '8px', textAlign: 'center' }}>
          <Typography variant="caption" color="text-secondary" style={{ fontSize: '11px', lineHeight: 1.2 }}>
            변환이 지연되고 있습니다
          </Typography>
          <Typography 
            variant="caption" 
            color="primary" 
            style={{ 
              fontSize: '10px', 
              cursor: 'pointer', 
              textDecoration: 'underline' 
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsTimedOut(false);
            }}
          >
            기다리기
          </Typography>
        </Flex>
      );
    }

    // 파일은 있으나 아직 변환 전인 경우 (썸네일도 없고 렌더파일도 없는 경우)
    return (
      <Flex direction="column" align="center" justify="center" gap="sm" style={{ padding: '12px' }}>
        <Icon3dCubeSphere size={32} color="var(--color-text-tertiary)" style={{ opacity: 0.5 }} />
        <Flex direction="column" align="center" gap="xs">
          <DotsLoading />
          <Typography variant="caption" style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            3D 변환 중...
          </Typography>
        </Flex>
      </Flex>
    );
  };

  return (
    <Box style={{ position: 'relative', display: 'inline-block', maxWidth: '100%' }}>
      <Box
        style={{
          cursor: canOpenModal ? 'pointer' : 'default',
          borderRadius: 'var(--shape-radius-md)',
          overflow: 'hidden',
          width: '150px',
          height: '150px',
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid var(--color-border-default)',
          position: 'relative'
        }}
        onClick={() => {
          if (canOpenModal) {
            setShowModelModal(true);
          }
        }}
      >
        {renderPreview()}
        {(hasThumbnail || hasRenderUrl) && (
          <>
            <Box
              style={{
                position: 'absolute',
                top: 'var(--space-gap-xs)',
                left: 'var(--space-gap-xs)',
                backgroundColor: 'rgba(0,0,0,0.6)',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                zIndex: 1
              }}
            >
              <Icon3dCubeSphere size={12} />
              3D
            </Box>
            <div className="model-3d-overlay" style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              gap: '4px',
              transition: 'background-color 0.2s',
              opacity: 0,
              zIndex: 2
            }}>
              <IconClick size={24} />
              <Typography variant="caption" color="white" style={{ fontSize: '10px', fontWeight: 'bold' }}>3D 뷰어 열기</Typography>
            </div>
          </>
        )}
      </Box>
      <style>{`
        .model-3d-overlay:hover {
          background-color: rgba(0,0,0,0.4) !important;
          opacity: 1 !important;
        }
      `}</style>
      <IconButton
        size="small"
        onClick={handleDownload}
        style={{
          position: 'absolute',
          top: 'var(--space-gap-xs)',
          right: 'var(--space-gap-xs)',
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: 'white',
          zIndex: 2
        }}
      >
        <IconDownload size={16} />
      </IconButton>
      <Box style={{ marginTop: 'var(--space-gap-xs)' }}>
        <Typography variant="caption" style={{ display: 'block', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {fileData.fileName}
        </Typography>
        <Typography variant="caption" style={{ opacity: 0.7 }}>
          {formatFileSize(fileData.size)}
        </Typography>
      </Box>
    </Box>
  );
});
