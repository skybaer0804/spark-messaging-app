import { useNotificationApp } from './hooks/useNotificationApp';
import { useTheme } from '@/core/context/ThemeProvider';
import { MobileHeader } from '@/components/Mobile/MobileHeader';
import { Button } from '@/ui-components/Button/Button';
import { Box } from '@/ui-components/Layout/Box';
import { Stack } from '@/ui-components/Layout/Stack';
import { Flex } from '@/ui-components/Layout/Flex';
import { Paper } from '@/ui-components/Paper/Paper';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconSend, IconPlus, IconRefresh, IconHistory, IconTrash, IconRocket, IconPencil } from '@tabler/icons-preact';
import { useAuth } from '@/core/hooks/useAuth';
import { DialogNotification } from './components/DialogNotification';
import { Chip } from '@/ui-components/Chip/Chip';
import './NotificationApp.scss';

export function NotificationApp() {
  const { user } = useAuth();
  const { deviceSize } = useTheme();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const {
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
    notifications,
    isLoading,
    isDrawerOpen,
    setIsDrawerOpen,
    dialogMode,
    handleOpenCreateDialog,
    handleOpenViewDialog,
    handleResend,
    handleDelete,
    fetchNotifications,
  } = useNotificationApp();

  const formatDate = (dateInput?: string | Date) => {
    if (!dateInput) return { date: '-', time: '-' };
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    const datePart = new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);

    const timePart = new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);

    return { date: datePart, time: timePart };
  };

  const getTargetLabel = (type: string, id?: string) => {
    if (type === 'all') return '전체 사용자';
    const workspace = workspaceList.find((ws) => ws._id === id);
    return workspace ? workspace.name : '알 수 없는 대상';
  };

  if (!isAdmin) {
    return (
      <Box style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {deviceSize === 'mobile' && <MobileHeader />}
        <Flex direction="column" align="center" justify="center" style={{ flex: 1, padding: '40px' }}>
          <Typography variant="h2" color="text-error">
            접근 거부
          </Typography>
          <Typography variant="body-medium">관리자만 시스템 알림을 보낼 수 있습니다.</Typography>
        </Flex>
      </Box>
    );
  }

  const isMobile = deviceSize === 'mobile';

  return (
    <Paper square elevation={0} padding="none" className="notification-app">
      {isMobile && <MobileHeader />}

      <div className="notification-app__container">
        <Box padding={isMobile ? 'md' : 'xl'} className="notification-app__hero">
          <Stack spacing="sm" style={{ flex: 1 }}>
            <Flex align="center" gap="xs" className="notification-app__badge">
              <IconRocket size={16} />
              <Typography variant="body-small">시스템 공지</Typography>
            </Flex>
            <Typography variant="h1" className="notification-app__title">
              시스템 <span className="highlight">알림 관리</span>
            </Typography>
            <Typography variant="body-large" color="text-secondary" className="notification-app__desc">
              중요한 공지사항을 발송하고 내역을 관리합니다.
            </Typography>
          </Stack>
        </Box>

        <div className="notification-app__sticky-bar">
          <Box padding={isMobile ? 'md' : 'xl'} style={{ paddingTop: '12px', paddingBottom: '12px' }}>
            <Flex justify="flex-end" gap="sm" align="center">
              <Button
                variant="secondary"
                size="sm"
                onClick={fetchNotifications}
                disabled={isLoading}
                style={{
                  borderRadius: 'var(--primitive-radius-md)',
                  padding: '8px',
                  backgroundColor: 'var(--color-background-primary)',
                }}
                title="새로고침"
              >
                <IconRefresh size={20} className={isLoading ? 'rotate' : ''} />
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleOpenCreateDialog}
                style={{ borderRadius: 'var(--primitive-radius-md)' }}
              >
                <Flex align="center" gap="xs">
                  <IconPlus size={18} />
                  <span>알림 생성</span>
                </Flex>
              </Button>
            </Flex>
          </Box>
        </div>

        <Box padding={isMobile ? 'md' : 'xl'} className="notification-scroll-area">
          <Stack spacing="md" className="notification-list">
            {notifications.length === 0 ? (
              <Flex direction="column" align="center" justify="center" style={{ padding: '80px 0' }}>
                <IconHistory size={48} color="var(--color-text-tertiary)" style={{ marginBottom: '16px' }} />
                <Typography color="text-tertiary">발송된 알림이 없습니다.</Typography>
              </Flex>
            ) : (
              notifications.map((notif) => (
                <Paper
                  key={notif._id}
                  elevation={1}
                  padding="sm"
                  className="notification-item-card"
                  onClick={() => handleOpenViewDialog(notif)}
                >
                  <div className="notification-item-card__grid">
                    <Stack spacing="4px" className="grid-area-header">
                      <Flex align="center" gap="xs">
                        <Typography
                          variant="body-medium"
                          className="notification-item-card__title"
                          style={{ fontWeight: 700 }}
                        >
                          {notif.title}
                        </Typography>
                        <Chip
                          label={notif.isSent ? '발송완료' : '대기중'}
                          variant={notif.isSent ? 'primary' : 'default'}
                          size="sm"
                          style={{ flexShrink: 0 }}
                        />
                      </Flex>
                      <Typography
                        variant="body-small"
                        color="text-secondary"
                        className="notification-item-card__content text-truncate"
                      >
                        {notif.content}
                      </Typography>
                    </Stack>

                    <div className="grid-area-target">
                      <Typography variant="caption" color="text-secondary" className="text-truncate">
                        {getTargetLabel(notif.targetType, notif.targetId)}
                      </Typography>
                    </div>

                    <div className="grid-area-time">
                      <Flex align="center" gap="xs">
                        <Typography variant="caption" color="text-tertiary" className="text-nowrap">
                          {formatDate(notif.scheduledAt || notif.createdAt).date}
                        </Typography>
                        <Typography variant="caption" color="text-tertiary" className="text-nowrap">
                          {formatDate(notif.scheduledAt || notif.createdAt).time}
                        </Typography>
                      </Flex>
                    </div>

                    <Flex gap="xs" align="center" className="grid-area-actions">
                      <Flex gap="4px">
                        {!notif.isSent && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenViewDialog(notif);
                            }}
                            style={{ borderRadius: 'var(--primitive-radius-sm)', padding: '4px' }}
                            title="수정"
                          >
                            <IconPencil size={16} />
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleResend(notif);
                          }}
                          style={{ borderRadius: 'var(--primitive-radius-sm)', padding: '4px' }}
                          title="재발송"
                        >
                          <IconSend size={16} />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(notif._id);
                          }}
                          style={{ borderRadius: 'var(--primitive-radius-sm)', padding: '4px' }}
                          title="삭제"
                        >
                          <IconTrash size={16} />
                        </Button>
                      </Flex>
                    </Flex>
                  </div>
                </Paper>
              ))
            )}
          </Stack>
        </Box>
      </div>

      <DialogNotification
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        mode={dialogMode}
        title={title}
        setTitle={setTitle}
        message={message}
        setMessage={setMessage}
        scheduledDate={scheduledDate}
        setScheduledAt={setScheduledAt}
        isImmediateSend={isImmediateSend}
        setIsImmediateSend={setIsImmediateSend}
        targetType={targetType}
        setTargetType={setTargetType}
        targetId={targetId}
        setTargetId={setTargetId}
        workspaceList={workspaceList}
        isConnected={isConnected}
        handleSend={handleSend}
      />
    </Paper>
  );
}
