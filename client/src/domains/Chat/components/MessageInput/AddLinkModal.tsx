import { useState, useEffect } from 'preact/hooks';
import { Dialog } from '@/components/ui/dialog';
import { TextField as Input } from '@/components/ui/text-field';
import { Button } from '@/components/ui/button';
import { Stack, Box } from '@/components/ui/layout';

interface AddLinkModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (text: string, url: string) => void;
  initialText?: string;
  initialUrl?: string;
}

/**
 * 링크 추가 모달 컴포넌트
 * 텍스트와 URL을 입력받아 링크를 생성
 */
export function AddLinkModal({ open, onClose, onAdd, initialText = '', initialUrl = '' }: AddLinkModalProps) {
  const [text, setText] = useState(initialText || '링크텍스트');
  const [url, setUrl] = useState(initialUrl || '');

  // 모달이 열릴 때마다 초기값 설정
  useEffect(() => {
    if (open) {
      setText(initialText || '링크텍스트');
      setUrl(initialUrl || '');
      // 모달이 열리면 텍스트 입력 필드에 포커스
      setTimeout(() => {
        const textInput = document.getElementById('link-text-input') as HTMLInputElement;
        if (textInput) {
          textInput.focus();
          textInput.select();
        }
      }, 100);
    }
  }, [open, initialText, initialUrl]);

  const handleAdd = () => {
    if (text.trim() && url.trim()) {
      // URL에 프로토콜이 없으면 http:// 추가
      let finalUrl = url.trim();
      if (!finalUrl.match(/^https?:\/\//i)) {
        finalUrl = `http://${finalUrl}`;
      }
      onAdd(text.trim(), finalUrl);
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl+Enter 또는 Meta+Enter로 추가
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleAdd();
      return;
    }

    // URL 입력 필드에서 그냥 Enter만 눌러도 추가 (텍스트와 URL이 모두 있을 때)
    if (e.key === 'Enter' && text.trim() && url.trim()) {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="링크 추가"
      maxWidth="sm"
      actions={
        <Box style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', width: '100%' }}>
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button variant="primary" onClick={handleAdd} disabled={!text.trim() || !url.trim()}>
            추가
          </Button>
        </Box>
      }
    >
      <Stack spacing="md">
        <Input
          id="link-text-input"
          label="Text"
          value={text}
          onInput={(e) => setText((e.target as HTMLInputElement).value)}
          onKeyDown={handleKeyDown}
          placeholder="링크 텍스트"
          fullWidth
        />
        <Input
          id="link-url-input"
          label="URL"
          value={url}
          onInput={(e) => setUrl((e.target as HTMLInputElement).value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com"
          fullWidth
        />
      </Stack>
    </Dialog>
  );
}
