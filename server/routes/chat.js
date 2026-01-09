const express = require('express');
const router = express.Router();
const {
  createRoom,
  getRooms,
  sendMessage,
  getMessages,
  uploadFile,
  setActiveRoom,
  syncMessages,
  markAsRead,
  leaveRoom,
} = require('../controllers/chatController');
const auth = require('../middleware/auth');
const workspaceAuth = require('../middleware/workspaceAuth');
const upload = require('../middleware/upload');

router.use(auth); // 모든 채팅 라우트는 인증 필요

router.post('/rooms', workspaceAuth, createRoom);
router.get('/rooms', getRooms);
router.post('/leave/:roomId', leaveRoom);
router.post('/messages', workspaceAuth, sendMessage);
router.get('/messages/:roomId', getMessages);
router.get('/sync/:roomId', syncMessages);
router.post('/read/:roomId', markAsRead);
router.post('/active-room', setActiveRoom);

// 파일 업로드 라우트 추가 (파일 업로드 시에도 workspaceId 확인 권장되지만 일단 인증만)
router.post('/upload', upload.single('file'), uploadFile);

module.exports = router;
