import { useState, useEffect, useRef } from 'preact/hooks';
import { useToast } from '@/core/context/ToastContext';
import sparkMessagingClient from '../../../config/sparkMessaging';
import { ConnectionService } from '@/core/socket/ConnectionService';
import { NotificationService } from '@/core/socket/NotificationService';
import { workspaceApi, notificationApi } from '@/core/api/ApiService';
import type { Workspace } from '../../Chat/types/ChatRoom';

export function useNotificationApp() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledDate, setScheduledAt] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'workspace'>('all');
  const [targetId, setTargetId] = useState('');
  const [workspaceList, setWorkspaceList] = useState<Workspace[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { showSuccess, showError } = useToast();
  const notificationServiceRef = useRef<NotificationService | null>(null);

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

      setTitle('');
      setMessage('');
      setScheduledAt('');
      showSuccess('Notification created/sent successfully');
    } catch (error) {
      console.error('Notification creation failed:', error);
      showError('Failed to create notification');
    }
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
  };
}
