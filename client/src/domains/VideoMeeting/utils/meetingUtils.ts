import { ScheduledMeeting } from '../stores/VideoMeetingStore';
import { getSafeDate } from '@/core/utils/common';

export interface FormattedScheduledMeeting extends Omit<ScheduledMeeting, 'scheduledAt'> {
  scheduledAt: Date;
  isExpired: boolean;
}

/**
 * 서버에서 내려온 회의 데이터를 클라이언트용으로 정제합니다.
 */
export const formatMeetingData = (raw: any): FormattedScheduledMeeting => {
  const scheduledDate = getSafeDate(raw.scheduledAt);
  return {
    ...raw,
    scheduledAt: scheduledDate,
    isExpired: scheduledDate.getTime() < Date.now(),
  };
};
