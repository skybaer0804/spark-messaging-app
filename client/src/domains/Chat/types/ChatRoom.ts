import { Message } from './Message';

export interface Workspace {
  _id: string;
  name: string;
  initials?: string;
  color?: string;
  projectPublicKey?: string;
  projectUrl?: string;
  createdAt?: string;
}

export interface ChatUser {
  _id: string;
  username: string;
  email?: string;
  avatar?: string;
  profileImage?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  statusText?: string;
  role?: string;
  workspaces?: Workspace[];
}

export interface ChatRoom {
  _id: string;
  name?: string;
  description?: string;
  members: ChatUser[];
  type: 'public' | 'private' | 'direct' | 'team' | 'discussion';
  workspaceId: string;
  teamId?: string;
  parentId?: string;
  isPrivate?: boolean;
  lastMessage?: Message;
  lastSequenceNumber?: number;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number;
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
