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

/**
 * 채팅방 타입 정의
 * 'private' 타입은 이제 사용되지 않으며 'public' + isPrivate: true로 대체됩니다.
 * 하위 호환성을 위해 타입 정의에는 유지합니다.
 */
export type RoomType = 'public' | 'private' | 'direct' | 'team' | 'discussion';

export interface ChatRoom {
  _id: string;
  /** 
   * 방 이름 (일반 채널/팀 이름)
   * DB의 teamName 필드도 클라이언트 전송 시 name으로 매핑되는 것이 권장됩니다.
   */
  name?: string;
  description?: string;
  members: ChatUser[];
  type: RoomType;
  workspaceId: string;
  teamId?: string;
  parentId?: string;
  
  /** 
   * 비공개 여부 필드 표준화
   * boolean 타입을 명시하며, DB 필드명인 private과의 혼선을 방지하기 위해 isPrivate을 주로 사용합니다.
   */
  isPrivate?: boolean;
  private?: boolean; // DB 레거시 필드 대응용 (Optional)

  slug?: string; // 초대 링크용 slug
  createdBy?: string | ChatUser; // 채널 생성자
  lastMessage?: Message;
  lastSequenceNumber?: number;
  
  // 서버에서 계산되어 내려오는 표시용 데이터 (UI 친화적)
  displayName?: string; // v2.2.0: 서버에서 계산된 표시용 이름
  displayAvatar?: string | null; // v2.2.0: 서버에서 계산된 표시용 아바타
  displayStatus?: string; // v2.2.0: 서버에서 계산된 표시용 상태
  displayStatusText?: string; // v2.2.0: 서버에서 계산된 표시용 상태 메시지
  
  isArchived?: boolean;
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
