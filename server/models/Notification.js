const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actionUrl: { type: String }, // 클릭 시 이동할 URL (v2.3.0 추가)
  metadata: { type: mongoose.Schema.Types.Map, of: String }, // 추가 메타데이터 (v2.3.0 추가)
  scheduledAt: { type: Date }, // 예약 발송 시간
  isSent: { type: Boolean, default: false },
  targetType: { type: String, enum: ['all', 'workspace'], default: 'all' },
  targetId: { type: mongoose.Schema.Types.ObjectId }, // 특정 워크스페이스 ID 등
  metadata: {
    url: String,
    type: { type: String }, // 'link', 'chat', 'workspace' 등
    targetId: String,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
