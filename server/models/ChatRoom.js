const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  name: { type: String }, // 1:1의 경우 이름이 없을 수 있으므로 default 제거
  description: { type: String }, // 방 설명 추가
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  invitedOrgs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }],
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }, // 소속 조직 ID
  roomType: {
    type: String,
    enum: ['DIRECT', 'DISCUSSION', 'CHANNEL', 'TEAM', 'VIDEO_MEETING'],
    default: 'DIRECT',
  },
  isGroup: { type: Boolean, default: false },
  isPrivate: { type: Boolean, default: false }, // 공개/비공개 여부 (채널, 팀용)
  lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
