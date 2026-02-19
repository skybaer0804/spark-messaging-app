const express = require('express');
const router = express.Router();
const {
  createRoom,
  getRooms,
  updateRoom,
  deleteRoom,
  joinRoomByInvite,
  sendMessage,
  getMessages,
  getMessageById,
  uploadFile,
  setActiveRoom,
  syncMessages,
  markAsRead,
  leaveRoom,
  getRoomNotificationSettings,
  updateRoomNotificationSettings,
  uploadThumbnail, // 추가
  forwardMessage,
  getThreadList,
  getThreadMessages,
  removeRoomMember, // 추가
  joinRoom, // 추가
  reprocessFile, // 추가
} = require('../controllers/chatController');
const auth = require('../middleware/auth');
const workspaceAuth = require('../middleware/workspaceAuth');
const { upload, validateFileSize } = require('../middleware/upload');

router.use(auth); // 모든 채팅 라우트는 인증 필요

router.post('/rooms', workspaceAuth, createRoom);
router.post('/rooms/:roomId/join', workspaceAuth, joinRoom); // 추가
router.get('/rooms', getRooms);
router.put('/rooms/:roomId', workspaceAuth, updateRoom);
router.delete('/rooms/:roomId', workspaceAuth, deleteRoom);
router.post('/invite/:slug', workspaceAuth, joinRoomByInvite);
router.post('/leave/:roomId', leaveRoom);
router.post('/messages', workspaceAuth, sendMessage);
router.post('/messages/forward', workspaceAuth, forwardMessage);
router.get('/messages/:roomId', getMessages);
router.get('/threads/:roomId', getThreadList);
router.get('/threads/messages/:messageId', getThreadMessages);
router.get('/message/:messageId', getMessageById);
router.get('/sync/:roomId', syncMessages);
router.post('/read/:roomId', markAsRead);
router.post('/active-room', setActiveRoom);
router.post('/reprocess-file', reprocessFile); // 재처리 API 추가
router.delete('/rooms/:roomId/members/:userId', workspaceAuth, removeRoomMember); // 강퇴 API 추가
router.get('/rooms/:roomId/notification-settings', getRoomNotificationSettings);
router.put('/rooms/:roomId/notification-settings', updateRoomNotificationSettings);

// 파일 업로드 라우트 (다중 파일 지원)
router.post('/upload', upload.array('files', 10), validateFileSize, uploadFile);
// 썸네일 업로드 라우트 추가
router.post('/upload-thumbnail', upload.single('thumbnail'), uploadThumbnail);

module.exports = router;
