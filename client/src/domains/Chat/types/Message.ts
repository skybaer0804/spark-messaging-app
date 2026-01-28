export type MessageType = 'text' | 'file' | 'image' | 'video' | 'audio' | '3d' | 'system';
export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface FileData {
  fileName: string;
  fileType: MessageType;
  mimeType: string;
  size: number;
  url?: string;
  thumbnail?: string;
  renderUrl?: string; // 추가: 3D 렌더링용 GLB URL
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
  renderUrl?: string; // 추가: 3D 렌더링용 GLB URL (최상위)
  processingStatus?: 'processing' | 'completed' | 'failed';
  processingProgress?: number; // 추가: 진행률 (0-100)
  isDeleted?: boolean;
  deletedBy?: 'sender' | 'all';
}
