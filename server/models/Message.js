const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fileUrl: { type: String, required: true },
  thumbnailUrl: { type: String }, // 썸네일/프리뷰 이미지 URL
  renderUrl: { type: String }, // 3D 렌더링용 GLB URL
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true }, // 파일 크기 (bytes)
  mimeType: { type: String, required: true }, // MIME 타입
  processingStatus: { 
    type: String, 
    enum: ['processing', 'completed', 'failed', 'cancelled'], 
    default: 'processing' 
  }
}, { _id: true }); // 각 파일에 고유 ID 부여 (프론트엔드에서 key로 사용 가능)

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

  // 다중 파일 지원용 배열
  files: [fileSchema],

  // 하위 호환성을 위해 기존 필드 유지 (단일 파일인 경우 사용될 수 있음)
  fileUrl: { type: String },
  thumbnailUrl: { type: String }, 
  renderUrl: { type: String }, 
  fileName: { type: String },
  fileSize: { type: Number }, 
  mimeType: { type: String }, 
  groupId: { type: String }, // 다중 메시지 그룹화 (기존 방식)
  processingStatus: { 
    type: String, 
    enum: ['processing', 'completed', 'failed', 'cancelled'], 
    default: 'processing' 
  }, 

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
