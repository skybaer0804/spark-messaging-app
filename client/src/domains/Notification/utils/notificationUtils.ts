import { Notification } from '../hooks/useNotificationApp';
import { getSafeDate } from '@/core/utils/common';

export interface FormattedNotification extends Omit<Notification, 'createdAt' | 'scheduledAt'> {
  createdAt: Date;
  scheduledAt?: Date;
}

/**
 * 서버에서 내려온 알림 데이터를 클라이언트용으로 정제합니다.
 */
export const formatNotificationData = (raw: any): FormattedNotification => {
  return {
    ...raw,
    createdAt: getSafeDate(raw.createdAt),
    scheduledAt: raw.scheduledAt ? getSafeDate(raw.scheduledAt) : undefined,
  };
};
