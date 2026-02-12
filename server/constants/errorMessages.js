/**
 * 서버 에러 및 응답 메시지 상수 정의
 * code: 프론트엔드에서 식별 및 언어팩 처리를 위한 고유 코드
 * message: 기본적으로 사용자에게 보여줄 한글 메시지
 */

const ERROR_MESSAGES = {
  // 공통 에러 및 성공
  COMMON: {
    WORKSPACE_REQUIRED: {
      code: 'COMMON_WORKSPACE_REQUIRED',
      message: 'workspaceId가 필요합니다.'
    },
    INTERNAL_SERVER_ERROR: {
      code: 'COMMON_INTERNAL_SERVER_ERROR',
      message: '서버 내부 오류가 발생했습니다.'
    },
    NOT_AUTHORIZED: {
      code: 'COMMON_NOT_AUTHORIZED',
      message: '권한이 없습니다.'
    },
    NOT_FOUND: {
      code: 'COMMON_NOT_FOUND',
      message: '찾을 수 없습니다.'
    },
    FILE_UPLOAD_FAILED: {
      code: 'COMMON_FILE_UPLOAD_FAILED',
      message: '파일 업로드에 실패했습니다.'
    },
    FILE_UPLOAD_TIMEOUT: {
      code: 'COMMON_FILE_UPLOAD_TIMEOUT',
      message: '파일 업로드 타임아웃이 발생했습니다.'
    },
    INVALID_INPUT: {
      code: 'COMMON_INVALID_INPUT',
      message: '잘못된 입력입니다.'
    },
    ACCESS_DENIED: {
      code: 'COMMON_ACCESS_DENIED',
      message: '접근 권한이 없습니다.'
    },
    SUCCESS: {
      code: 'COMMON_SUCCESS',
      message: '성공적으로 처리되었습니다.'
    }
  },

  // 채팅 도메인
  CHAT: {
    NOT_MEMBER: {
      code: 'CHAT_NOT_MEMBER',
      message: '이 채팅방의 멤버가 아닙니다.'
    },
    ROOM_NOT_FOUND: {
      code: 'CHAT_ROOM_NOT_FOUND',
      message: '채팅방을 찾을 수 없습니다.'
    },
    MESSAGE_NOT_FOUND: {
      code: 'CHAT_MESSAGE_NOT_FOUND',
      message: '메시지를 찾을 수 없습니다.'
    },
    ORIGINAL_MESSAGE_NOT_FOUND: {
      code: 'CHAT_ORIGINAL_MESSAGE_NOT_FOUND',
      message: '원본 메시지를 찾을 수 없습니다.'
    },
    FAILED_TO_FETCH_ROOMS: {
      code: 'CHAT_FAILED_TO_FETCH_ROOMS',
      message: '채팅방 목록을 불러오지 못했습니다.'
    },
    FAILED_TO_CREATE_ROOM: {
      code: 'CHAT_FAILED_TO_CREATE_ROOM',
      message: '채팅방 생성에 실패했습니다.'
    },
    FAILED_TO_UPDATE_ROOM: {
      code: 'CHAT_FAILED_TO_UPDATE_ROOM',
      message: '채팅방 정보 수정에 실패했습니다.'
    },
    FAILED_TO_JOIN_ROOM: {
      code: 'CHAT_FAILED_TO_JOIN_ROOM',
      message: '채팅방 입장에 실패했습니다.'
    },
    FAILED_TO_DELETE_ROOM: {
      code: 'CHAT_FAILED_TO_DELETE_ROOM',
      message: '채팅방 삭제에 실패했습니다.'
    },
    FAILED_TO_LEAVE_ROOM: {
      code: 'CHAT_FAILED_TO_LEAVE_ROOM',
      message: '채팅방 퇴장에 실패했습니다.'
    },
    FAILED_TO_SEND_MESSAGE: {
      code: 'CHAT_FAILED_TO_SEND_MESSAGE',
      message: '메시지 전송에 실패했습니다.'
    },
    FAILED_TO_FETCH_MESSAGES: {
      code: 'CHAT_FAILED_TO_FETCH_MESSAGES',
      message: '메시지 목록을 불러오지 못했습니다.'
    },
    FAILED_TO_FETCH_MESSAGE: {
      code: 'CHAT_FAILED_TO_FETCH_MESSAGE',
      message: '메시지를 불러오지 못했습니다.'
    },
    FAILED_TO_MARK_READ: {
      code: 'CHAT_FAILED_TO_MARK_READ',
      message: '읽음 처리에 실패했습니다.'
    },
    MARKED_AS_READ: {
      code: 'CHAT_MARKED_AS_READ',
      message: '읽음 처리되었습니다.'
    },
    SUCCESS_DELETE_ROOM: {
      code: 'CHAT_SUCCESS_DELETE_ROOM',
      message: '채팅방이 삭제되었습니다.'
    },
    SUCCESS_LEFT_ROOM: {
      code: 'CHAT_SUCCESS_LEFT_ROOM',
      message: '채팅방에서 나갔습니다.'
    },
    MEMBER_REMOVED: {
      code: 'CHAT_MEMBER_REMOVED',
      message: '멤버가 내보내졌습니다.'
    },
    ACTIVE_ROOM_UPDATED: {
      code: 'CHAT_ACTIVE_ROOM_UPDATED',
      message: '활성 채팅방이 업데이트되었습니다.'
    },
    ONLY_OWNER_CAN_CHANGE: {
      code: 'CHAT_ONLY_OWNER_CAN_CHANGE',
      message: '방장만 멤버를 변경할 수 있습니다.'
    },
    ONLY_OWNER_CAN_REMOVE: {
      code: 'CHAT_ONLY_OWNER_CAN_REMOVE',
      message: '방장만 멤버를 내보낼 수 있습니다.'
    },
    CANNOT_REMOVE_SELF: {
      code: 'CHAT_CANNOT_REMOVE_SELF',
      message: '자기 자신을 내보낼 수 없습니다. 채팅방 나가기를 이용해 주세요.'
    },
    PRIVATE_ROOM_INVITE_REQUIRED: {
      code: 'CHAT_PRIVATE_ROOM_INVITE_REQUIRED',
      message: '비공개 채팅방입니다. 입장을 위해서는 초대가 필요합니다.'
    }
  },

  // 팀 도메인
  TEAM: {
    NOT_FOUND: {
      code: 'TEAM_NOT_FOUND',
      message: '팀을 찾을 수 없습니다.'
    },
    NAME_REQUIRED: {
      code: 'TEAM_NAME_REQUIRED',
      message: '팀 이름이 필요합니다.'
    },
    FAILED_TO_CREATE: {
      code: 'TEAM_FAILED_TO_CREATE',
      message: '팀 생성에 실패했습니다.'
    },
    FAILED_TO_FETCH_TEAMS: {
      code: 'TEAM_FAILED_TO_FETCH_TEAMS',
      message: '팀 목록을 불러오지 못했습니다.'
    },
    FAILED_TO_FETCH_TEAM: {
      code: 'TEAM_FAILED_TO_FETCH_TEAM',
      message: '팀 정보를 불러오지 못했습니다.'
    },
    FAILED_TO_UPDATE_TEAM: {
      code: 'TEAM_FAILED_TO_UPDATE_TEAM',
      message: '팀 정보 수정에 실패했습니다.'
    },
    FAILED_TO_DELETE_TEAM: {
      code: 'TEAM_FAILED_TO_DELETE_TEAM',
      message: '팀 삭제에 실패했습니다.'
    },
    INSUFFICIENT_PERMISSIONS: {
      code: 'TEAM_INSUFFICIENT_PERMISSIONS',
      message: '팀 권한이 부족합니다.'
    },
    ACCESS_DENIED_PRIVATE: {
      code: 'TEAM_ACCESS_DENIED_PRIVATE',
      message: '접근 권한이 없습니다. 비공개 팀입니다.'
    },
    ONLY_OWNER_CAN_DELETE: {
      code: 'TEAM_ONLY_OWNER_CAN_DELETE',
      message: '팀 소유자만 팀을 삭제할 수 있습니다.'
    },
    SUCCESS_DELETE: {
      code: 'TEAM_SUCCESS_DELETE',
      message: '팀이 삭제되었습니다.'
    },
    MEMBER_REMOVED: {
      code: 'TEAM_MEMBER_REMOVED',
      message: '팀 멤버가 내보내졌습니다.'
    },
    FAILED_TO_REMOVE_MEMBER: {
      code: 'TEAM_FAILED_TO_REMOVE_MEMBER',
      message: '팀 멤버를 내보내는 데 실패했습니다.'
    }
  }
};

module.exports = ERROR_MESSAGES;
