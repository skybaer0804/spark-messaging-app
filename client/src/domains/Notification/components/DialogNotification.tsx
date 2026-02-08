import { useTheme } from '@/core/context/ThemeProvider';
import { Dialog } from '@/ui-components/Dialog/Dialog';
import { Button } from '@/ui-components/Button/Button';
import { Input } from '@/ui-components/Input/Input';
import { Select } from '@/ui-components/Select/Select';
import { Box } from '@/ui-components/Layout/Box';
import { Stack } from '@/ui-components/Layout/Stack';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconSend, IconCalendar, IconX } from '@tabler/icons-preact';
import type { Workspace } from '../../Chat/types/ChatRoom';

interface DialogNotificationProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'view';
  title: string;
  setTitle: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  scheduledDate: string;
  setScheduledAt: (value: string) => void;
  targetType: 'all' | 'workspace';
  setTargetType: (value: 'all' | 'workspace') => void;
  targetId: string;
  setTargetId: (value: string) => void;
  workspaceList: Workspace[];
  isConnected: boolean;
  handleSend: () => Promise<void>;
}

export function DialogNotification({
  open,
  onClose,
  mode,
  title,
  setTitle,
  message,
  setMessage,
  scheduledDate,
  setScheduledAt,
  targetType,
  setTargetType,
  targetId,
  setTargetId,
  workspaceList,
  isConnected,
  handleSend,
}: DialogNotificationProps) {
  const { deviceSize } = useTheme();
  const isMobile = deviceSize === 'mobile';
  const isViewMode = mode === 'view';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isViewMode ? '알림 상세 정보' : '새 시스템 알림 생성'}
      maxWidth={false}
      fullWidth
      style={{ maxWidth: '600px' }}
      className="dialog--mobile-overlay"
      actions={
        <Flex gap="sm" style={isMobile ? { width: '100%' } : { justifySelf: 'flex-end' }}>
          <Button
            variant="secondary"
            onClick={onClose}
            style={isMobile ? { flex: isViewMode ? 1 : 4.5 } : {}}
          >
            <Flex align="center" gap="xs" justify="center">
              <IconX size={18} />
              <span>{isViewMode ? '닫기' : '취소'}</span>
            </Flex>
          </Button>
          {!isViewMode && (
            <Button
              variant="primary"
              onClick={handleSend}
              disabled={!isConnected || !message.trim() || !title.trim()}
              style={isMobile ? { flex: 5.5 } : {}}
            >
              <Flex align="center" gap="xs" justify="center">
                <IconSend size={18} />
                <span>알림 보내기</span>
              </Flex>
            </Button>
          )}
        </Flex>
      }
    >
      <Stack spacing="xl">
        <Box>
          <Typography variant="body-medium" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
            알림 제목
          </Typography>
          <Input
            value={title}
            onInput={(e) => setTitle(e.currentTarget.value)}
            placeholder="알림 제목을 입력하세요..."
            fullWidth
            disabled={isViewMode}
          />
        </Box>

        <Box>
          <Typography variant="body-medium" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
            메시지 내용
          </Typography>
          <Input
            multiline
            rows={6}
            value={message}
            onInput={(e) => setMessage(e.currentTarget.value)}
            placeholder="알림 메시지를 입력하세요..."
            fullWidth
            disabled={isViewMode}
          />
        </Box>

        <Box>
          <Typography variant="body-medium" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
            대상 유형
          </Typography>
          <Select
            value={targetType}
            onChange={(e) => setTargetType(e.currentTarget.value as any)}
            options={[
              { label: '전체 사용자', value: 'all' },
              { label: '특정 워크스페이스', value: 'workspace' },
            ]}
            fullWidth
            disabled={isViewMode}
          />
        </Box>

        {targetType === 'workspace' && (
          <Box>
            <Typography variant="body-medium" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
              워크스페이스 선택
            </Typography>
            <Select
              value={targetId}
              onChange={(e) => setTargetId(e.currentTarget.value)}
              options={workspaceList.map((ws) => ({
                label: ws.name,
                value: ws._id,
              }))}
              fullWidth
              disabled={isViewMode}
            />
          </Box>
        )}

        <Box>
          <Typography variant="body-medium" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
            {isViewMode ? '전송 일시' : '예약 전송 (선택 사항)'}
          </Typography>
          <Flex gap="sm" align="center">
            <IconCalendar size={20} color="var(--color-text-tertiary)" />
            {isViewMode ? (
              <Input
                value={scheduledDate ? new Intl.DateTimeFormat('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                }).format(new Date(scheduledDate)) : '-'}
                disabled
                fullWidth
              />
            ) : (
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledAt(e.currentTarget.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border-default)',
                  backgroundColor: 'var(--color-bg-default)',
                  color: 'var(--color-text-primary)',
                  flex: 1,
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            )}
          </Flex>
          {!isViewMode && (
            <Typography variant="caption" color="text-secondary" style={{ marginTop: '6px', display: 'block' }}>
              비워두면 즉시 전송됩니다.
            </Typography>
          )}
        </Box>
      </Stack>
    </Dialog>
  );
}
