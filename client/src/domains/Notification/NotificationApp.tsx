import { useNotificationApp } from './hooks/useNotificationApp';
import { Button } from '@/ui-components/Button/Button';
import { Input } from '@/ui-components/Input/Input';
import { Select } from '@/ui-components/Select/Select';
import { Box } from '@/ui-components/Layout/Box';
import { Stack } from '@/ui-components/Layout/Stack';
import { Flex } from '@/ui-components/Layout/Flex';
import { Paper } from '@/ui-components/Paper/Paper';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconSend, IconCalendar } from '@tabler/icons-preact';
import { useAuth } from '@/core/hooks/useAuth';
import './NotificationApp.scss';

export function NotificationApp() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const {
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
  } = useNotificationApp();

  if (!isAdmin) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ height: '100%', padding: '40px' }}>
        <Typography variant="h2" color="text-error">
          접근 거부
        </Typography>
        <Typography variant="body-medium">관리자만 시스템 알림을 보낼 수 있습니다.</Typography>
      </Flex>
    );
  }

  return (
    <Paper square elevation={0} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box padding="lg" style={{ flex: 1, overflowY: 'auto' }}>
        <Typography variant="h3" style={{ marginBottom: '8px' }}>
          시스템 알림 생성
        </Typography>
        <Typography variant="body-medium" color="text-secondary" style={{ marginBottom: '24px' }}>
          사용자들에게 전체 공지 또는 타겟 알림을 보냅니다.
        </Typography>

        <Stack spacing="xl">
          <Input
            label="알림 제목"
            value={title}
            onInput={(e) => setTitle(e.currentTarget.value)}
            placeholder="알림 제목을 입력하세요..."
            fullWidth
          />

          <Input
            label="메시지 내용"
            multiline
            rows={4}
            value={message}
            onInput={(e) => setMessage(e.currentTarget.value)}
            placeholder="알림 메시지를 입력하세요..."
            fullWidth
          />

          <Flex gap="md">
            <Select
              label="대상 유형"
              value={targetType}
              onChange={(e) => setTargetType(e.currentTarget.value as any)}
              options={[
                { label: '전체 사용자', value: 'all' },
                { label: '특정 워크스페이스', value: 'workspace' },
              ]}
              style={{ flex: 1 }}
            />

            {targetType === 'workspace' && (
              <Select
                label="워크스페이스 선택"
                value={targetId}
                onChange={(e) => setTargetId(e.currentTarget.value)}
                options={workspaceList.map((ws) => ({
                  label: ws.name,
                  value: ws._id,
                }))}
                style={{ flex: 1 }}
              />
            )}
          </Flex>

          <Box>
            <Typography variant="body-small" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
              예약 전송 (선택 사항)
            </Typography>
            <Flex gap="sm" align="center">
              <IconCalendar size={20} color="var(--color-text-tertiary)" />
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledAt(e.currentTarget.value)}
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border-default)',
                  backgroundColor: 'var(--color-bg-default)',
                  color: 'var(--color-text-primary)',
                  flex: 1,
                }}
              />
            </Flex>
            <Typography variant="caption" color="text-secondary" style={{ marginTop: '4px', display: 'block' }}>
              비워두면 즉시 전송됩니다.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box padding="lg" style={{ borderTop: '1px solid var(--color-border-default)' }}>
        <Button
          variant="primary"
          fullWidth
          size="lg"
          onClick={handleSend}
          disabled={!isConnected || !message.trim() || !title.trim()}
        >
          <Stack direction="row" align="center" spacing="sm" justify="center">
            <IconSend size={20} />
            <span>알림 보내기</span>
          </Stack>
        </Button>
      </Box>
    </Paper>
  );
}
