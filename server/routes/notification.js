const express = require('express');
const router = express.Router();
const {
  createNotification,
  getNotifications,
  syncNotifications,
  deleteNotification,
  getNotification,
  updateNotification,
} = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', createNotification);
router.get('/', getNotifications);
router.get('/sync', syncNotifications);
router.get('/:notificationId', getNotification);
router.delete('/:notificationId', deleteNotification);
router.put('/:notificationId', updateNotification);

module.exports = router;
