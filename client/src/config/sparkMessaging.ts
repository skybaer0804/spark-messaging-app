import SparkMessaging from '@skybaer0804/spark-messaging-client';

const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
const projectKey = import.meta.env.VITE_PROJECT_KEY || 'default-project-key-12345';

// SDK 생성자 호출 (생성자 오버로드 사용)
const sparkMessagingClient = new SparkMessaging(serverUrl, projectKey);

// 회의 제한 설정
export const MEETING_CONFIG = {
  MAX_PARTICIPANTS: parseInt(import.meta.env.VITE_MEETING_MAX_PARTICIPANTS || '10', 10),
  MAX_VIDEO_STREAMS: parseInt(import.meta.env.VITE_MEETING_MAX_VIDEO_STREAMS || '4', 10),
};

export default sparkMessagingClient;
