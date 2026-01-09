const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  type: {
    type: String,
    enum: ['public', 'private', 'direct', 'team', 'discussion'], // team, discussion 추가
    default: 'public',
  },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true }, // 워크스페이스 연결 필수화
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' }, // 팀 내 채널인 경우
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' }, // 토론방인 경우 상위 방 ID
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastSequenceNumber: { type: Number, default: 0 }, // 해당 방의 마지막 메시지 번호 추적
  isArchived: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
