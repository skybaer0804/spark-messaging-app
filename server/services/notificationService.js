const webpush = require('web-push');
const User = require('../models/User');
const PushSubscription = require('../models/PushSubscription');

class NotificationService {
  async sendPushNotification(userId, payload, roomId = null, messageData = null) {
    try {
      const User = require('../models/User');
      const UserChatRoom = require('../models/UserChatRoom');
      const userService = require('./userService');

      console.log(`[Push] Attempting to send notification to user: ${userId}, roomId: ${roomId || 'none'}`);

      const user = await User.findById(userId);
      if (!user) {
        console.warn(`[Push] User not found: ${userId}`);
        return;
      }

      // 1. [제거됨] 전역 알림 설정 확인 (UserChatRoom 기반 모드로 통합)

      // 2. 방별 알림 설정 확인 (UserChatRoom 기반)
      if (roomId) {
        const userChatRoom = await UserChatRoom.findOne({ userId, roomId });
        if (userChatRoom) {
          const mode = userChatRoom.notificationMode || 'default';
          
          if (mode === 'none') {
            console.log(`[Push] Notification muted for user ${userId} in room ${roomId}`);
            return; // 알림 차단
          }
          
          if (mode === 'mention') {
            // 멘션 체크
            if (messageData) {
              const userIdStr = userId.toString();
              const mentions = messageData.mentions || [];
              const isMentioned = 
                mentions.some(m => m.toString() === userIdStr) ||
                messageData.mentionAll ||
                messageData.mentionHere;
              
              if (!isMentioned) {
                console.log(`[Push] No mention for user ${userId} in room ${roomId}, skipping`);
                return; // 멘션되지 않았으면 알림 차단
              }
            } else {
              return; // 메시지 데이터가 없으면 차단
            }
          }
        }
      }

      // 3. [v2.4.0] 현재 유저가 이미 해당 방에 있는지 확인 (Redis 기반)
      if (roomId) {
        const activeRoomId = await userService.getActiveRoom(userId);
        if (activeRoomId === roomId.toString()) {
          console.log(`[Push] User ${userId} is already in room ${roomId}, skipping notification`);
          return;
        }
      }

      // 4. 해당 유저의 모든 활성 기기 구독 정보 조회
      const subscriptions = await PushSubscription.find({ userId, isActive: true });
      console.log(`[Push] Found ${subscriptions.length} active subscriptions for user ${userId}`);

      if (subscriptions.length === 0) {
        return;
      }

      // [v2.4.1] 중복된 엔드포인트 제거 (동일 기기 중복 구독 방지)
      const uniqueSubscriptions = [];
      const seenEndpoints = new Set();

      for (const sub of subscriptions) {
        if (!sub.subscription || !sub.subscription.endpoint) continue;
        
        if (!seenEndpoints.has(sub.subscription.endpoint)) {
          seenEndpoints.add(sub.subscription.endpoint);
          uniqueSubscriptions.push(sub);
        }
      }

      const pushPayload = JSON.stringify(payload);

      const pushPromises = uniqueSubscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(sub.subscription, pushPayload);
        } catch (error) {
          if (error.statusCode === 404 || error.statusCode === 410) {
            sub.isActive = false;
            await sub.save();
          } else {
            console.error(`Error sending push to device ${sub.deviceId}:`, error);
          }
        }
      });

      await Promise.all(pushPromises);
    } catch (error) {
      console.error('[Push] Error in sendPushNotification:', error);
    }
  }

  // 채팅 메시지 알림 전송 유틸리티
  async notifyNewMessage(recipientIds, senderName, messageContent, roomId, messageData = null) {
    const payload = {
      title: `${senderName}님의 메시지`,
      body: messageContent,
      icon: '/asset/spark_icon_192.png',
      data: {
        url: `/chatapp/chat/${roomId}`, // v2.4.0: 정확한 프론트엔드 경로로 수정
        roomId: roomId,
      },
    };

    // messageData에 mentions 정보 포함하여 전달
    const mentionData = messageData ? {
      mentions: messageData.mentions || [],
      mentionAll: messageData.mentionAll || false,
      mentionHere: messageData.mentionHere || false,
    } : null;

    const pushPromises = recipientIds.map((userId) => 
      this.sendPushNotification(userId, payload, roomId, mentionData)
    );

    await Promise.all(pushPromises);
  }

  // 강퇴 알림 전송
  async notifyKickedOut(userId, roomName, roomId) {
    console.log(`[Push] notifyKickedOut called for user: ${userId}, roomName: ${roomName}`);
    const payload = {
      title: '채팅방 퇴장 알림',
      body: `"${roomName}" 방에서 퇴장 처리되었습니다.`,
      icon: '/asset/spark_icon_192.png',
      data: {
        url: '/chatapp',
        roomId: roomId,
        type: 'kicked_out',
      },
    };

    // 방 설정을 무시하기 위해 roomId를 전달하지 않고 직접 push 알림 발송
    await this.sendPushNotification(userId, payload);
  }

  // 글로벌 공지사항 알림 전송
  async notifyGlobal(recipientIds, title, content, metadata = {}) {
    const payload = {
      title: title,
      body: content,
      icon: '/asset/spark_icon_192.png',
      data: {
        url: metadata.actionUrl || metadata.url || '/',
        ...metadata,
      },
    };

    const pushPromises = recipientIds.map((userId) => this.sendPushNotification(userId, payload));

    await Promise.all(pushPromises);
  }
}

module.exports = new NotificationService();
