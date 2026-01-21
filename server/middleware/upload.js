const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const storageConfig = require('../config/storageConfig');

/**
 * 저장소 타입에 따라 Multer 저장소 설정 반환
 * - 로컬: diskStorage (파일 저장)
 * - S3: memoryStorage (버퍼 유지)
 */
const getStorage = () => {
  if (storageConfig.type === 's3') {
    // S3: 메모리 저장 (S3 SDK에서 버퍼 처리)
    console.log('📝 Multer: Using memoryStorage for S3');
    return multer.memoryStorage();
  } else {
    // 로컬: 디스크 저장
    const uploadPath = storageConfig.local.uploadPath;
    const originalDir = path.join(uploadPath, 'original');

    // 디렉토리가 없으면 생성
    if (!fs.existsSync(originalDir)) {
      fs.mkdirSync(originalDir, { recursive: true });
    }

    console.log(`📝 Multer: Using diskStorage for local - ${originalDir}`);

    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, originalDir);
      },
      filename: (req, file, cb) => {
        // 랜덤 파일명으로 저장 (충돌 방지)
        const hash = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname);
        const filename = `${hash}${ext}`;
        cb(null, filename);
      },
    });
  }
};

// 파일 필터링 (이미지, 영상, 오디오 등)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'audio/mpeg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('지원하지 않는 파일 형식입니다.'), false);
  }
};

// Multer 설정
const upload = multer({
  storage: getStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 최대 50MB 제한
  },
});

module.exports = upload;

