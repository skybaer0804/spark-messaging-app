export interface ChatUser {
  _id: string;
  username: string;
  avatar?: string;
  status?: 'online' | 'offline';
}

export interface ChatRoom {
  _id: string;
  name: string;
  members: ChatUser[];
  isGroup: boolean;
  lastMessage?: string;
  createdAt: string;
  updatedAt: string;
}
