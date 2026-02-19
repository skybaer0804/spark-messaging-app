const ChatRoom = require('../models/ChatRoom');
const ERROR_MESSAGES = require('../constants/errorMessages');
const Message = require('../models/Message');
const User = require('../models/User');
const UserChatRoom = require('../models/UserChatRoom');
const UserTeam = require('../models/UserTeam');
const socketService = require('../services/socketService');
const notificationService = require('../services/notificationService');
const userService = require('../services/userService');
const imageService = require('../services/imageService');
const StorageService = require('../services/storage/StorageService');
const FileProcessingQueue = require('../services/queue/FileProcessingQueue');
const sharp = require('sharp');

// 멘션 파싱 유틸리티 함수
function parseMentions(content, roomMembers) {
  const mentions = [];
  let mentionAll = false;
  let mentionHere = false;

  if (!content || typeof content !== 'string') {
    return { mentions, mentionAll, mentionHere };
  }

  // @username 패턴 찾기 (한글, 영문, 숫자, 언더스코어 지원)
  const mentionPattern = /@([가-힣a-zA-Z0-9_]+)/g;
  let match;
  const foundUsernames = new Set();

  while ((match = mentionPattern.exec(content)) !== null) {
    const username = match[1];
    foundUsernames.add(username);
  }

  // 찾은 username을 member ID로 변환
  for (const username of foundUsernames) {
    const member = roomMembers.find((m) => m.username === username);
    if (member) {
      mentions.push(member._id);
    }
  }

  // @all, @here 체크 (단어 경계 고려, 메시지 시작 부분 또는 공백 뒤)
  if (/(^|\s)@all\b/i.test(content)) mentionAll = true;
  if (/(^|\s)@here\b/i.test(content)) mentionHere = true;

  return { mentions, mentionAll, mentionHere, foundUsernames: Array.from(foundUsernames) };
}

// [v2.7.3] 푸시 알림 전송 공통 헬퍼 함수
async function sendPushNotificationHelper(roomId, senderId, senderName, content, allMemberIds, messageData = {}) {
  const { mentions = [], mentionAll = false, mentionHere = false } = messageData;
  
  // 1. 발송 대상 필터링 (나를 제외한 나머지 멤버)
  const recipientIds = [...new Set(allMemberIds.filter((id) => id !== senderId))];
  if (recipientIds.length === 0) return;

  // 2. 현재 해당 방을 보고 있는 사용자 제외
  const activeRooms = await userService.getUsersActiveRooms(recipientIds);
  const recipientIdsToNotify = recipientIds.filter((id) => {
    const isNotInRoom = activeRooms[id] !== roomId.toString();
    return isNotInRoom;
  });
  if (recipientIdsToNotify.length === 0) return;

  // 3. 사용자별 알림 설정(방별 설정) 확인 및 @here/@all 필터링
  const finalRecipients = [];
  
  // [v2.7.4] @here 처리를 위해 사용자들의 온라인 상태 조회
  const userStatuses = mentionHere ? await userService.getUsersStatus(recipientIdsToNotify) : {};

  for (const userId of recipientIdsToNotify) {
    const userChatRoom = await UserChatRoom.findOne({ userId, roomId });

    // 기본 모드 결정 (설정 없으면 default)
    const mode = userChatRoom ? (userChatRoom.notificationMode || 'default') : 'default';
    
    if (mode === 'none') continue; // 알림 끔

    // 멘션 여부 확인
    const isExplicitlyMentioned = mentions.some((m) => m.toString() === userId.toString());
    const isMentioned = isExplicitlyMentioned || mentionAll || mentionHere;

    if (mode === 'mention' && !isMentioned) {
      continue; // 멘션 모드인데 멘션되지 않았으면 건너뜀
    }

    // [v2.7.4] @here 처리: 오프라인이 아닌 유저(online, away, busy)이거나 직접 멘션된 경우만 발송
    if (mentionHere && !mentionAll && !isExplicitlyMentioned) {
      const status = userStatuses[userId] || 'offline';
      if (status === 'offline') {
        continue;
      }
    }

    finalRecipients.push(userId);
  }

  // 4. 알림 전송
  if (finalRecipients.length > 0) {
    notificationService.notifyNewMessage(finalRecipients, senderName, content, roomId, {
      mentions: mentions.map((m) => m.toString()),
      mentionAll,
      mentionHere,
    });
  }
}

// 채팅방 생성
exports.createRoom = async (req, res) => {
  try {
    let { name, members, type = 'public', description, workspaceId, teamId, parentId, isPrivate } = req.body;
    const currentUserId = req.user.id;

    // v2.2.0: workspaceId가 body에 없으면 헤더에서 확인
    if (!workspaceId) {
      workspaceId = req.headers['x-workspace-id'];
    }

    if (!workspaceId) {
      return res.status(400).json(ERROR_MESSAGES.COMMON.WORKSPACE_REQUIRED);
    }

    // 멤버 목록에 현재 사용자 추가 (중복 방지)
    const roomMembers = [...new Set([...(members || []), currentUserId])];

    let roomIdentifier = null;

    // 1:1 대화방(direct)인 경우 고유 식별자 생성 및 중복 체크
    if (type === 'direct' && roomMembers.length === 2) {
      // 두 유저 ID를 정렬하여 고유한 식별자 생성 (A_B 형태)
      roomIdentifier = roomMembers.sort().join('_');

      const existingRoom = await ChatRoom.findOne({
        identifier: roomIdentifier,
        workspaceId,
      });

      if (existingRoom) {
        const populatedRoom = await ChatRoom.findById(existingRoom._id).populate(
          'members',
          'username profileImage status',
        );
        return res.status(200).json(populatedRoom);
      }
    }

    // 팀 채팅방인 경우 기존 방이 있는지 확인 및 멤버십 보장
    if (type === 'team' && teamId) {
      const existingRoom = await ChatRoom.findOne({ teamId, type: 'team' });
      if (existingRoom) {
        // 멤버십 확인 및 추가
        const isMember = existingRoom.members.some((m) => m.toString() === currentUserId.toString());
        if (!isMember) {
          existingRoom.members.push(currentUserId);
          await existingRoom.save();
        }

        // UserChatRoom 레코드 보장
        await UserChatRoom.findOneAndUpdate(
          { userId: currentUserId, roomId: existingRoom._id },
          {
            userId: currentUserId,
            roomId: existingRoom._id,
          },
          { upsert: true, new: true },
        );

        // 멤버들에게 방 목록 업데이트 알림
        socketService.notifyRoomListUpdated(currentUserId);

        const populatedRoom = await ChatRoom.findById(existingRoom._id).populate(
          'members',
          'username profileImage status statusText',
        );

        const roomObj = populatedRoom.toObject();
        roomObj.displayName = roomObj.name;

        return res.status(200).json(roomObj);
      }
    }

    // Private 채널인 경우 slug 생성
    let slug = null;
    if ((type === 'private' || isPrivate) && type !== 'direct') {
      // v2.4.5: type: 'private'은 이제 사용하지 않음. 'public'으로 통일하고 isPrivate 필드로 구분
      if (type === 'private') {
        type = 'public';
        isPrivate = true;
      }

      // 이름 기반으로 slug 생성 (영문, 숫자, 하이픈, 언더스코어만 허용)
      const baseSlug = (name || 'channel')
        .toLowerCase()
        .replace(/[^a-z0-9가-힣_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // 고유한 slug 생성 (중복 방지)
      let uniqueSlug = baseSlug;
      let counter = 1;
      while (await ChatRoom.findOne({ slug: uniqueSlug, workspaceId })) {
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      slug = uniqueSlug;
    }

    const roomData = {
      name: type === 'direct' ? null : name || 'New Room',
      description,
      members: roomMembers,
      workspaceId,
      type,
      teamId,
      parentId,
      isPrivate: !!(isPrivate || type === 'private'),
      createdBy: currentUserId,
      identifier: roomIdentifier || undefined, // null 대신 undefined 사용하여 sparse index 활용
      slug: slug || undefined,
    };

    const newRoom = new ChatRoom(roomData);

    await newRoom.save();

    // 모든 멤버에 대해 UserChatRoom 초기 레코드 생성
    const userChatRoomPromises = roomMembers.map((userId) =>
      UserChatRoom.findOneAndUpdate(
        { userId, roomId: newRoom._id },
        {
          userId,
          roomId: newRoom._id,
          lastReadSequenceNumber: newRoom.lastSequenceNumber, // [v2.4.0] 초기 참여자는 현재까지 읽은 것으로 간주
          unreadCount: 0,
        },
        { upsert: true, new: true },
      ),
    );
    await Promise.all(userChatRoomPromises);

    // 2.2.0: 모든 멤버에게 방 목록 업데이트 알림
    roomMembers.forEach((userId) => {
      socketService.notifyRoomListUpdated(userId);
    });

    // 생성된 방 정보를 멤버들과 함께 리턴
    const populatedRoom = await ChatRoom.findById(newRoom._id).populate(
      'members',
      'username profileImage status statusText',
    );

    const roomObj = populatedRoom.toObject();
    if (roomObj.type === 'direct') {
      const otherMember = roomObj.members.find((m) => m._id.toString() !== currentUserId.toString());
      roomObj.displayName = otherMember ? otherMember.username : 'Unknown';
      roomObj.displayAvatar = otherMember ? otherMember.profileImage || otherMember.avatar : null;
      roomObj.displayStatus = otherMember ? otherMember.status : 'offline';
      roomObj.displayStatusText = otherMember ? otherMember.statusText : '';
    } else {
      roomObj.displayName = roomObj.name;
    }

    res.status(201).json(roomObj);
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ ...ERROR_MESSAGES.CHAT.FAILED_TO_CREATE_ROOM, error: error.message });
  }
};

// 사용자가 속한 채팅방 목록 조회 (UserChatRoom 기반)
exports.getRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    const { workspaceId } = req.query;

    // 1. 사용자가 참여 중인 방 목록 조회 (UserChatRoom 기반)
    const userRooms = await UserChatRoom.find({ userId }).populate({
      path: 'roomId',
      populate: [
        { path: 'members', select: 'username profileImage status statusText' },
        {
          path: 'lastMessage',
          populate: { path: 'senderId', select: 'username' },
        },
      ],
    });

    const joinedRoomIds = userRooms.filter(ur => ur.roomId).map(ur => ur.roomId._id.toString());

    // 2. 해당 워크스페이스의 모든 공개 채널 및 토론 조회 (참여하지 않은 것 포함)
    const publicQuery = { 
      type: { $in: ['public', 'discussion'] }, 
      isPrivate: { $ne: true }, 
      isArchived: { $ne: true } 
    };
    if (workspaceId) {
      publicQuery.workspaceId = workspaceId;
    }
    
    const allPublicRooms = await ChatRoom.find(publicQuery)
      .populate('members', 'username profileImage status statusText')
      .populate({
        path: 'lastMessage',
        populate: { path: 'senderId', select: 'username' },
      });

    // 3. 참여 중인 방 가공
    const joinedRoomsFormatted = userRooms
      .filter(
        (ur) =>
          ur.roomId && !ur.roomId.isArchived && (!workspaceId || ur.roomId.workspaceId.toString() === workspaceId),
      )
      .map((ur) => {
        const room = ur.roomId.toObject();
        const lastSequenceNumber = room.lastSequenceNumber || 0;
        const lastReadSequenceNumber = ur.lastReadSequenceNumber || 0;
        const unreadCount = Math.max(0, lastSequenceNumber - lastReadSequenceNumber);

        const isPrivate = room.isPrivate || room.private || room.type === 'private' || room.type === 'direct';

        if (room.type === 'direct') {
          const otherMember = room.members.find((m) => m._id.toString() !== userId.toString());
          room.displayName = otherMember ? otherMember.username : 'Unknown';
          room.displayAvatar = otherMember ? otherMember.profileImage || otherMember.avatar : null;
          room.displayStatus = otherMember ? otherMember.status : 'offline';
          room.displayStatusText = otherMember ? otherMember.statusText : '';
        } else {
          room.displayName = room.name;
        }

        return {
          ...room,
          isPrivate,
          unreadCount,
          isPinned: ur.isPinned,
          notificationEnabled: ur.notificationEnabled,
          isJoined: true,
        };
      });

    // 4. 참여하지 않은 공개 채널 가공 및 병합
    const unjoinedPublicRooms = allPublicRooms
      .filter(pr => !joinedRoomIds.includes(pr._id.toString()))
      .map(pr => {
        const room = pr.toObject();
        return {
          ...room,
          displayName: room.name,
          isPrivate: false,
          unreadCount: 0,
          isJoined: false,
        };
      });

    const formattedRooms = [...joinedRoomsFormatted, ...unjoinedPublicRooms]
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    res.json(formattedRooms);
  } catch (error) {
    res.status(500).json({ ...ERROR_MESSAGES.CHAT.FAILED_TO_FETCH_ROOMS, error: error.message });
  }
};

// 채팅방 수정
exports.updateRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { name, description, members, isPrivate, type } = req.body;
    const currentUserId = req.user.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json(ERROR_MESSAGES.CHAT.ROOM_NOT_FOUND);
    }

    // 권한 확인: 현재 사용자가 방의 멤버인지 확인
    const isMember = room.members.some((m) => m.toString() === currentUserId.toString());
    if (!isMember) {
      return res.status(403).json(ERROR_MESSAGES.CHAT.NOT_MEMBER);
    }

    // 업데이트할 데이터 구성
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isPrivate !== undefined) {
      updateData.isPrivate = isPrivate;
      // Private로 변경 시 slug 생성
      if (isPrivate && !room.slug && room.type !== 'direct') {
        const baseSlug = (name || room.name || 'channel')
          .toLowerCase()
          .replace(/[^a-z0-9가-힣_-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        let uniqueSlug = baseSlug;
        let counter = 1;
        while (await ChatRoom.findOne({ slug: uniqueSlug, workspaceId: room.workspaceId, _id: { $ne: roomId } })) {
          uniqueSlug = `${baseSlug}-${counter}`;
          counter++;
        }
        updateData.slug = uniqueSlug;
      }
    }
    if (type !== undefined) updateData.type = type;
    if (members !== undefined && Array.isArray(members)) {
      // [v2.7.0] 방장(createdBy)은 절대로 멤버에서 제거될 수 없음
      const roomOwnerId = room.createdBy ? room.createdBy.toString() : null;
      
      // 권한 확인: 멤버 변경은 방장만 가능
      if (roomOwnerId && currentUserId.toString() !== roomOwnerId) {
        return res.status(403).json(ERROR_MESSAGES.CHAT.ONLY_OWNER_CAN_CHANGE);
      }

      // 멤버 목록에 방장 포함 보장
      const roomMembers = [...new Set([...members, roomOwnerId || currentUserId])];
      updateData.members = roomMembers;
    }

    // 방 정보 업데이트
    const updatedRoom = await ChatRoom.findByIdAndUpdate(roomId, updateData, { new: true }).populate(
      'members',
      'username profileImage status statusText',
    );

    // 멤버 목록이 변경된 경우 UserChatRoom 레코드 업데이트 및 강퇴 처리
    if (members !== undefined && Array.isArray(members)) {
      const roomMembers = updateData.members;

      // 기존 멤버들의 UserChatRoom 레코드 유지
      const existingUserChatRooms = await UserChatRoom.find({ roomId });
      const existingUserIds = existingUserChatRooms.map((ucr) => ucr.userId.toString());

      // 새로 추가된 멤버들에 대한 UserChatRoom 레코드 생성
      const newMemberIds = roomMembers.filter((id) => !existingUserIds.includes(id.toString()));
      for (const userId of newMemberIds) {
        await UserChatRoom.findOneAndUpdate(
          { userId, roomId },
          {
            userId,
            roomId,
            lastReadSequenceNumber: updatedRoom.lastSequenceNumber || 0,
            unreadCount: 0,
          },
          { upsert: true, new: true },
        );
      }

      // [v2.7.0] 제거된 멤버들의 UserChatRoom 레코드 삭제 및 강퇴 알림 발송
      const removedUserIds = existingUserIds.filter((id) => !roomMembers.some((m) => m.toString() === id));
      
      if (removedUserIds.length > 0) {
        // [v2.7.2] 제거된 멤버들에 대한 시스템 메시지 생성 및 방 정보 업데이트 준비
        let currentSequenceNumber = updatedRoom.lastSequenceNumber || 0;
        
        for (const userId of removedUserIds) {
          await UserChatRoom.findOneAndDelete({ userId, roomId });
          
          // 강퇴된 사용자에게 실시간 알림 (방 목록에서 즉시 삭제되도록)
          socketService.notifyRoomListUpdated(userId, {
            _id: roomId,
            isRemoved: true,
            targetUserId: userId,
          });

          // [v2.7.1] 강퇴된 사용자에게 푸시 알림 발송
          notificationService.notifyKickedOut(userId, updatedRoom.name || room.name, roomId);

          // [v2.7.2] 시스템 메시지 생성 (강퇴 알림)
          const targetUser = await User.findById(userId).select('username');
          currentSequenceNumber += 1;
          
          const systemMessage = new Message({
            roomId,
            senderId: currentUserId,
            content: `${targetUser?.username || '알 수 없는 사용자'}님이 강퇴되었습니다.`,
            type: 'system',
            sequenceNumber: currentSequenceNumber,
          });
          await systemMessage.save();

          // 실시간 시스템 메시지 브로드캐스트
          await socketService.sendRoomMessage(roomId, 'system', {
            _id: systemMessage._id,
            roomId,
            content: systemMessage.content,
            senderId: currentUserId,
            senderName: 'System',
            sequenceNumber: systemMessage.sequenceNumber,
            timestamp: systemMessage.timestamp,
          }, currentUserId);

          // 방의 마지막 메시지 및 시퀀스 업데이트
          await ChatRoom.findByIdAndUpdate(roomId, {
            lastSequenceNumber: currentSequenceNumber,
            lastMessage: systemMessage._id
          });
        }
        
        // 최종적으로 업데이트된 방 정보를 다시 가져옴 (시스템 메시지 반영됨)
        const finalUpdatedRoom = await ChatRoom.findById(roomId).populate(
          'members',
          'username profileImage status statusText',
        );

        // 남은 멤버들에게 업데이트된 방 정보 브로드캐스트
        roomMembers.forEach((userId) => {
          socketService.notifyRoomListUpdated(userId.toString(), {
            ...finalUpdatedRoom.toObject(),
            targetUserId: userId.toString()
          });
        });
      } else {
        // 남은 멤버들에게 방 목록 업데이트 알림 (추가만 된 경우 등)
        roomMembers.forEach((userId) => {
          socketService.notifyRoomListUpdated(userId.toString(), {
            ...updatedRoom.toObject(),
            targetUserId: userId.toString()
          });
        });
      }
    } else {
      // 멤버 목록이 변경되지 않은 경우에도 방 목록 업데이트 알림
      updatedRoom.members.forEach((member) => {
        socketService.notifyRoomListUpdated(member._id.toString(), {
          ...updatedRoom.toObject(),
          targetUserId: member._id.toString()
        });
      });
    }

    const roomObj = updatedRoom.toObject();
    if (roomObj.type === 'direct') {
      const otherMember = roomObj.members.find((m) => m._id.toString() !== currentUserId.toString());
      roomObj.displayName = otherMember ? otherMember.username : 'Unknown';
      roomObj.displayAvatar = otherMember ? otherMember.profileImage || otherMember.avatar : null;
      roomObj.displayStatus = otherMember ? otherMember.status : 'offline';
      roomObj.displayStatusText = otherMember ? otherMember.statusText : '';
    } else {
      roomObj.displayName = roomObj.name;
    }

    res.json(roomObj);
  } catch (error) {
    console.error('Error updating room:', error);
    res.status(500).json({ ...ERROR_MESSAGES.CHAT.FAILED_TO_UPDATE_ROOM, error: error.message });
  }
};

// 초대 링크로 채팅방 입장
exports.joinRoomByInvite = async (req, res) => {
  try {
    const { slug } = req.params;
    const currentUserId = req.user.id;
    const workspaceId = req.headers['x-workspace-id'] || req.body.workspaceId;

    if (!workspaceId) {
      return res.status(400).json(ERROR_MESSAGES.COMMON.WORKSPACE_REQUIRED);
    }

    // slug로 채팅방 찾기
    const room = await ChatRoom.findOne({ slug, workspaceId, isPrivate: true });
    if (!room) {
      return res.status(404).json(ERROR_MESSAGES.CHAT.ROOM_NOT_FOUND);
    }

    // 이미 멤버인지 확인
    const isMember = room.members.some((m) => m.toString() === currentUserId.toString());
    if (isMember) {
      // 이미 멤버인 경우 방 정보 반환
      const populatedRoom = await ChatRoom.findById(room._id).populate(
        'members',
        'username profileImage status statusText',
      );
      const roomObj = populatedRoom.toObject();
      roomObj.displayName = roomObj.name;
      return res.json(roomObj);
    }

    // 멤버 추가
    room.members.push(currentUserId);
    await room.save();

    // UserChatRoom 레코드 생성
    await UserChatRoom.findOneAndUpdate(
      { userId: currentUserId, roomId: room._id },
      {
        userId: currentUserId,
        roomId: room._id,
        lastReadSequenceNumber: room.lastSequenceNumber || 0,
        unreadCount: 0,
      },
      { upsert: true, new: true },
    );

    // 모든 멤버에게 방 목록 업데이트 알림
    room.members.forEach((memberId) => {
      socketService.notifyRoomListUpdated(memberId.toString());
    });

    const populatedRoom = await ChatRoom.findById(room._id).populate(
      'members',
      'username profileImage status statusText',
    );
    const roomObj = populatedRoom.toObject();
    roomObj.displayName = roomObj.name;

    res.json(roomObj);
  } catch (error) {
    console.error('Error joining room by invite:', error);
    res.status(500).json({ ...ERROR_MESSAGES.CHAT.FAILED_TO_JOIN_ROOM, error: error.message });
  }
};

// 채팅방 삭제
exports.deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json(ERROR_MESSAGES.CHAT.ROOM_NOT_FOUND);
    }

    // 권한 확인: 현재 사용자가 방의 멤버인지 확인
    const isMember = room.members.some((m) => m.toString() === currentUserId.toString());
    if (!isMember) {
      return res.status(403).json(ERROR_MESSAGES.CHAT.NOT_MEMBER);
    }

    // 모든 멤버의 UserChatRoom 레코드 삭제
    await UserChatRoom.deleteMany({ roomId });

    // 방 삭제 (실제로는 아카이브 처리)
    room.isArchived = true;
    await room.save();

    // 모든 멤버에게 방 목록 업데이트 알림
    room.members.forEach((memberId) => {
      socketService.notifyRoomListUpdated(memberId.toString());
    });

    res.json(ERROR_MESSAGES.CHAT.SUCCESS_DELETE_ROOM);
  } catch (error) {
    console.error('Error deleting room:', error);
    res.status(500).json({ ...ERROR_MESSAGES.CHAT.FAILED_TO_DELETE_ROOM, error: error.message });
  }
};

// 채팅방 나가기
exports.leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const room = await ChatRoom.findById(roomId).populate('members', 'username');
    if (!room) {
      return res.status(404).json(ERROR_MESSAGES.CHAT.ROOM_NOT_FOUND);
    }

    const user = room.members.find((m) => m._id.toString() === userId.toString());
    const username = user ? user.username : 'Unknown';

    // 1. UserChatRoom 레코드 삭제 (사용자의 방 목록에서 제거)
    await UserChatRoom.findOneAndDelete({ userId, roomId });

    // 2. ChatRoom의 members 배열에서 사용자 제거
    room.members = room.members.filter((m) => m._id.toString() !== userId.toString());

    // 3. 팀 채팅방인 경우 UserTeam에서도 제거
    if (room.type === 'team' && room.teamId) {
      await UserTeam.findOneAndDelete({ userId, teamId: room.teamId });
    }

    // 4. 1:1 대화방(direct)인 경우 추가 처리
    if (room.type === 'direct') {
      room.identifier = undefined; // null 대신 undefined로 설정하여 유니크 인덱스 충돌 방지 (sparse)
      if (room.members.length === 0) {
        room.isArchived = true;
      }
    } else {
      // 그룹 방의 경우에도 멤버가 없으면 아카이브
      if (room.members.length === 0) {
        room.isArchived = true;
      }
    }

    // v2.3.0: 시스템 메시지 생성 (퇴장 알림)
    if (room.members.length > 0) {
      // 시퀀스 번호 증가
      room.lastSequenceNumber += 1;
      const sequenceNumber = room.lastSequenceNumber;

      const systemMessage = new Message({
        roomId,
        senderId: userId, // 나간 사람이 보낸 것처럼 처리하거나 별도 시스템 ID 사용 가능
        content: `${username}님이 나갔습니다.`,
        type: 'system',
        sequenceNumber,
      });
      await systemMessage.save();
      room.lastMessage = systemMessage._id;

      // 남은 멤버들에게 실시간 메시지 브로드캐스트
      const messageData = {
        _id: systemMessage._id,
        roomId,
        content: systemMessage.content,
        senderId: userId,
        senderName: 'System',
        sequenceNumber,
        timestamp: systemMessage.timestamp,
      };
      await socketService.sendRoomMessage(roomId, 'system', messageData, userId);
    }

    await room.save();

    // 4. 방에 남아있는 사람들에게 목록 갱신 알림
    for (const member of room.members) {
      try {
        const userIdStr = member._id ? member._id.toString() : member.toString();
        const userChatRoom = await UserChatRoom.findOne({ userId: userIdStr, roomId });
        if (!userChatRoom) continue;

        const unreadCount = Math.max(0, room.lastSequenceNumber - (userChatRoom.lastReadSequenceNumber || 0));

        socketService.notifyRoomListUpdated(userIdStr, {
          _id: roomId,
          isArchived: room.isArchived,
          isPrivate: room.isPrivate,
          members: room.members,
          lastMessage: room.lastMessage,
          updatedAt: room.updatedAt,
          unreadCount,
        });
      } catch (err) {
        console.error(`Failed to notify leave room update for user ${memberId}:`, err);
      }
    }

    // 5. v2.3.0: 나간 본인에게도 방 목록이 갱신(제거)되어야 함을 알림
    // 클라이언트가 이 응답을 받으면 목록에서 제거함
    socketService.notifyRoomListUpdated(userId, {
      _id: roomId,
      isRemoved: true, // [v2.4.0] 이 플래그를 통해 프론트엔드에서 즉시 제거
      targetUserId: userId,
    });

    res.json({ ...ERROR_MESSAGES.CHAT.SUCCESS_LEFT_ROOM, roomId });
  } catch (error) {
    console.error('LeaveRoom error:', error);
    res.status(500).json({ ...ERROR_MESSAGES.CHAT.FAILED_TO_LEAVE_ROOM, error: error.message });
  }
};

/**
 * 썸네일 업로드 및 메시지 업데이트
 * 클라이언트에서 3D 렌더링 후 스냅샷을 찍어 전송할 때 사용
 */
exports.uploadThumbnail = async (req, res) => {
  try {
    const { messageId, roomId, fileIndex } = req.body;
    const file = req.file;

    if (!file || !messageId) {
      return res.status(400).json(ERROR_MESSAGES.COMMON.INVALID_INPUT);
    }

    const StorageService = require('../services/storage/StorageService');
    const sharp = require('sharp');

    // 1. 이미지 리사이징 및 WebP 변환
    const thumbnailBuffer = await sharp(file.path)
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .toFormat('webp')
      .toBuffer();

    // 2. 썸네일 저장
    const filename = `thumb_${messageId}_${fileIndex !== undefined ? fileIndex : 'main'}_${Date.now()}.webp`;
    const storageResult = await StorageService.saveThumbnail(thumbnailBuffer, filename);

    // 3. DB 업데이트
    const updateObj = {};
    const socketPayload = {
      messageId,
      thumbnailUrl: storageResult.url,
      processingStatus: 'completed'
    };

    if (fileIndex !== undefined && fileIndex !== null) {
      const idx = parseInt(fileIndex);
      updateObj[`files.${idx}.thumbnailUrl`] = storageResult.url;
      updateObj[`files.${idx}.processingStatus`] = 'completed';
      socketPayload.fileIndex = idx;
      
      // 첫 번째 파일이면 탑레벨도 업데이트
      if (idx === 0) {
        updateObj.thumbnailUrl = storageResult.url;
      }
    } else {
      updateObj.thumbnailUrl = storageResult.url;
      updateObj.processingStatus = 'completed';
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      { $set: updateObj },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json(ERROR_MESSAGES.CHAT.MESSAGE_NOT_FOUND);
    }

    // 4. 소켓으로 업데이트 브로드캐스트
    await socketService.sendMessageUpdate(roomId, socketPayload);

    // 5. 임시 파일 삭제
    const fs = require('fs');
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    res.json({
      success: true,
      thumbnailUrl: storageResult.url
    });
  } catch (error) {
    console.error('UploadThumbnail error:', error);
    res.status(500).json({ ...ERROR_MESSAGES.COMMON.FILE_UPLOAD_FAILED, error: error.message });
  }
};

// [v2.8.0] 파일 업로드 처리 (다중 파일 지원)
exports.uploadFile = async (req, res) => {
  const { roomId, parentMessageId, groupId } = req.body;
  const senderId = req.user.id;
  const files = req.files || (req.file ? [req.file] : []);

  if (files.length === 0) {
    return res.status(400).json(ERROR_MESSAGES.COMMON.INVALID_INPUT);
  }

  // 타임아웃 설정 (가장 큰 파일 기준)
  const { getFileTimeout, getFileType } = require('../config/fileConfig');
  let maxTimeout = 30 * 60 * 1000; // 최소 30분
  
  for (const file of files) {
    const timeout = getFileTimeout(file.mimetype, file.originalname);
    if (timeout > maxTimeout) maxTimeout = timeout;
  }

  req.setTimeout(maxTimeout, () => {
    if (!res.headersSent) {
      res.status(408).json(ERROR_MESSAGES.COMMON.FILE_UPLOAD_TIMEOUT);
    }
  });

  // 연결 종료/취소 시 정리 로직
  req.on('close', () => {
    if (!res.finished) {
      for (const file of files) {
        if (file.path) {
          try {
            require('fs').unlinkSync(file.path);
          } catch (err) {}
        }
      }
    }
  });

  try {
    // 1. 방 및 권한 체크
    const room = await ChatRoom.findByIdAndUpdate(
      roomId, 
      { $inc: { lastSequenceNumber: 1 } }, 
      { new: true }
    ).populate('members', 'username profileImage status statusText');

    if (!room) {
      return res.status(404).json(ERROR_MESSAGES.CHAT.ROOM_NOT_FOUND);
    }

    const sender = room.members.find((m) => m._id.toString() === senderId);
    if (!sender) {
      return res.status(403).json(ERROR_MESSAGES.CHAT.NOT_MEMBER);
    }

    const sequenceNumber = room.lastSequenceNumber;
    let threadSequenceNumber = null;

    // [스레드 전용] 부모 메시지가 있는 경우 처리
    if (parentMessageId) {
      const parentMessage = await Message.findByIdAndUpdate(
        parentMessageId,
        {
          $inc: { replyCount: 1, lastThreadSequenceNumber: 1 },
          $set: { lastReplyAt: new Date() }
        },
        { new: true }
      );

      if (parentMessage) {
        threadSequenceNumber = parentMessage.lastThreadSequenceNumber;
      }
    }

    // 2. 파일 처리 (저장 및 썸네일 생성)
    const processedFiles = [];
    let overallType = 'file';
    const typesFound = new Set();

    for (const file of files) {
      // 파일 저장
      const fileResult = await StorageService.saveFile(file, 'original');
      const fileUrl = fileResult.url;

      // 파일 타입 결정
      const detectedFileType = file.fileType || getFileType(file.mimetype, file.originalname);
      typesFound.add(detectedFileType);

      let thumbnailUrl = null;

      // 이미지인 경우 즉시 썸네일 생성
      if (detectedFileType === 'image') {
        try {
          let imageBuffer;
          if (file.buffer) {
            imageBuffer = file.buffer;
          } else {
            const fs = require('fs');
            imageBuffer = fs.readFileSync(file.path);
          }

          const thumbnailBuffer = await sharp(imageBuffer)
            .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
            .toFormat('webp')
            .toBuffer();

          const thumbnailFilename = `thumb_${fileResult.filename}.webp`;
          const thumbnailResult = await StorageService.saveThumbnail(thumbnailBuffer, thumbnailFilename);
          thumbnailUrl = thumbnailResult.url;
        } catch (error) {
          console.error('썸네일 생성 실패 (워커로 위임):', error);
        }
      }

      processedFiles.push({
        fileUrl,
        thumbnailUrl,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        processingStatus: thumbnailUrl ? 'completed' : 'processing',
        renderUrl: null,
        detectedFileType, // 임시 저장용
        filename: fileResult.filename, // 워커용
        path: file.path // 워커용
      });
    }

    // 메시지 전체 타입 결정
    if (typesFound.has('model3d')) overallType = '3d';
    else if (typesFound.has('image')) overallType = 'image';
    else if (typesFound.has('video')) overallType = 'video';
    else if (typesFound.has('audio')) overallType = 'audio';

    // 3. 메시지 데이터 구성
    const firstFileName = processedFiles[0].fileName;
    const content = files.length > 1 
      ? `[Files] ${firstFileName} 외 ${files.length - 1}개`
      : `File: ${firstFileName}`;

    const newMessageData = {
      roomId,
      senderId,
      content,
      type: overallType,
      files: processedFiles.map(f => ({
        fileUrl: f.fileUrl,
        thumbnailUrl: f.thumbnailUrl,
        fileName: f.fileName,
        fileSize: f.fileSize,
        mimeType: f.mimeType,
        processingStatus: f.processingStatus,
        renderUrl: null
      })),
      // 하위 호환성을 위한 첫 번째 파일 정보
      fileUrl: processedFiles[0].fileUrl,
      thumbnailUrl: processedFiles[0].thumbnailUrl,
      fileName: processedFiles[0].fileName,
      fileSize: processedFiles[0].fileSize,
      mimeType: processedFiles[0].mimeType,
      processingStatus: processedFiles[0].processingStatus,
      groupId,
      sequenceNumber,
      readBy: [senderId],
    };

    if (parentMessageId) {
      newMessageData.parentMessageId = parentMessageId;
      newMessageData.threadSequenceNumber = threadSequenceNumber;
    }

    const newMessage = new Message(newMessageData);
    await newMessage.save();

    // 4. 워커 작업 추가
    for (let i = 0; i < processedFiles.length; i++) {
      const f = processedFiles[i];
      if (f.detectedFileType && !f.thumbnailUrl) {
        try {
          const jobData = {
            messageId: newMessage._id.toString(),
            fileIndex: i, // 몇 번째 파일인지 알기 위함
            roomId: roomId.toString(),
            fileType: f.detectedFileType,
            fileUrl: f.fileUrl,
            filePath: f.path || null,
            filename: f.filename,
            mimeType: f.mimeType,
          };
          await FileProcessingQueue.addFileProcessingJob(jobData);
        } catch (error) {
          console.error('워커 작업 추가 실패:', error);
        }
      }
    }

    // 5. 방 정보 업데이트
    room.lastMessage = newMessage._id;
    await room.save();

    await UserChatRoom.findOneAndUpdate(
      { userId: senderId, roomId },
      { lastReadSequenceNumber: sequenceNumber, unreadCount: 0 },
    );

    // 6. 소켓 전송
    const messageData = {
      _id: newMessage._id,
      roomId,
      content: newMessage.content,
      type: overallType,
      files: newMessage.files,
      // 하위 호환용
      fileUrl: newMessage.fileUrl,
      thumbnailUrl: newMessage.thumbnailUrl,
      fileName: newMessage.fileName,
      fileSize: newMessage.fileSize,
      mimeType: newMessage.mimeType,
      processingStatus: newMessage.processingStatus,
      groupId: newMessage.groupId,
      senderId,
      senderName: sender ? sender.username : 'Unknown',
      sequenceNumber,
      readBy: newMessage.readBy,
      timestamp: newMessage.timestamp,
      parentMessageId: newMessage.parentMessageId,
      threadSequenceNumber: newMessage.threadSequenceNumber,
      replyCount: 0,
    };

    await socketService.sendRoomMessage(roomId, overallType, messageData, senderId);

    const allMemberIds = room.members.map((m) => m._id.toString());

    // 실시간 안읽음 카운트 계산 및 통지
    for (const userId of allMemberIds) {
      try {
        if (userId === senderId) continue;

        const userChatRoom = await UserChatRoom.findOne({ userId, roomId });
        if (!userChatRoom) continue;

        const roomObj = room.toObject();
        const unreadCount = Math.max(0, sequenceNumber - (userChatRoom.lastReadSequenceNumber || 0));

        if (roomObj.type === 'direct') {
          const otherMember = roomObj.members.find((m) => m._id.toString() !== userId);
          roomObj.displayName = otherMember ? otherMember.username : 'Unknown';
          roomObj.displayAvatar = otherMember ? otherMember.profileImage : null;
          roomObj.displayStatus = otherMember ? otherMember.status : 'offline';
        } else {
          roomObj.displayName = roomObj.name;
        }

        socketService.notifyRoomListUpdated(userId, {
          ...roomObj,
          targetUserId: userId,
          unreadCount,
          lastMessage: messageData,
        });
      } catch (err) {
        console.error(`Failed to notify room list update for user ${userId}:`, err);
      }
    }

    // 푸시 알림 전송
    await sendPushNotificationHelper(
      roomId,
      senderId,
      sender ? sender.username : 'Unknown',
      newMessage.content,
      allMemberIds
    );

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('File upload failed:', error);
    res.status(500).json({ ...ERROR_MESSAGES.COMMON.FILE_UPLOAD_FAILED, error: error.message });
  }
};

// 메시지 전송 (DB 저장 후 소켓 브로드캐스트 및 푸시 알림)
exports.sendMessage = async (req, res) => {
  try {
    const { roomId, content, type, tempId, parentMessageId } = req.body;
    const senderId = req.user.id;

    // 1. 시퀀스 번호 원자적 증가 및 방 정보 업데이트
    const room = await ChatRoom.findByIdAndUpdate(roomId, { $inc: { lastSequenceNumber: 1 } }, { new: true }).populate(
      'members',
      'username profileImage status statusText',
    );

    if (!room) {
      return res.status(404).json(ERROR_MESSAGES.CHAT.ROOM_NOT_FOUND);
    }

    // [v2.7.1] 멤버 체크: 방의 멤버가 아니면 메시지 전송 불가
    const sender = room.members.find((m) => m._id.toString() === senderId);
    if (!sender) {
      return res.status(403).json(ERROR_MESSAGES.CHAT.NOT_MEMBER);
    }

    const sequenceNumber = room.lastSequenceNumber;
    let threadSequenceNumber = null;

    // [스레드 전용] 부모 메시지가 있는 경우 처리
    if (parentMessageId) {
      const parentMessage = await Message.findByIdAndUpdate(
        parentMessageId,
        {
          $inc: { replyCount: 1, lastThreadSequenceNumber: 1 },
          $set: { lastReplyAt: new Date() }
        },
        { new: true }
      );

      if (parentMessage) {
        threadSequenceNumber = parentMessage.lastThreadSequenceNumber;
      }
    }

    // 3. 멘션 파싱
    const { mentions, mentionAll, mentionHere, foundUsernames } = parseMentions(content, room.members);

    // [요구사항 2] 채널에 없는 유저 자동 초대 로직
    const newMembers = [];
    if (foundUsernames && foundUsernames.length > 0) {
      for (const username of foundUsernames) {
        if (username === 'all' || username === 'here') continue;

        // v2.7.5: 중복 초대 방지를 위해 ID와 username 모두 체크
        const isMember = room.members.some((m) => {
          if (!m) return false;
          return m.username === username;
        });

        if (!isMember) {
          const userToInvite = await User.findOne({ username }).select('username profileImage status statusText');
          if (userToInvite) {
            const userToInviteId = userToInvite._id.toString();
            
            // 메모리 상의 멤버 목록에 이미 ID가 있는지 한 번 더 확인 (경합 방지)
            const alreadyInMem = room.members.some(m => {
              if (!m) return false;
              const mId = m._id?.toString() || m.toString();
              return mId === userToInviteId;
            });
            
            if (!alreadyInMem) {
              // 1. ChatRoom 멤버 추가
              await ChatRoom.findByIdAndUpdate(roomId, { $addToSet: { members: userToInvite._id } });

              // 2. UserChatRoom 생성 (채팅 목록 활성화)
              await UserChatRoom.findOneAndUpdate(
                { userId: userToInvite._id, roomId },
                { $setOnInsert: { userId: userToInvite._id, roomId, joinedAt: new Date() } },
                { upsert: true }
              );

              // 3. 현재 메모리 상의 방 멤버 목록 업데이트
              room.members.push(userToInvite);
              mentions.push(userToInvite._id);
              newMembers.push(userToInvite);
            }
          }
        }
      }
    }

    // 4. DB에 메시지 저장
    const newMessageData = {
      roomId,
      senderId,
      content,
      type: type === 'chat' ? 'text' : type || 'text',
      sequenceNumber,
      tempId,
      readBy: [senderId], // [v2.4.0] 보낸 사람은 자동으로 읽음 처리
      mentions,
      mentionAll,
      mentionHere,
    };

    if (parentMessageId) {
      newMessageData.parentMessageId = parentMessageId;
      newMessageData.threadSequenceNumber = threadSequenceNumber;
    }

    const newMessage = new Message(newMessageData);
    await newMessage.save();

    // 3. 채팅방 마지막 메시지 업데이트 및 송신자 읽음 처리 (lastReadSequenceNumber 갱신)
    room.lastMessage = newMessage._id;
    await room.save();

    await UserChatRoom.findOneAndUpdate(
      { userId: senderId, roomId },
      { lastReadSequenceNumber: sequenceNumber, unreadCount: 0 },
    );

    // 5. 모든 참여자에게 방 목록 업데이트 알림 (안읽음 카운트 포함)
    const allMemberIds = room.members.map((m) => m._id.toString());

    const messageData = {
      _id: newMessage._id,
      roomId,
      content,
      senderId,
      senderName: sender ? sender.username : 'Unknown', // 실시간 이름 전달
      sequenceNumber,
      tempId,
      readBy: newMessage.readBy,
      mentions: newMessage.mentions,
      mentionAll: newMessage.mentionAll,
      mentionHere: newMessage.mentionHere,
      timestamp: newMessage.timestamp,
      parentMessageId: newMessage.parentMessageId,
      threadSequenceNumber: newMessage.threadSequenceNumber,
    };

    for (const userId of allMemberIds) {
      try {
        // [v2.4.0] 송신자 본인에게는 불필요한 목록 업데이트 전송 방지 (이미 읽음 상태임)
        if (userId === senderId) continue;

        const userChatRoom = await UserChatRoom.findOne({ userId, roomId });
        if (!userChatRoom) continue;

        const roomObj = room.toObject();
        const unreadCount = Math.max(0, sequenceNumber - (userChatRoom.lastReadSequenceNumber || 0));

        if (roomObj.type === 'direct') {
          const otherMember = roomObj.members.find((m) => m._id.toString() !== userId);
          roomObj.displayName = otherMember ? otherMember.username : 'Unknown';
          roomObj.displayAvatar = otherMember ? otherMember.profileImage : null;
          roomObj.displayStatus = otherMember ? otherMember.status : 'offline';
        } else {
          roomObj.displayName = roomObj.name;
        }

        socketService.notifyRoomListUpdated(userId, {
          ...roomObj,
          targetUserId: userId,
          unreadCount: unreadCount,
          lastMessage: messageData,
        });
      } catch (err) {
        console.error(`Failed to notify room list update for user ${userId}:`, err);
      }
    }

    // 5. Socket SDK를 통해 실시간 브로드캐스트 (MESSAGE_ADDED)
    await socketService.sendRoomMessage(roomId, newMessage.type, messageData, senderId);

    // [v2.7.3] 푸시 알림 전송 (공통 헬퍼 사용)
    await sendPushNotificationHelper(
      roomId,
      senderId,
      sender ? sender.username : 'Unknown',
      content,
      allMemberIds,
      { mentions, mentionAll, mentionHere }
    );

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ ...ERROR_MESSAGES.CHAT.FAILED_TO_SEND_MESSAGE, error: error.message });
  }
};

// 메시지 동기화 (누락 메시지 조회)
exports.syncMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { fromSequence } = req.query;

    const query = {
      roomId,
      sequenceNumber: { $gt: parseInt(fromSequence) || 0 },
      parentMessageId: null, // [v2.5.2] 스레드 메시지는 동기화 목록에서 제외 (본 채팅 오염 방지)
    };

    const messages = await Message.find(query)
      .populate('senderId', 'username profileImage')
      .sort({ sequenceNumber: 1 });

    res.json({
      messages,
      count: messages.length,
    });
  } catch (error) {
    res.status(500).json({ ...ERROR_MESSAGES.COMMON.INTERNAL_SERVER_ERROR, error: error.message });
  }
};

// 채팅방 알림 설정 조회
exports.getRoomNotificationSettings = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    const userChatRoom = await UserChatRoom.findOne({ userId, roomId });

    if (!userChatRoom) {
      return res.status(404).json(ERROR_MESSAGES.COMMON.NOT_FOUND);
    }

    res.json({
      notificationMode: userChatRoom.notificationMode || 'default',
      notificationEnabled: userChatRoom.notificationEnabled !== false,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get notification settings', error: error.message });
  }
};

// 채팅방 알림 설정 업데이트
exports.updateRoomNotificationSettings = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { notificationMode } = req.body;
    const userId = req.user.id;

    if (!['default', 'none', 'mention'].includes(notificationMode)) {
      return res.status(400).json(ERROR_MESSAGES.COMMON.INVALID_INPUT);
    }

    const userChatRoom = await UserChatRoom.findOneAndUpdate(
      { userId, roomId },
      { notificationMode },
      { new: true, upsert: true },
    );

    res.json({
      notificationMode: userChatRoom.notificationMode,
      notificationEnabled: userChatRoom.notificationEnabled !== false,
    });
  } catch (error) {
    res.status(500).json({ ...ERROR_MESSAGES.COMMON.INTERNAL_SERVER_ERROR, error: error.message });
  }
};

// 읽음 처리 (unreadCount 초기화 및 메시지 readBy 업데이트)
exports.markAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // 1. 유저의 해당 방 마지막 읽은 시퀀스 갱신 (unreadCount는 이제 이 값으로 계산됨)
    const room = await ChatRoom.findById(roomId).populate('members', 'username profileImage status');
    if (!room) {
      return res.status(404).json(ERROR_MESSAGES.CHAT.ROOM_NOT_FOUND);
    }

    await UserChatRoom.findOneAndUpdate(
      { userId, roomId },
      { lastReadSequenceNumber: room.lastSequenceNumber, unreadCount: 0 },
    );

    // 2. 해당 방의 내가 읽지 않은 메시지들에 대해 내 ID 추가
    await Message.updateMany(
      { roomId, senderId: { $ne: userId }, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } },
    );

    // 3. 방의 모든 멤버에게 읽음 상태가 변경되었음을 알림
    socketService.notifyMessageRead(roomId, userId);

    // [v2.4.0] 읽음 처리 시 본인의 방 목록 뱃지도 갱신
    const roomObj = room.toObject();
    if (roomObj.type === 'direct') {
      const otherMember = roomObj.members.find((m) => m._id.toString() !== userId);
      roomObj.displayName = otherMember ? otherMember.username : 'Unknown';
      roomObj.displayAvatar = otherMember ? otherMember.profileImage : null;
    } else {
      roomObj.displayName = roomObj.name;
    }

    socketService.notifyRoomListUpdated(userId, {
      ...roomObj,
      targetUserId: userId,
      unreadCount: 0,
    });

    res.json(ERROR_MESSAGES.CHAT.MARKED_AS_READ);
  } catch (error) {
    res.status(500).json({ ...ERROR_MESSAGES.CHAT.FAILED_TO_MARK_READ, error: error.message });
  }
};

// 채팅방 메시지 이력 조회
exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, beforeSequence } = req.query;

    const query = { roomId, parentMessageId: null };
    if (beforeSequence) {
      query.sequenceNumber = { $lt: parseInt(beforeSequence) };
    }

    const messages = await Message.find(query)
      .populate('senderId', 'username profileImage status')
      .sort({ sequenceNumber: -1 })
      .limit(parseInt(limit));

    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ ...ERROR_MESSAGES.CHAT.FAILED_TO_FETCH_MESSAGES, error: error.message });
  }
};

// 메시지 단건 조회 (썸네일 생성 완료 후 실시간 동기화용)
exports.getMessageById = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId).populate('senderId', 'username profileImage status');
    if (!message) {
      return res.status(404).json(ERROR_MESSAGES.CHAT.MESSAGE_NOT_FOUND);
    }

    // 권한 체크: 요청자가 해당 방 멤버인지 확인
    const room = await ChatRoom.findById(message.roomId).select('members');
    if (!room) {
      return res.status(404).json(ERROR_MESSAGES.CHAT.ROOM_NOT_FOUND);
    }
    const isMember = room.members.some((m) => m.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json(ERROR_MESSAGES.CHAT.NOT_MEMBER);
    }

    res.json(message);
  } catch (error) {
    res.status(500).json({ ...ERROR_MESSAGES.CHAT.FAILED_TO_FETCH_MESSAGE, error: error.message });
  }
};

/**
 * 3D 파일 수동 재처리 요청
 * [v2.9.2] messageId와 fileIndex를 받아 해당 파일을 다시 변환 큐에 넣음
 */
exports.reprocessFile = async (req, res) => {
  try {
    const { messageId, fileIndex } = req.body;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json(ERROR_MESSAGES.CHAT.MESSAGE_NOT_FOUND);
    }

    // 권한 체크
    const room = await ChatRoom.findById(message.roomId).select('members');
    if (!room || !room.members.some(m => m.toString() === userId.toString())) {
      return res.status(403).json(ERROR_MESSAGES.CHAT.NOT_MEMBER);
    }

    let targetFile;
    let finalFileIndex = fileIndex !== undefined ? parseInt(fileIndex) : null;

    if (finalFileIndex !== null && message.files && message.files[finalFileIndex]) {
      targetFile = message.files[finalFileIndex];
    } else {
      // 레거시 대응 (탑레벨 필드)
      targetFile = {
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        mimeType: message.mimeType
      };
      finalFileIndex = null;
    }

    if (!targetFile.fileUrl) {
      return res.status(400).json({ success: false, message: '재처리할 파일 URL이 없습니다.' });
    }

    const { getFileType } = require('../config/fileConfig');
    const detectedFileType = getFileType(targetFile.mimeType, targetFile.fileName);

    // 상태 업데이트: processing으로 변경
    const updateObj = {};
    if (finalFileIndex !== null) {
      updateObj[`files.${finalFileIndex}.processingStatus`] = 'processing';
    } else {
      updateObj.processingStatus = 'processing';
    }
    await Message.findByIdAndUpdate(messageId, { $set: updateObj });

    // 워커 작업 추가
    const jobData = {
      messageId: message._id.toString(),
      fileIndex: finalFileIndex,
      roomId: message.roomId.toString(),
      fileType: detectedFileType,
      fileUrl: targetFile.fileUrl,
      filename: targetFile.fileName,
      mimeType: targetFile.mimeType,
    };

    await FileProcessingQueue.addFileProcessingJob(jobData);

    // 소켓으로 상태 업데이트 브로드캐스트
    await socketService.sendMessageUpdate(message.roomId.toString(), {
      messageId: message._id.toString(),
      fileIndex: finalFileIndex,
      processingStatus: 'processing'
    });

    res.json({ success: true, message: '파일 재처리가 시작되었습니다.' });
  } catch (error) {
    console.error('ReprocessFile error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 사용자의 활성 채팅방 상태 업데이트 (푸시 발송 필터링용)
exports.setActiveRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;

    await userService.setActiveRoom(userId, roomId);
    res.json(ERROR_MESSAGES.CHAT.ACTIVE_ROOM_UPDATED);
  } catch (error) {
    res.status(500).json({ ...ERROR_MESSAGES.CHAT.FAILED_TO_UPDATE_ROOM, error: error.message });
  }
};

// 메시지 전달 (Forward) - 복사 방식
exports.forwardMessage = async (req, res) => {
  try {
    const { targetRoomId, originalMessageId } = req.body;
    const senderId = req.user.id;

    // 1. 원본 메시지 조회
    const originalMessage = await Message.findById(originalMessageId);
    if (!originalMessage) {
      return res.status(404).json(ERROR_MESSAGES.CHAT.ORIGINAL_MESSAGE_NOT_FOUND);
    }

    // 2. 대상 방 정보 및 시퀀스 업데이트
    const room = await ChatRoom.findByIdAndUpdate(
      targetRoomId,
      { $inc: { lastSequenceNumber: 1 } },
      { new: true }
    ).populate('members', 'username');

    if (!room) {
      return res.status(404).json(ERROR_MESSAGES.CHAT.ROOM_NOT_FOUND);
    }

    const sequenceNumber = room.lastSequenceNumber;

    // 3. 새 메시지로 복사 (전달 표시 추가)
    const sender = await User.findById(senderId);
    const originalSender = await User.findById(originalMessage.senderId);

    const newMessageData = {
      roomId: targetRoomId,
      senderId,
      content: originalMessage.content,
      type: originalMessage.type,
      fileUrl: originalMessage.fileUrl,
      thumbnailUrl: originalMessage.thumbnailUrl,
      renderUrl: originalMessage.renderUrl,
      fileName: originalMessage.fileName,
      fileSize: originalMessage.fileSize,
      mimeType: originalMessage.mimeType,
      sequenceNumber,
      readBy: [senderId],
      isForwarded: true,
      originSenderName: originalSender ? originalSender.username : 'Unknown',
    };

    const newMessage = new Message(newMessageData);
    await newMessage.save();

    // 4. 방 정보 업데이트
    room.lastMessage = newMessage._id;
    await room.save();

    await UserChatRoom.findOneAndUpdate(
      { userId: senderId, roomId: targetRoomId },
      { lastReadSequenceNumber: sequenceNumber, unreadCount: 0 }
    );

    const messageData = {
      ...newMessage.toObject(),
      senderName: sender ? sender.username : 'Unknown',
    };

    // 5. 소켓 브로드캐스트
    await socketService.sendRoomMessage(targetRoomId, newMessage.type, messageData, senderId);

    // 6. 모든 참여자에게 방 목록 업데이트 알림
    const allMemberIds = room.members.map((m) => m._id.toString());
    for (const userId of allMemberIds) {
      if (userId === senderId) continue;

      const userChatRoom = await UserChatRoom.findOne({ userId, roomId: targetRoomId });
      if (!userChatRoom) continue;

      const roomObj = room.toObject();
      const unreadCount = Math.max(0, sequenceNumber - (userChatRoom.lastReadSequenceNumber || 0));

      if (roomObj.type === 'direct') {
        const otherMember = roomObj.members.find((m) => m._id.toString() !== userId);
        roomObj.displayName = otherMember ? otherMember.username : 'Unknown';
      } else {
        roomObj.displayName = roomObj.name;
      }

      socketService.notifyRoomListUpdated(userId, {
        ...roomObj,
        targetUserId: userId,
        unreadCount,
        lastMessage: messageData,
      });
    }

    // [v2.7.3] 푸시 알림 전송 (메시지 전달)
    await sendPushNotificationHelper(
      targetRoomId,
      senderId,
      sender ? sender.username : 'Unknown',
      newMessage.content,
      allMemberIds
    );

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error forwarding message:', error);
    res.status(500).json({ ...ERROR_MESSAGES.COMMON.INTERNAL_SERVER_ERROR, error: error.message });
  }
};

// 특정 방의 스레드 목록 조회 (부모 메시지들)
exports.getThreadList = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50 } = req.query;

    const parentMessages = await Message.find({
      roomId,
      replyCount: { $gt: 0 }
    })
      .sort({ lastReplyAt: -1 })
      .limit(parseInt(limit))
      .populate('senderId', 'username profileImage');

    res.json(parentMessages);
  } catch (error) {
    res.status(500).json({ ...ERROR_MESSAGES.COMMON.INTERNAL_SERVER_ERROR, error: error.message });
  }
};

// 특정 메시지의 스레드 답글 조회
exports.getThreadMessages = async (req, res) => {
  try {
    const { messageId } = req.params;

    const messages = await Message.find({ parentMessageId: messageId })
      .sort({ threadSequenceNumber: 1 })
      .populate('senderId', 'username profileImage');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ ...ERROR_MESSAGES.COMMON.INTERNAL_SERVER_ERROR, error: error.message });
  }
};

// [v2.4.0] 사용자 활성 방 설정 (Presence)
exports.setActiveRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    const userId = req.user.id;

    // Redis에 활성 방 저장 (null이면 제거)
    await userService.setActiveRoom(userId, roomId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error setting active room:', error);
    res.status(500).json({ ...ERROR_MESSAGES.COMMON.INTERNAL_SERVER_ERROR, error: error.message });
  }
};

// [v2.6.0] 채팅방 멤버 강퇴 (Owner 전용)
exports.removeRoomMember = async (req, res) => {
  try {
    const { roomId, userId } = req.params;
    const currentUserId = req.user.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json(ERROR_MESSAGES.CHAT.ROOM_NOT_FOUND);
    }

    // 권한 확인: 방장(createdBy)만 강퇴 가능
    const isOwner = room.createdBy && room.createdBy.toString() === currentUserId.toString();
    if (!isOwner) {
      // 하위 호환성: 첫 번째 멤버를 방장으로 간주하는 로직
      const firstMemberId = room.members[0]?.toString();
      if (firstMemberId !== currentUserId.toString()) {
        return res.status(403).json(ERROR_MESSAGES.CHAT.ONLY_OWNER_CAN_REMOVE);
      }
    }

    // 자기 자신은 강퇴할 수 없음 (나가기 기능 이용)
    if (userId === currentUserId) {
      return res.status(400).json(ERROR_MESSAGES.CHAT.CANNOT_REMOVE_SELF);
    }

    // 1. ChatRoom의 members 배열에서 사용자 제거
    room.members = room.members.filter((m) => m.toString() !== userId.toString());
    await room.save();

    // 2. UserChatRoom 레코드 삭제 (사용자의 방 목록에서 제거)
    await UserChatRoom.findOneAndDelete({ userId, roomId });

    // 3. 강퇴당한 사용자에게 알림 (목록에서 즉시 제거)
    socketService.notifyRoomListUpdated(userId, {
      _id: roomId,
      isRemoved: true,
      targetUserId: userId,
    });

    // [v2.7.1] 강퇴된 사용자에게 푸시 알림 발송
    notificationService.notifyKickedOut(userId, room.name, roomId);

    // 4. 남은 멤버들에게 알림 (멤버 목록 갱신)
    const updatedRoom = await ChatRoom.findById(roomId).populate('members', 'username profileImage status statusText');
    updatedRoom.members.forEach((member) => {
      socketService.notifyRoomListUpdated(member._id.toString(), {
        ...updatedRoom.toObject(),
        targetUserId: member._id.toString()
      });
    });

    // 5. 시스템 메시지 생성 (강퇴 알림)
    const targetUser = await User.findById(userId).select('username');
    const systemMessage = new Message({
      roomId,
      senderId: currentUserId,
      content: `${targetUser?.username || '알 수 없는 사용자'}님이 강퇴되었습니다.`,
      type: 'system',
      sequenceNumber: room.lastSequenceNumber + 1,
    });
    await systemMessage.save();

    await ChatRoom.findByIdAndUpdate(roomId, {
      $inc: { lastSequenceNumber: 1 },
      lastMessage: systemMessage._id
    });

    await socketService.sendRoomMessage(roomId, 'system', {
      _id: systemMessage._id,
      roomId,
      content: systemMessage.content,
      senderId: currentUserId,
      senderName: 'System',
      sequenceNumber: systemMessage.sequenceNumber,
      timestamp: systemMessage.timestamp,
    }, currentUserId);

    res.json(ERROR_MESSAGES.CHAT.MEMBER_REMOVED);
  } catch (error) {
    console.error('RemoveRoomMember error:', error);
    res.status(500).json({ ...ERROR_MESSAGES.CHAT.MEMBER_REMOVED, error: error.message });
  }
};

// 채팅방 참여 (공개 채널용)
exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const currentUserId = req.user.id;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json(ERROR_MESSAGES.CHAT.ROOM_NOT_FOUND);
    }

    // 공개 채널이 아니면 참여 불가 (초대 링크 등을 이용해야 함)
    if (room.isPrivate || room.type === 'private' || room.type === 'direct') {
      return res.status(403).json(ERROR_MESSAGES.CHAT.PRIVATE_ROOM_INVITE_REQUIRED);
    }

    // 이미 멤버인지 확인
    const isMember = room.members.some((m) => m.toString() === currentUserId.toString());
    if (isMember) {
      const populatedRoom = await ChatRoom.findById(roomId).populate(
        'members',
        'username profileImage status statusText',
      );
      const roomObj = populatedRoom.toObject();
      roomObj.displayName = roomObj.name;
      return res.status(200).json(roomObj);
    }

    // 멤버 추가
    room.members.push(currentUserId);
    await room.save();

    // UserChatRoom 레코드 생성
    await UserChatRoom.findOneAndUpdate(
      { userId: currentUserId, roomId: room._id },
      {
        userId: currentUserId,
        roomId: room._id,
        lastReadSequenceNumber: room.lastSequenceNumber || 0,
        unreadCount: 0,
      },
      { upsert: true, new: true },
    );

    // 모든 멤버에게 방 목록 업데이트 알림
    room.members.forEach((memberId) => {
      socketService.notifyRoomListUpdated(memberId.toString());
    });

    // 시스템 메시지 생성 (입장 알림)
    const user = await User.findById(currentUserId).select('username');
    const systemMessage = new Message({
      roomId,
      senderId: currentUserId,
      content: `${user?.username || 'Unknown'}님이 입장했습니다.`,
      type: 'system',
      sequenceNumber: (room.lastSequenceNumber || 0) + 1,
    });
    await systemMessage.save();

    await ChatRoom.findByIdAndUpdate(roomId, {
      $inc: { lastSequenceNumber: 1 },
      lastMessage: systemMessage._id
    });

    await socketService.sendRoomMessage(roomId, 'system', {
      _id: systemMessage._id,
      roomId,
      content: systemMessage.content,
      senderId: currentUserId,
      senderName: 'System',
      sequenceNumber: systemMessage.sequenceNumber,
      timestamp: systemMessage.timestamp,
    }, currentUserId);

    const populatedRoom = await ChatRoom.findById(room._id).populate(
      'members',
      'username profileImage status statusText',
    );
    const roomObj = populatedRoom.toObject();
    roomObj.displayName = roomObj.name;

    res.json(roomObj);
  } catch (error) {
    console.error('JoinRoom error:', error);
    res.status(500).json({ ...ERROR_MESSAGES.CHAT.FAILED_TO_JOIN_ROOM, error: error.message });
  }
};
