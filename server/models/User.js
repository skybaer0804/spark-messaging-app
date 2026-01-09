const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profileImage: { type: String },
  // 사용자 상태 관리 추가
  status: {
    type: String,
    enum: ['online', 'away', 'busy', 'offline'],
    default: 'offline',
  },
  statusText: { type: String, default: '' }, // 상태 메시지
  organizations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Organization' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
