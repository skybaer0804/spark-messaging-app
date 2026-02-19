export type MessageType = 'text' | 'file' | 'image' | 'video' | 'audio' | '3d' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface FileData {
  _id?: string;
  fileName: string;
  fileType: MessageType;
  mimeType: string;
  size: number;
  url?: string;
  thumbnailUrl?: string; // Rename to match backend naming convention
  thumbnail?: string; // Backward compatibility
  renderUrl?: string; // 추가: 3D 렌더링용 GLB URL
  processingStatus?: 'processing' | 'completed' | 'failed' | 'cancelled';
  data?: string; // Base64 (for sending)
}

export interface Message {
  _id: string;
  roomId: string;
  senderId: string;
  senderName?: string;
  content: string;
  type: MessageType;
  sequenceNumber: number;
  tempId?: string;
  status?: MessageStatus;
  readBy: string[];
  timestamp: Date;
  fileData?: FileData;
  files?: FileData[]; // [v2.8.0] 다중 파일 지원
  renderUrl?: string; // 추가: 3D 렌더링용 GLB URL (최상위)
  groupId?: string; // [v2.6.0] 다중 파일 그룹화용 ID
  processingStatus?: 'processing' | 'completed' | 'failed' | 'cancelled';
  isDeleted?: boolean;
  deletedBy?: 'sender' | 'all';

  // --- 스레드 및 공유 기능 추가 ---
  parentMessageId?: string | null;
  replyCount?: number;
  lastReplyAt?: Date;
  threadSequenceNumber?: number;
  lastThreadSequenceNumber?: number;
  isForwarded?: boolean;
  originSenderName?: string;
  // ------------------------------
}
