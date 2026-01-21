const path = require('path');

/**
 * 저장소 설정
 * 환경변수에 따라 로컬 또는 S3 설정 반환
 */
const storageConfig = {
  // 저장소 타입: 'local' 또는 's3' (기본값: local)
  type: process.env.FILE_STORAGE_TYPE || 'local',
  
  // 🔹 로컬 저장소 설정 (개발 환경)
  local: {
    // 파일 업로드 기본 경로
    uploadPath: process.env.FILE_UPLOAD_PATH || 'C:/project/file',
    
    // 디렉토리 이름
    originalDir: 'original',
    thumbnailDir: 'thumbnails',
    
    // 클라이언트 접근 URL (정적 서빙)
    serveUrl: process.env.FILE_SERVE_URL || 'http://localhost:5000/files',
  },
  
  // 🔹 S3 저장소 설정 (프로덕션 환경)
  s3: {
    // AWS 설정
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    
    // S3 버킷
    bucket: process.env.AWS_S3_BUCKET,
    
    // S3 내 폴더 경로
    folderPrefix: process.env.S3_FOLDER_PREFIX || 'chat-files',
    
    // S3 URL 생성 함수
    getUrl: (bucket, key) =>
      `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  },
};

module.exports = storageConfig;
