import { Message } from './Message';

export interface ChatUser {
  _id: string;
  username: string;
  avatar?: string;
  status?: 'online' | 'offline';
  role?: string;
}

export interface ChatRoom {
  _id: string;
  name?: string;
  description?: string;
  members: ChatUser[];
  isGroup: boolean;
  isPrivate?: boolean;
  lastMessage?: Message;
  roomType: 'DIRECT' | 'DISCUSSION' | 'CHANNEL' | 'TEAM' | 'VIDEO_MEETING' | 'DEFAULT';
  createdAt: string;
  updatedAt: string;
  unreadCount?: number; // UserChatRoom 정보가 포함될 때를 위해 추가
  isPinned?: boolean;
  notificationEnabled?: boolean;
}

export interface UserChatRoom {
  userId: string;
  roomId: string;
  unreadCount: number;
  lastReadMessageId?: string;
  isPinned: boolean;
  notificationEnabled: boolean;
  createdAt: string;
}
