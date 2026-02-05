import { ChatRoom, Message } from '../types';
import { isSameDate } from '@/core/utils/messageUtils';
import { getSafeDate, getSafeTime } from '@/core/utils/common.ts';

export const getDirectChatName = (room: ChatRoom, currentUserId?: string) => {
  if (room.type !== 'direct') return room.name || 'Unnamed Room';
  const otherMember = room.members.find((m) => {
    const memberId = typeof m === 'string' ? m : m._id;
    return memberId.toString() !== currentUserId?.toString();
  });
  return otherMember ? (typeof otherMember === 'string' ? 'User' : otherMember.username) : 'Unknown';
};

export interface MessageWithDateDivider {
  type: 'message' | 'divider';
  message?: Message;
  date?: Date;
}

/**
 * 메시지 배열을 날짜별로 그룹화하고 날짜 구분선을 삽입합니다.
 * @param messages 메시지 배열
 * @returns 메시지와 날짜 구분선이 포함된 배열
 */
export function groupMessagesByDate(messages: Message[]): MessageWithDateDivider[] {
  if (messages.length === 0) return [];

  const result: MessageWithDateDivider[] = [];
  let lastDate: Date | null = null;

  for (const message of messages) {
    const messageDate = getSafeDate(message.timestamp);

    // 날짜가 변경되었으면 구분선 추가
    if (!lastDate || !isSameDate(messageDate, lastDate)) {
      result.push({
        type: 'divider',
        date: messageDate,
      });
      lastDate = messageDate;
    }

    result.push({
      type: 'message',
      message,
    });
  }

  return result;
}

/**
 * 두 메시지가 렌더링 관점에서 동일한지 비교합니다. (memo 최적화용)
 */
export const areMessagesEqual = (prev: Message, next: Message): boolean => {
  return (
    prev._id === next._id &&
    prev.status === next.status &&
    prev.replyCount === next.replyCount &&
    areDatesEqual(prev.lastReplyAt, next.lastReplyAt) &&
    prev.fileData?.thumbnail === next.fileData?.thumbnail &&
    prev.fileData?.url === next.fileData?.url &&
    prev.fileData?.renderUrl === next.fileData?.renderUrl &&
    prev.renderUrl === next.renderUrl
  );
};

/**
 * 서버에서 내려온 메시지 데이터를 클라이언트용 Message 타입으로 포맷팅합니다.
 */
export function formatServerMessage(msg: any): Message {
  const senderObj = typeof msg.senderId === 'object' ? msg.senderId : null;

  let fileData: any = undefined;
  if (msg.fileUrl || msg.thumbnailUrl || msg.renderUrl || msg.fileData) {
    const rawFileData = msg.fileData || {};
    fileData = {
      fileName: msg.fileName || rawFileData.fileName || 'unknown',
      fileType: msg.type || rawFileData.fileType || 'file',
      mimeType: msg.mimeType || rawFileData.mimeType || 'application/octet-stream',
      size: msg.fileSize || rawFileData.size || 0,
      url: msg.fileUrl || rawFileData.url,
      thumbnail: msg.thumbnailUrl || rawFileData.thumbnail,
      renderUrl: msg.renderUrl || rawFileData.renderUrl,
      data: msg.thumbnailUrl || msg.renderUrl || msg.fileUrl || rawFileData.data,
    };
  }

  return {
    ...msg,
    senderId: senderObj ? senderObj._id : msg.senderId,
    senderName: msg.senderName || (senderObj ? senderObj.username : 'Unknown'),
    timestamp: getSafeDate(msg.timestamp),
    status: msg.status || 'sent',
    fileData,
    parentMessageId: msg.parentMessageId,
    replyCount: msg.replyCount || 0,
    lastReplyAt: msg.lastReplyAt ? getSafeDate(msg.lastReplyAt) : undefined,
    threadSequenceNumber: msg.threadSequenceNumber,
    isForwarded: msg.isForwarded,
    originSenderName: msg.originSenderName,
  };
}

/**
 * 날짜 비교를 위한 헬퍼 (areDatesEqual 재사용)
 */
function areDatesEqual(d1: any, d2: any): boolean {
  return getSafeTime(d1) === getSafeTime(d2);
}
