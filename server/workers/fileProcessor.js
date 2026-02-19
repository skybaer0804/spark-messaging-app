// server/workers/fileProcessor.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// DB 및 서비스 초기화
const connectDB = require('../config/db');
const Message = require('../models/Message');
const ChatRoom = require('../models/ChatRoom'); // [v2.9.2] populate를 위해 명시적으로 로드
const User = require('../models/User');         // [v2.9.2] 필요 시 참조될 수 있으므로 함께 로드
const StorageService = require('../services/storage/StorageService');
const socketService = require('../services/socketService');

// DB 연결 및 소켓 서비스 초기화 (Sandboxed worker는 독립 프로세스이므로 필요)
let dbConnected = false;

const initializeProcessor = async () => {
  if (!dbConnected) {
    await connectDB();
    socketService.initialize();
    dbConnected = true;
  }
};

/**
 * URL에서 파일 다운로드 (S3용)
 */
const downloadFileFromUrl = async (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`파일 다운로드 실패: ${response.statusCode}`));
        return;
      }
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
};

/**
 * 이미지 처리 (썸네일 생성)
 */
const processImage = async (job, filePath, fileBuffer, fileUrl, filename) => {
  job.progress(10);
  let imageBuffer;
  if (fileBuffer) {
    imageBuffer = fileBuffer;
  } else if (filePath && fs.existsSync(filePath)) {
    imageBuffer = fs.readFileSync(filePath);
  } else if (fileUrl) {
    job.progress(20);
    imageBuffer = await downloadFileFromUrl(fileUrl);
  } else {
    throw new Error('이미지 파일을 찾을 수 없습니다.');
  }

  job.progress(30);
  const thumbnailBuffer = await sharp(imageBuffer)
    .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
    .toFormat('webp')
    .toBuffer();

  job.progress(60);
  const thumbnailFilename = `thumb_${filename}.webp`;
  const thumbnailResult = await StorageService.saveThumbnail(thumbnailBuffer, thumbnailFilename);
  job.progress(100);

  return { thumbnailUrl: thumbnailResult.url, processingStatus: 'completed' };
};

/**
 * 3D 모델 처리 (GLB 변환)
 */
const processModel3D = async (job, filePath, fileBuffer, fileUrl, filename, roomId) => {
  const { messageId } = job.data;
  const ext = path.extname(filename).toLowerCase();
  
  if (ext === '.dxd') return {};

  const supportedFormats = ['.stl', '.obj', '.ply'];
  if (!supportedFormats.includes(ext)) return {};

  console.log(`[Processor ${process.pid}] 🏗️ 3D 변환 시작: ${filename} (Job: ${job.id})`);
  job.progress(10);

  let originalBuffer;
  if (fileBuffer) {
    originalBuffer = fileBuffer;
  } else if (filePath && fs.existsSync(filePath)) {
    originalBuffer = fs.readFileSync(filePath);
  } else if (fileUrl) {
    originalBuffer = await downloadFileFromUrl(fileUrl);
  } else {
    throw new Error('3D 모델 파일을 찾을 수 없습니다.');
  }

  const tempDir = os.tmpdir();
  const uniqueId = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const tempInputPath = path.join(tempDir, `input_${uniqueId}${ext}`);
  const resourcePaths = [];

  try {
    fs.writeFileSync(tempInputPath, originalBuffer);
    console.log(`[Processor] 💾 임시 파일 저장 완료`);
    job.progress(30);

    // AssimpJS 로드 및 변환 (자식 프로세스에서 실행되므로 안전)
    const ajs = await require('assimpjs')();
    const fileList = new ajs.FileList();
    fileList.AddFile(path.basename(tempInputPath), new Uint8Array(originalBuffer));
    
    const result = ajs.ConvertFileList(fileList, 'gltf2');
    if (!result.IsSuccess() || result.FileCount() === 0) {
      throw new Error(`AssimpJS 변환 실패 (Code: ${result.GetErrorCode()})`);
    }
    
    let gltfJson = null;
    const resources = {};
    for (let i = 0; i < result.FileCount(); i++) {
      const resFile = result.GetFile(i);
      const resName = resFile.GetPath();
      const resContent = resFile.GetContent();
      if (resName.toLowerCase().endsWith('.gltf')) {
        gltfJson = JSON.parse(new TextDecoder().decode(resContent));
      } else {
        resources[resName] = Buffer.from(resContent);
      }
    }

    if (!gltfJson) throw new Error('glTF JSON을 찾을 수 없습니다.');
    console.log(`[Processor] ✅ AssimpJS 완료`);
    job.progress(60);

    const gltfPipeline = require('gltf-pipeline');
    for (const [name, buffer] of Object.entries(resources)) {
      const resPath = path.join(tempDir, `${uniqueId}_${name}`);
      fs.writeFileSync(resPath, buffer);
      resourcePaths.push(resPath);
      if (gltfJson.buffers) {
        gltfJson.buffers = gltfJson.buffers.map(b => b.uri === name ? { ...b, uri: `${uniqueId}_${name}` } : b);
      }
      if (gltfJson.images) {
        gltfJson.images = gltfJson.images.map(img => img.uri === name ? { ...img, uri: `${uniqueId}_${name}` } : img);
      }
    }

    const conversionResult = await gltfPipeline.gltfToGlb(gltfJson, { resourceDirectory: tempDir });
    console.log(`[Processor] ✅ GLB 패킹 완료`);
    job.progress(85);

    const renderFilename = `render_${uniqueId}_${path.parse(filename).name}.glb`;
    const renderResult = await StorageService.saveRender(conversionResult.glb, renderFilename);
    console.log(`[Processor] 🚀 저장 완료: ${renderResult.url}`);
    job.progress(100);

    return { renderUrl: renderResult.url, processingStatus: 'completed' };
  } finally {
    [tempInputPath, ...resourcePaths].forEach(p => {
      try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch(e) {}
    });
  }
};

/**
 * 메시지 업데이트 및 소켓 브로드캐스트
 * [v2.8.0] 다중 파일 지원: fileIndex가 있으면 해당 인덱스의 파일 정보 업데이트
 */
const updateMessage = async (messageId, updateData, fileIndex = null) => {
  try {
    const message = await Message.findById(messageId);
    if (!message) {
      console.warn(`[Processor] 메시지 업데이트 스킵: ${messageId} (메시지를 찾을 수 없음)`);
      return;
    }

    let updatedMessage;
    const socketPayload = {
      messageId: message._id.toString(),
      fileIndex,
    };

    if (fileIndex !== null && message.files && message.files[fileIndex]) {
      // 다중 파일 중 특정 파일 업데이트
      const updateObj = {};
      if (updateData.thumbnailUrl) {
        updateObj[`files.${fileIndex}.thumbnailUrl`] = updateData.thumbnailUrl;
        socketPayload.thumbnailUrl = updateData.thumbnailUrl;
      }
      if (updateData.renderUrl) {
        updateObj[`files.${fileIndex}.renderUrl`] = updateData.renderUrl;
        socketPayload.renderUrl = updateData.renderUrl;
      }
      if (updateData.processingStatus) {
        updateObj[`files.${fileIndex}.processingStatus`] = updateData.processingStatus;
        socketPayload.processingStatus = updateData.processingStatus;
      }

      // [v2.8.0] 하위 호환성: 첫 번째 파일이면 탑레벨 필드도 업데이트
      if (fileIndex === 0) {
        if (updateData.thumbnailUrl) updateObj.thumbnailUrl = updateData.thumbnailUrl;
        if (updateData.renderUrl) updateObj.renderUrl = updateData.renderUrl;
        if (updateData.processingStatus) updateObj.processingStatus = updateData.processingStatus;
      }

      updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        { $set: updateObj },
        { new: true }
      ).populate('roomId');
    } else {
      // 레거시: 탑레벨 필드 업데이트
      updatedMessage = await Message.findByIdAndUpdate(
        messageId,
        { $set: updateData },
        { new: true }
      ).populate('roomId');
      
      socketPayload.thumbnailUrl = updateData.thumbnailUrl;
      socketPayload.renderUrl = updateData.renderUrl;
      socketPayload.processingStatus = updateData.processingStatus || updatedMessage.processingStatus;
    }

    if (updatedMessage && updatedMessage.roomId) {
      const roomIdStr = updatedMessage.roomId._id ? updatedMessage.roomId._id.toString() : updatedMessage.roomId.toString();
      
      // [v2.9.2] 모든 파일 처리가 완료되었는지 확인
      const allFilesProcessed = updatedMessage.files && updatedMessage.files.every(f => 
        f.processingStatus === 'completed' || f.processingStatus === 'failed' || f.processingStatus === 'cancelled'
      );
      
      if (allFilesProcessed) {
        socketPayload.allProcessed = true;
        
        // 전체 처리 완료 시 탑레벨 상태도 업데이트 (하위 호환)
        const finalStatus = updatedMessage.files.every(f => f.processingStatus === 'completed' || f.processingStatus === 'cancelled') ? 'completed' : 'failed';
        if (updatedMessage.processingStatus !== finalStatus) {
          await Message.findByIdAndUpdate(messageId, { $set: { processingStatus: finalStatus } });
        }
      }

      await socketService.sendMessageUpdate(roomIdStr, socketPayload);
    }
  } catch (err) {
    console.error(`[Processor] 메시지 업데이트 중 치명적 오류:`, err);
  }
};

/**
 * Bull Sandboxed Worker Entry Point
 */
module.exports = async (job) => {
  try {
    await initializeProcessor();
    const { messageId, fileIndex, roomId, fileType, fileUrl, filePath, filename } = job.data;
    
    console.log(`[Processor ${process.pid}] 🔄 작업 수신: Job ${job.id} (${fileType}) | Msg: ${messageId} | Index: ${fileIndex}`);
    
    const currentMsg = await Message.findById(messageId);
    if (!currentMsg) {
      console.log(`[Processor ${process.pid}] ⏭️ 작업 스킵 (메시지 없음): Job ${job.id}`);
      return { status: 'not_found' };
    }

    // 다중 파일 지원 체크
    const isMultiFile = fileIndex !== null && currentMsg.files && currentMsg.files[fileIndex];
    const targetStatus = isMultiFile ? currentMsg.files[fileIndex].processingStatus : currentMsg.processingStatus;

    if (targetStatus === 'cancelled') {
        console.log(`[Processor ${process.pid}] ⏭️ 작업 취소됨: Job ${job.id}`);
        return { status: 'cancelled' };
    }

    let result = {};
    switch (fileType) {
      case 'image': result = await processImage(job, filePath, null, fileUrl, filename); break;
      case 'model3d':
      case '3d': result = await processModel3D(job, filePath, null, fileUrl, filename, roomId); break;
      default: result = { processingStatus: 'completed' };
    }

    await updateMessage(messageId, result, fileIndex);
    console.log(`[Processor ${process.pid}] ✅ 작업 완료 및 DB 업데이트 완료: Job ${job.id}`);
    return result;
  } catch (error) {
    console.error(`[Processor ${process.pid}] ❌ 치명적 오류 (Job ${job.id}):`, error);
    try {
        if (job.data?.messageId) {
            await updateMessage(job.data.messageId, { processingStatus: 'failed' }, job.data.fileIndex);
        }
    } catch (e) {}
    throw error;
  }
};
