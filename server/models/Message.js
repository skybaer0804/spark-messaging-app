const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  type: {
    type: String,
    enum: ['text', 'file', 'image', 'video', 'audio', '3d', 'system'],
    default: 'text',
  },
  // [필수] 메시지 시퀀스: 방 내에서 1씩 증가하여 메시지 순서 및 누락 확인
  sequenceNumber: { type: Number, required: true },

  // [낙관적 업데이트용] 클라이언트에서 생성한 임시 ID 및 상태
  tempId: { type: String },
  status: {
    type: String,
    enum: ['sending', 'sent', 'failed'],
    default: 'sent',
  },

  fileUrl: { type: String },
  thumbnailUrl: { type: String }, // 썸네일/프리뷰 이미지 URL
  renderUrl: { type: String }, // 3D 렌더링용 GLB URL 추가
  fileName: { type: String },
  fileSize: { type: Number }, // 파일 크기 (bytes)
  mimeType: { type: String }, // MIME 타입
  groupId: { type: String }, // [v2.6.0] 다중 파일 그룹화용 ID
  processingStatus: { 
    type: String, 
    enum: ['processing', 'completed', 'failed', 'cancelled'], 
    default: 'processing' 
  }, // 파일 처리 상태 (썸네일/프리뷰 생성 등)
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // 멘션 정보
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // @멘션된 사용자 ID 배열
  mentionAll: { type: Boolean, default: false }, // @all 사용 여부
  mentionHere: { type: Boolean, default: false }, // @here 사용 여부

  // --- 스레드 및 공유 기능 추가 ---
  // [스레드] 부모 메시지 ID (1단계만 허용)
  parentMessageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  // [스레드] 답글 수 (부모 메시지에서 사용)
  replyCount: { type: Number, default: 0 },
  // [스레드] 마지막 답글 시간 (부모 메시지에서 사용)
  lastReplyAt: { type: Date },
  // [스레드] 스레드 내 시퀀스 번호
  threadSequenceNumber: { type: Number },
  // [스레드] 부모 메시지가 관리하는 마지막 스레드 시퀀스 번호
  lastThreadSequenceNumber: { type: Number, default: 0 },

  // [공유] 전달된 메시지 여부
  isForwarded: { type: Boolean, default: false },
  // [공유] 원본 발신자 이름 (복사 방식이므로 이름만 저장)
  originSenderName: { type: String },
  // ------------------------------

  timestamp: { type: Date, default: Date.now },
});

// 특정 방의 시퀀스 번호로 빠른 조회를 위한 인덱스
messageSchema.index({ roomId: 1, sequenceNumber: 1 });
// 스레드 조회를 위한 인덱스
messageSchema.index({ parentMessageId: 1, threadSequenceNumber: 1 });
// 스레드 목록(부모 메시지들) 조회를 위한 인덱스 (답글이 있는 메시지만 정렬해서 보여줄 때 유용)
messageSchema.index({ roomId: 1, lastReplyAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
