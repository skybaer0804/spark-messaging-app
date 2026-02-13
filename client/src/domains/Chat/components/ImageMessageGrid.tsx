import { Box } from '@/ui-components/Layout/Box';

interface ImageMessageGridProps {
  images: {
    url: string;
    fileName: string;
    messageId: string;
    status?: 'sending' | 'sent' | 'failed' | 'read' | 'delivered';
    groupId?: string; // [v2.6.0] 추가
  }[];
  onImageClick?: (url: string, fileName: string, groupId?: string) => void;
  onRetry?: (messageId: string) => void;
}

const ImageOverlay = ({ status, onRetry, messageId }: { status?: string; onRetry?: (id: string) => void; messageId: string }) => {
  if (status === 'sending') {
    return (
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
      }}>
        <div className="spinner-border text-light" style={{ width: '1.5rem', height: '1.5rem', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 4,
          cursor: 'pointer',
          color: 'white',
          gap: '4px'
        }}
        onClick={(e) => {
          e.stopPropagation();
          onRetry?.(messageId);
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>전송 실패</span>
        <span style={{ fontSize: '10px', textDecoration: 'underline' }}>재시도</span>
      </div>
    );
  }
  return null;
};

export function ImageMessageGrid({ images, onImageClick, onRetry }: ImageMessageGridProps) {
  const count = images.length;
  if (count === 0) return null;

  const handleClick = (image: { url: string; fileName: string; status?: string; messageId: string; groupId?: string }) => {
    if (image.status === 'failed' || image.status === 'sending') return;
    if (onImageClick) {
      onImageClick(image.url, image.fileName, image.groupId);
    }
  };

  // Helper to render image box with overlay
  const renderImageBox = (img: typeof images[0], style: any) => (
    <Box
      key={img.messageId}
      style={{
        ...style,
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: img.status === 'failed' || img.status === 'sending' ? 'default' : 'pointer',
        border: '1px solid var(--color-border-default)',
        position: 'relative'
      }}
      onClick={() => handleClick(img)}
    >
      <img
        src={img.url}
        alt={img.fileName}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <ImageOverlay status={img.status} onRetry={onRetry} messageId={img.messageId} />
    </Box>
  );

  // 1 image
  if (count === 1) {
    return renderImageBox(images[0], { width: '100%', maxWidth: '300px', aspectRatio: '1' });
  }

  // 2 images
  if (count === 2) {
    return (
      <Box style={{ display: 'flex', gap: '4px', maxWidth: '300px', width: '100%', aspectRatio: '1.6' }}>
        {images.map((img) => renderImageBox(img, { flex: 1 }))}
      </Box>
    );
  }

  // 3 images
  if (count === 3) {
    return (
      <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', maxWidth: '300px', width: '100%', aspectRatio: '1' }}>
        {renderImageBox(images[0], { gridColumn: '1 / 3', height: '100%' })}
        {renderImageBox(images[1], {})}
        {renderImageBox(images[2], {})}
      </Box>
    );
  }

  // 4 images
  if (count === 4) {
    return (
      <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', maxWidth: '300px', width: '100%', aspectRatio: '1' }}>
        {images.map((img) => renderImageBox(img, {}))}
      </Box>
    );
  }

  // 5+ images
  const extraCount = count - 4;
  return (
    <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', maxWidth: '300px', width: '100%', aspectRatio: '1' }}>
      {images.slice(0, 3).map((img) => renderImageBox(img, {}))}
      {/* 4th item with overlay */}
      <Box
        style={{
          borderRadius: '12px',
          overflow: 'hidden',
          cursor: images[3].status === 'failed' || images[3].status === 'sending' ? 'default' : 'pointer',
          position: 'relative',
          border: '1px solid var(--color-border-default)',
        }}
        onClick={() => handleClick(images[3])}
      >
        <img
          src={images[3].url}
          alt={images[3].fileName}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <ImageOverlay status={images[3].status} onRetry={onRetry} messageId={images[3].messageId} />
        {images[3].status !== 'failed' && images[3].status !== 'sending' && (
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold',
            zIndex: 3
          }}>
            +{extraCount}
          </div>
        )}
      </Box>
    </Box>
  );
}
