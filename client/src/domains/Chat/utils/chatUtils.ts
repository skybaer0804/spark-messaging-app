import { ChatRoom } from '../types';

export const getDirectChatName = (room: ChatRoom, currentUserId?: string) => {
  if (room.type !== 'direct') return room.name || 'Unnamed Room';
  const otherMember = room.members.find((m) => m._id !== currentUserId);
  return otherMember ? otherMember.username : 'Unknown';
};
