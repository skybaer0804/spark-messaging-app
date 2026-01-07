const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: { type: String, required: true },
  type: { type: String, enum: ['text', 'file', 'image', 'video', 'audio'], default: 'text' },
  fileUrl: { type: String },      // 원본 파일 경로 (S3 또는 서버 로컬)
  thumbnailUrl: { type: String }, // 이미지 썸네일 경로
  fileName: { type: String },     // 원본 파일명
  fileSize: { type: Number },     // 파일 크기
  mimeType: { type: String },     // MIME 타입
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
