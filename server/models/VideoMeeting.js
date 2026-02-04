const mongoose = require('mongoose');

const videoMeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom' }, // 연결된 채팅방 ID
  scheduledAt: { type: Date, required: true }, // 시작 예약 시간
  isReserved: { type: Boolean, default: false }, // 예약 회의 여부
  isPrivate: { type: Boolean, default: false }, // 비밀번호 설정 여부
  password: { type: String }, // 회의 입장 비밀번호 (해시화 권장)
  joinHash: { type: String, unique: true }, // 초대 링크용 고유 식별값
  status: { type: String, enum: ['scheduled', 'ongoing', 'completed', 'cancelled'], default: 'scheduled' },
  invitedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  invitedWorkspaces: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Workspace' }],
  maxParticipants: { type: Number, default: 20 },
  recordingUrl: { type: String },
  isRecording: { type: Boolean, default: false },
  activeParticipants: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      joinedAt: { type: Date, default: Date.now },
      leftAt: { type: Date },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('VideoMeeting', videoMeetingSchema);
