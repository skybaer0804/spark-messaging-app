import { ChatRoom, Message } from '../types';
import { isSameDate } from '@/core/utils/messageUtils';

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
    const messageDate = message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp);

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
 * 서버에서 내려온 메시지 데이터를 클라이언트용 Message 타입으로 포맷팅합니다.
 */
export function formatServerMessage(msg: any): Message {
  const senderObj = typeof msg.senderId === 'object' ? msg.senderId : null;

  let fileData: any = undefined;
  if (msg.fileUrl || msg.thumbnailUrl || msg.renderUrl) {
    fileData = {
      fileName: msg.fileName || 'unknown',
      fileType: msg.type || 'file',
      mimeType: msg.mimeType || 'application/octet-stream',
      size: msg.fileSize || 0,
      url: msg.fileUrl,
      thumbnail: msg.thumbnailUrl,
      renderUrl: msg.renderUrl,
      data: msg.thumbnailUrl || msg.renderUrl || msg.fileUrl,
    };
  }

  return {
    ...msg,
    senderId: senderObj ? senderObj._id : msg.senderId,
    senderName: msg.senderName || (senderObj ? senderObj.username : 'Unknown'),
    timestamp: new Date(msg.timestamp),
    status: msg.status || 'sent',
    fileData,
    parentMessageId: msg.parentMessageId,
    replyCount: msg.replyCount,
    lastReplyAt: msg.lastReplyAt ? new Date(msg.lastReplyAt) : undefined,
    threadSequenceNumber: msg.threadSequenceNumber,
    isForwarded: msg.isForwarded,
    originSenderName: msg.originSenderName,
  };
}
