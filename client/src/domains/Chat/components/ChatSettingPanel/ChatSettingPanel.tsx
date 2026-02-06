import { Box } from '@/ui-components/Layout/Box';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { Button } from '@/ui-components/Button/Button';
import { Select } from '@/ui-components/Select/Select';
import { IconButton } from '@/ui-components/Button/IconButton';
import { IconChevronLeft, IconX } from '@tabler/icons-preact';
import { useChatNotificationSettings, type NotificationMode } from './hooks/useChatNotificationSettings';
import type { ChatRoom } from '../../types';
import { useTheme } from '@/core/context/ThemeProvider';
import './ChatSettingPanel.scss';

interface ChatSettingPanelProps {
  roomId: string | null;
  currentRoom: ChatRoom | null;
  onClose: () => void;
}

export const ChatSettingPanel = ({ roomId, onClose }: ChatSettingPanelProps) => {
  const { deviceSize } = useTheme();
  const isMobile = deviceSize === 'mobile';
  const { settings, loading, saving, updateSettings, resetSettings } = useChatNotificationSettings(roomId);

  const handleModeChange = async (e: Event) => {
    const target = e.target as HTMLSelectElement;
    const mode = target.value as NotificationMode;
    await updateSettings(mode);
  };

  const handleReset = async () => {
    await resetSettings();
  };

  const notificationModeOptions = [
    { value: 'default', label: '기본' },
    { value: 'none', label: '없음' },
    { value: 'mention', label: '멘션' },
  ];

  return (
    <Paper
      elevation={0}
      square
      padding="none"
      className="chat-app__sidebar-panel"
    >
      <Box className="chat-app__sidebar-panel__header">
        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          {isMobile && (
            <IconButton onClick={onClose} size="small" style={{ marginLeft: '-8px' }}>
              <IconChevronLeft size={24} />
            </IconButton>
          )}
          <Typography variant="h4" style={{ flex: 1 }}>알림 환경 설정</Typography>
        </Box>
        {!isMobile && (
          <IconButton onClick={onClose} size="small">
            <IconX size={18} />
          </IconButton>
        )}
      </Box>
      <Box className="chat-app__sidebar-panel__content" style={{ padding: '16px' }}>
        {loading ? (
          <Box padding="lg" style={{ textAlign: 'center' }}>
            <Typography variant="body-medium" color="text-secondary">
              로딩 중...
            </Typography>
          </Box>
        ) : (
          <Stack spacing="lg">
            {/* 알림 모드 선택 */}
            <Box>
              <Select
                label="알림 수신"
                options={notificationModeOptions}
                value={settings?.notificationMode || 'default'}
                onChange={handleModeChange}
                disabled={saving}
                fullWidth
              />
              <Box padding="sm" style={{ marginTop: '8px' }}>
                <Typography variant="caption" color="text-secondary">
                  {settings?.notificationMode === 'default' && '모든 메시지에 대해 알림을 받습니다.'}
                  {settings?.notificationMode === 'none' && '이 채팅방의 모든 알림을 받지 않습니다.'}
                  {settings?.notificationMode === 'mention' && '@멘션된 경우에만 알림을 받습니다.'}
                </Typography>
              </Box>
            </Box>

            {/* Footer */}
            <Box style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border-default)' }}>
              <Button variant="secondary" onClick={handleReset} disabled={saving} fullWidth>
                초기화
              </Button>
            </Box>
          </Stack>
        )}
      </Box>
    </Paper>
  );
};
