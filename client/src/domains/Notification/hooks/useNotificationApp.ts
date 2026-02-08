import { useState, useEffect, useRef } from 'preact/hooks';
import { useToast } from '@/core/context/ToastContext';
import { useConfirm } from '@/core/context/ConfirmContext';
import sparkMessagingClient from '../../../config/sparkMessaging';
import { ConnectionService } from '@/core/socket/ConnectionService';
import { NotificationService } from '@/core/socket/NotificationService';
import { workspaceApi, notificationApi } from '@/core/api/ApiService';
import { formatNotificationData, FormattedNotification } from '../utils/notificationUtils';
import type { Workspace } from '../../Chat/types/ChatRoom';

export interface Notification {
  _id: string;
  title: string;
  content: string;
  scheduledAt?: string;
  targetType: 'all' | 'workspace';
  targetId?: string;
  isSent: boolean;
  createdAt: string;
  senderId: string;
}

export function useNotificationApp() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledDate, setScheduledAt] = useState('');

  const getDefaultScheduledDate = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    // YYYY-MM-DDTHH:mm 형식으로 변환 (datetime-local 입력용)
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setScheduledAt(getDefaultScheduledDate());
    setTargetType('all');
  };
  const [targetType, setTargetType] = useState<'all' | 'workspace'>('all');
  const [targetId, setTargetId] = useState('');
  const [workspaceList, setWorkspaceList] = useState<Workspace[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<FormattedNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'view'>('create');
  const [selectedNotification, setSelectedNotification] = useState<FormattedNotification | null>(null);

  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirm();
  const notificationServiceRef = useRef<NotificationService | null>(null);

  const handleOpenCreateDialog = () => {
    resetForm();
    setDialogMode('create');
    setIsDrawerOpen(true);
  };

  const handleOpenViewDialog = async (notification: FormattedNotification) => {
    setDialogMode('view');
    setIsDrawerOpen(true);
    // 상세 정보 로딩 시작 (낙관적으로 목록 데이터 먼저 표시 후 업데이트)
    setSelectedNotification(notification);
    setTitle(notification.title);
    setMessage(notification.content);
    setTargetType(notification.targetType as 'all' | 'workspace');
    setTargetId(notification.targetId || '');

    const date = notification.scheduledAt || notification.createdAt;
    if (date) {
      const localISO = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setScheduledAt(localISO);
    } else {
      setScheduledAt('');
    }

    try {
      const res = await notificationApi.getNotification(notification._id);
      const data = formatNotificationData(res.data);

      setSelectedNotification(data);
      setTitle(data.title);
      setMessage(data.content);
      setTargetType(data.targetType as 'all' | 'workspace');
      setTargetId(data.targetId || '');

      const detailDate = data.scheduledAt || data.createdAt;
      if (detailDate) {
        const localISO = new Date(detailDate.getTime() - detailDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setScheduledAt(localISO);
      }
    } catch (err) {
      console.error('Failed to fetch notification detail:', err);
      // 목록에 이미 데이터가 있으므로 에러 무시 가능하지만 로그는 남김
    }
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await notificationApi.getNotifications();
      setNotifications(res.data.map(formatNotificationData));
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      showError('알림 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const connectionService = new ConnectionService(sparkMessagingClient);
    const notificationService = new NotificationService(sparkMessagingClient, connectionService);

    notificationServiceRef.current = notificationService;

    const status = connectionService.getConnectionStatus();
    setIsConnected(status.isConnected);

    connectionService.onConnectionStateChange((connected) => {
      setIsConnected(connected);
    });

    const fetchWorkspaces = async () => {
      try {
        const res = await workspaceApi.getWorkspaces();
        setWorkspaceList(res.data);
        if (res.data.length > 0) setTargetId(res.data[0]._id);
      } catch (err) {
        console.error('Failed to fetch workspaces:', err);
      }
    };

    fetchWorkspaces();
    fetchNotifications();
    setScheduledAt(getDefaultScheduledDate());

    return () => {
      connectionService.cleanup();
    };
  }, []);

  const handleSend = async () => {
    try {
      await notificationApi.createNotification({
        title,
        content: message,
        scheduledAt: scheduledDate || undefined,
        targetType,
        targetId: targetType === 'workspace' ? targetId : undefined,
      });

      resetForm();
      setIsDrawerOpen(false);
      // showSuccess('알림이 생성되었습니다.');
      fetchNotifications();
    } catch (error) {
      console.error('Notification creation failed:', error);
      showError('알림 생성에 실패했습니다.');
    }
  };

  const handleResend = async (notification: Notification | FormattedNotification) => {
    try {
      await notificationApi.createNotification({
        title: notification.title,
        content: notification.content,
        targetType: notification.targetType,
        targetId: notification.targetId,
      });
      showSuccess('알림이 재발송되었습니다.');
      fetchNotifications();
    } catch (error) {
      console.error('Notification resend failed:', error);
      showError('알림 재발송에 실패했습니다.');
    }
  };

  const handleDelete = async (notificationId: string) => {
    confirm({
      title: '알림 삭제',
      message: '정말 이 알림을 삭제하시겠습니까?',
      type: 'error',
      confirmText: '삭제',
      onConfirm: async () => {
        try {
          await notificationApi.deleteNotification(notificationId);
          showSuccess('알림이 삭제되었습니다.');
          // 목록에서 즉시 제거 (낙관적 업데이트)
          setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
        } catch (error) {
          console.error('Notification delete failed:', error);
          showError('알림 삭제에 실패했습니다.');
        }
      }
    });
  };

  return {
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
    notifications,
    isLoading,
    isDrawerOpen,
    setIsDrawerOpen,
    dialogMode,
    setDialogMode,
    selectedNotification,
    handleOpenCreateDialog,
    handleOpenViewDialog,
    handleResend,
    handleDelete,
    fetchNotifications,
    resetForm,
  };
}
