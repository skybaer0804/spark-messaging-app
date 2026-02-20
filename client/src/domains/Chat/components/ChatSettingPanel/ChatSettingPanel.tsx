import { Box, Stack } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import { Paper } from '@/components/ui/paper';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { IconButton } from '@/components/ui/icon-button';
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
          <Typography variant="h4" style={{ flex: 1, fontWeight: 600 }}>알림 환경 설정</Typography>
        </Box>
        {!isMobile && (
          <IconButton onClick={onClose} size="small">
            <IconX size={18} />
          </IconButton>
        )}
      </Box>
      <Box className="chat-app__sidebar-panel__content" style={{ padding: '0', flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box padding="lg" style={{ textAlign: 'center' }}>
            <Typography variant="body-medium" color="text-secondary">
              로딩 중...
            </Typography>
          </Box>
        ) : (
          <Box style={{ padding: '24px' }}>
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
            </Stack>
          </Box>
        )}
      </Box>

      {/* Footer 섹션 */}
      <Box style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border-subtle)', backgroundColor: 'var(--color-bg-default)' }}>
        <Button 
          variant="secondary" 
          onClick={handleReset} 
          disabled={saving || loading} 
          fullWidth
          size="sm"
          style={{ height: '40px' }}
        >
          초기화
        </Button>
      </Box>
    </Paper>
  );
};
