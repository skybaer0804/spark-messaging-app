const Notification = require('../models/Notification');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

exports.createNotification = async (req, res) => {
  try {
    const { title, content, scheduledAt, targetType, targetId, actionUrl, metadata } = req.body;
    const senderId = req.user.id;

    // Admin 권한 체크 (대소문자 구분 없이 확인)
    const user = await User.findById(senderId);
    if (!user || user.role.toLowerCase() !== 'admin') {
      return res.status(403).json({ message: 'Only Admins can send notifications' });
    }

    const newNotification = new Notification({
      title,
      content,
      senderId,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      targetType: targetType || 'all',
      targetId: targetId || null,
      actionUrl: actionUrl || null,
      metadata: metadata || {},
    });

    await newNotification.save();

    // 예약 발송이 아니면 즉시 발송
    if (!scheduledAt) {
      await sendNotificationImmediately(newNotification);
    }

    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create notification', error: error.message });
  }
};

async function sendNotificationImmediately(notification) {
  try {
    const users = await User.find().select('_id');
    const userIds = users.map((u) => u._id.toString());

    if (userIds.length > 0) {
      notificationService.notifyGlobal(userIds, notification.title, notification.content, {
        actionUrl: notification.actionUrl,
        metadata: notification.metadata,
      });

      notification.isSent = true;
      await notification.save();
    }
  } catch (error) {
    console.error('Failed to send immediate notification:', error);
  }
}

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: error.message });
  }
};

// v2.3.0: 로그인 시 미수신 전체 공지 동기화
exports.syncNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    // lastSyncAt 필드 포함 조회
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 마지막 동기화 시점 확인 (없으면 lastLogoutAt, 그것도 없으면 0)
    const lastSyncAt = user.lastSyncAt || user.lastLogoutAt || new Date(0);

    // 마지막 동기화 이후에 생성된 'all' 대상 공지사항 조회
    const pendingNotifications = await Notification.find({
      targetType: 'all',
      isSent: true,
      createdAt: { $gt: lastSyncAt },
    }).sort({ createdAt: 1 });

    // [v2.4.0] 로그인 시 미수신 공지는 데이터로만 전달하고 웹 푸시 발송은 하지 않음
    // (사용자가 직접 알림 목록이나 뱃지를 통해 확인하도록 유도)
    if (pendingNotifications.length > 0) {
      // 동기화 시점 업데이트 (중복 방지)
      user.lastSyncAt = new Date();
      await user.save();
    } else {
      // 새로운 공지가 없더라도 동기화 시점은 현재로 업데이트하여 불필요한 재조회 방지
      user.lastSyncAt = new Date();
      await user.save();
    }

    res.json(pendingNotifications);
  } catch (error) {
    console.error('SyncNotifications error:', error);
    res.status(500).json({ message: 'Failed to sync notifications', error: error.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Admin 또는 작성자 권한 체크
    const user = await User.findById(userId);
    const isSender = notification.senderId.toString() === userId.toString();
    const isAdmin = user && user.role.toLowerCase() === 'admin';
    
    if (!isAdmin && !isSender) {
      return res.status(403).json({ message: 'No permission to delete this notification' });
    }

    await Notification.findByIdAndDelete(notificationId);

    res.json({ message: 'Notification deleted successfully', id: notificationId });
  } catch (error) {
    console.error('DeleteNotification error:', error);
    res.status(500).json({ message: 'Failed to delete notification', error: error.message });
  }
};

exports.getNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await Notification.findById(notificationId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    console.error('GetNotification error:', error);
    res.status(500).json({ message: 'Failed to fetch notification', error: error.message });
  }
};

exports.updateNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { title, content, scheduledAt, targetType, targetId, actionUrl, metadata } = req.body;
    const senderId = req.user.id;

    // 알림 존재 여부 및 권한 체크를 위해 먼저 조회
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Admin 또는 작성자 권한 체크
    const user = await User.findById(senderId);
    const isSender = notification.senderId.toString() === senderId.toString();
    const isAdmin = user && user.role.toLowerCase() === 'admin';
    
    if (!isAdmin && !isSender) {
      return res.status(403).json({ message: 'No permission to update this notification' });
    }

    // 이미 발송된 경우 수정 불가
    if (notification.isSent) {
      return res.status(400).json({ message: 'Cannot edit already sent notification' });
    }

    // 필드 업데이트
    if (title !== undefined) notification.title = title;
    if (content !== undefined) notification.content = content;
    if (scheduledAt !== undefined) notification.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (targetType !== undefined) notification.targetType = targetType;
    if (targetId !== undefined) notification.targetId = targetId;
    if (actionUrl !== undefined) notification.actionUrl = actionUrl;
    if (metadata !== undefined) notification.metadata = metadata;

    await notification.save();

    // 수정 결과가 즉시 발송인 경우 (scheduledAt이 없는 경우) 즉시 발송 처리
    if (!notification.scheduledAt && !notification.isSent) {
      await sendNotificationImmediately(notification);
    }

    res.json(notification);
  } catch (error) {
    console.error('UpdateNotification error:', error);
    res.status(500).json({ message: 'Failed to update notification', error: error.message });
  }
};
