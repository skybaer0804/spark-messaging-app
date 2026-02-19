import { useTheme } from '@/core/context/ThemeProvider';
import { Dialog } from '@/ui-components/Dialog/Dialog';
import { Button } from '@/ui-components/Button/Button';
import { Input } from '@/ui-components/Input/Input';
import { Select } from '@/ui-components/Select/Select';
import { Grid } from '@/ui-components/Layout/Grid';
import { Flex } from '@/ui-components/Layout/Flex';
import { Box } from '@/ui-components/Layout/Box';
import { Typography } from '@/ui-components/Typography/Typography';
import { Switch } from '@/ui-components/Switch/Switch';
import { IconSend, IconX, IconCircleCheckFilled } from '@tabler/icons-preact';
import type { Workspace } from '../../Chat/types/ChatRoom';

interface DialogNotificationProps {
  open: boolean;
  onClose: () => void;
  mode: 'create' | 'view' | 'edit';
  title: string;
  setTitle: (value: string) => void;
  message: string;
  setMessage: (value: string) => void;
  scheduledDate: string;
  setScheduledAt: (value: string) => void;
  isImmediateSend: boolean;
  setIsImmediateSend: (value: boolean) => void;
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
  isImmediateSend,
  setIsImmediateSend,
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
  const isEditMode = mode === 'edit';
  const isReadOnly = isViewMode;

  // 알림 제목 유효성 검사 (Injection 방어 포함)
  const isValidTitle = (val: string) => {
    if (!val.trim()) return false;
    // 제목에는 일부 특수문자 허용하되 Injection 방어 (< > / \ & 제한)
    return /^[^<>/\\&]*$/.test(val);
  };

  // 알림 메시지 유효성 검사 (Injection 방어)
  const isValidMessage = (val: string) => {
    if (!val.trim()) return false;
    return /^[^<>/\\&]*$/.test(val);
  };

  // 대상 정보 유효성 검사
  const isValidTarget = targetType === 'all' || (targetType === 'workspace' && !!targetId);
  
  // 일정 정보 유효성 검사
  const isValidSchedule = isImmediateSend || !!scheduledDate;

  const isFormValid = isValidTitle(title) && isValidMessage(message) && isValidTarget && isValidSchedule && isConnected;

  const getDialogTitle = () => {
    if (isEditMode) return '시스템 알림 수정';
    if (isViewMode) return '알림 상세 정보';
    return '새 시스템 알림 생성';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={getDialogTitle()}
      maxWidth={false}
      fullWidth
      style={{ maxWidth: '600px' }}
      className="dialog--mobile-overlay"
      actions={
        <Flex gap="sm" style={isMobile ? { width: '100%' } : { justifySelf: 'flex-end' }}>
          <Button
            variant="secondary"
            size="sm"
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
              size="sm"
              onClick={handleSend}
              disabled={!isFormValid}
              style={isMobile ? { flex: 5.5 } : {}}
            >
              <Flex align="center" gap="xs" justify="center">
                <IconSend size={18} />
                <span>{isEditMode ? '수정 저장' : '알림 보내기'}</span>
              </Flex>
            </Button>
          )}
        </Flex>
      }
    >
      <Grid container spacing="xl">
        <Grid item xs={12}>
          <Input
            label="알림 제목"
            isValid={isValidTitle(title)}
            value={title}
            onInput={(e) => setTitle(e.currentTarget.value)}
            placeholder="알림 제목을 입력하세요..."
            fullWidth
            disabled={isReadOnly}
            error={!isReadOnly && title.length > 0 && !isValidTitle(title)}
            helperText={
              !isReadOnly && title.length > 0 && !isValidTitle(title)
                ? '보안을 위해 일부 특수문자(<, >, /, \, &)는 사용할 수 없습니다.'
                : ''
            }
          />
        </Grid>

        <Grid item xs={12}>
          <Input
            label="메시지 내용"
            isValid={isValidMessage(message)}
            multiline
            rows={6}
            value={message}
            onInput={(e) => setMessage(e.currentTarget.value)}
            placeholder="알림 메시지를 입력하세요..."
            fullWidth
            disabled={isReadOnly}
            error={!isReadOnly && message.length > 0 && !isValidMessage(message)}
            helperText={
              !isReadOnly && message.length > 0 && !isValidMessage(message)
                ? '보안을 위해 일부 특수문자(<, >, /, \, &)는 사용할 수 없습니다.'
                : ''
            }
          />
        </Grid>

        <Grid item xs={12}>
          <Select
            label="대상 유형"
            isValid={isValidTarget}
            value={targetType}
            onChange={(e) => setTargetType(e.currentTarget.value as any)}
            options={[
              { label: '전체 사용자', value: 'all' },
              { label: '특정 워크스페이스', value: 'workspace' },
            ]}
            fullWidth
            disabled={isReadOnly}
          />
        </Grid>

        {targetType === 'workspace' && (
          <Grid item xs={12}>
            <Select
              label="워크스페이스 선택"
              isValid={!!targetId}
              value={targetId}
              onChange={(e) => setTargetId(e.currentTarget.value)}
              options={workspaceList.map((ws) => ({
                label: ws.name,
                value: ws._id,
              }))}
              fullWidth
              disabled={isReadOnly}
            />
          </Grid>
        )}

        <Grid item xs={12}>
          <Typography variant="body-medium" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            {isReadOnly ? '전송 일시' : '전송 일정'}
            {!isReadOnly && (
              <span style={{ 
                color: isValidSchedule ? 'var(--color-status-success)' : 'var(--color-text-tertiary)',
                display: 'inline-flex',
                alignItems: 'center'
              }}>
                <IconCircleCheckFilled size={14} />
              </span>
            )}
          </Typography>
          {!isReadOnly && (
            <Box style={{ padding: '12px', borderRadius: 'var(--primitive-radius-md)', backgroundColor: 'var(--color-bg-subtle)', marginBottom: '8px' }}>
              <Flex justify="space-between" align="center">
                <Typography variant="body-small">즉시 발송</Typography>
                <Switch checked={isImmediateSend} onChange={(checked) => setIsImmediateSend(checked)} />
              </Flex>
            </Box>
          )}
          <Flex gap="sm" align="center">
            {isReadOnly ? (
              <Input
                value={
                  scheduledDate
                    ? new Intl.DateTimeFormat('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      }).format(new Date(scheduledDate))
                    : '-'
                }
                disabled
                fullWidth
              />
            ) : (
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledAt(e.currentTarget.value)}
                disabled={isImmediateSend}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--primitive-radius-sm)',
                  border: '1px solid var(--color-border-default)',
                  backgroundColor: isImmediateSend ? 'var(--color-bg-subtle)' : 'var(--color-bg-default)',
                  color: isImmediateSend ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
                  flex: 1,
                  fontSize: '14px',
                  outline: 'none',
                  cursor: isImmediateSend ? 'not-allowed' : 'default',
                  opacity: isImmediateSend ? 0.6 : 1,
                }}
              />
            )}
          </Flex>
        </Grid>
      </Grid>
    </Dialog>
  );
}
