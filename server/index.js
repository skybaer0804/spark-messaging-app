require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const socketService = require('./services/socketService');
const configureWebPush = require('./config/push');
const schedulerService = require('./services/schedulerService');

const { initializeSystem } = require('./utils/initialize');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS 설정
const origins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',') 
  : ['http://localhost:5173', 'https://spark.koyeb.app']; // 기본값 설정

app.use(cors({
  origin: origins,
  credentials: false, // 쿠키나 인증 헤더를 사용하는 경우 필수
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'x-workspace-id',
    'X-Requested-With',
    'Accept'
  ]
}));

// Connect to Databases
connectDB().then(() => {
  // DB 연결 후 시스템 초기화 실행
  initializeSystem();
});
connectRedis();

// Initialize Services
socketService.initialize();
configureWebPush();
schedulerService.initialize();

// Initialize File Processing Worker (비동기 파일 처리)
try {
  require('./workers/fileProcessingWorker');
  console.log('✅ 파일 처리 워커 초기화 완료');
} catch (error) {
  console.error('❌ 파일 처리 워커 초기화 실패:', error.message);
  console.warn('⚠️  파일 처리 워커 없이 계속 진행합니다. (Bull Queue 미설치 시 정상)');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '600mb' }));
// multipart/form-data는 multer가 처리하므로, urlencoded는 일반 폼 데이터용
app.use(express.urlencoded({ extended: true, limit: '600mb' })); // 대용량 파일 지원

// Static files for uploads (Local storage)
// 한글 파일명 지원을 위한 커스텀 미들웨어
const fileServeUrl = process.env.FILE_SERVE_URL || 'http://localhost:5000/files';
const fileBasePath = process.env.FILE_UPLOAD_PATH || 'C:/project/file';
const expressStatic = express.static(fileBasePath, {
  setHeaders: (res, filePath) => {
    // 한글 파일명을 위한 Content-Disposition 헤더 설정
    const fileName = path.basename(filePath);
    // UTF-8 인코딩된 파일명 (RFC 5987 형식)
    const encodedFileName = encodeURIComponent(fileName);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`);
  }
});
app.use('/files', expressStatic);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/push', require('./routes/push'));
app.use('/api/workspace', require('./routes/workspace'));
app.use('/api/notification', require('./routes/notification'));
app.use('/api/video-meeting', require('./routes/videoMeeting'));
app.use('/api/team', require('./routes/team'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  res.status(500).json({
    message: 'Global server error',
    error: err.message,
    stack: err.stack,
  });
});

// Static files for Client (PWA/TWA)
const clientDistPath = path.join(__dirname, '../client/dist');

// 1. .well-known 폴더 우선 서빙 (TWA 인증용)
app.use('/.well-known', express.static(path.join(clientDistPath, '.well-known'), {
  setHeaders: (res) => {
    res.set('Content-Type', 'application/json'); // assetlinks.json이 JSON으로 인식되도록 강제
  }
}));

// 2. 나머지 정적 파일 서빙 (JS, CSS, 아이콘 등)
app.use(express.static(clientDistPath));

// 3. SPA 라우팅 대응: API가 아닌 모든 요청은 index.html로 전달
app.get('*', (req, res) => {
  // API 및 파일 업로드 경로 제외
  if (!req.path.startsWith('/api') && !req.path.startsWith('/files')) {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
