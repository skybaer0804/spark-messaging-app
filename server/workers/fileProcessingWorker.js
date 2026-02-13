const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const http = require('http');
const FileProcessingQueue = require('../services/queue/FileProcessingQueue');
const StorageService = require('../services/storage/StorageService');
const storageConfig = require('../config/storageConfig');
const Message = require('../models/Message');
const socketService = require('../services/socketService');

/**
 * 파일 처리 워커
 * 썸네일/프리뷰 생성 및 메타데이터 추출을 비동기로 처리
 */
class FileProcessingWorker {
  constructor() {
    this.queue = FileProcessingQueue.queue;
    this.setupProcessor();
  }

  /**
   * 큐 프로세서 설정
   */
  setupProcessor() {
    // [v2.6.0] 자원 경합 방지를 위해 동시 처리 개수를 2로 제한
    this.queue.process('process-file', 2, async (job) => {
      const { messageId, roomId, fileType, fileUrl, filePath, fileBuffer, filename, mimeType } = job.data;

      console.log(`[Worker] 🔄 처리 시작: ${fileType} | ${filename} | Job: ${job.id}`);

      try {
        // [v2.6.0] 작업 시작 전 메시지 상태 확인 (이미 취소되었거나 삭제되었는지)
        const currentMsg = await Message.findById(messageId);
        if (!currentMsg || currentMsg.processingStatus === 'cancelled') {
          console.log(`[Worker] ⏭️ 작업 취소됨 (메시지 부재 또는 상태 취소): ${messageId}`);
          return { status: 'cancelled' };
        }

        let result = {};

        // 파일 타입별 처리
        switch (fileType) {
          case 'image':
            result = await this.processImage(job, filePath, fileBuffer, fileUrl, filename);
            break;
          case 'video':
            result = await this.processVideo(job, filePath, fileBuffer, fileUrl, filename);
            break;
          case 'audio':
            result = await this.processAudio(job, filePath, fileBuffer, fileUrl, filename);
            break;
          case 'document':
            result = await this.processDocument(job, filePath, fileBuffer, fileUrl, filename);
            break;
          case 'model3d':
          case '3d':
            result = await this.processModel3D(job, filePath, fileBuffer, fileUrl, filename, roomId);
            break;
          default:
            throw new Error(`지원하지 않는 파일 타입: ${fileType}`);
        }

        // DB 업데이트
        await this.updateMessage(messageId, result);

        console.log(`[Worker] ✅ 처리 완료: ${fileType} | Job: ${job.id}`);
        return result;
      } catch (error) {
        console.error(`[Worker] ❌ 처리 실패: ${fileType} | Job: ${job.id}`, error);
        
        // 실패 상태로 DB 업데이트
        await this.updateMessage(messageId, {
          processingStatus: 'failed',
          error: error.message,
        });

        throw error;
      }
    });
  }

  /**
   * 중단 여부 확인 헬퍼 (중간 단계에서 호출)
   */
  async checkAborted(messageId) {
    const msg = await Message.findById(messageId).select('processingStatus');
    if (!msg || msg.processingStatus === 'cancelled') {
        throw new Error('ABORTED');
    }
  }

  /**
   * 진행률 전송 헬퍼
   */
  async reportProgress(job, messageId, roomId, progress) {
    job.progress(progress);
    if (roomId) {
      await socketService.sendMessageProgress(roomId, {
        messageId,
        progress
      });
    }
  }

  /**
   * URL에서 파일 다운로드 (S3용)
   */
  async downloadFileFromUrl(url) {
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
  }

  /**
   * 이미지 처리 (썸네일 생성)
   */
  async processImage(job, filePath, fileBuffer, fileUrl, filename) {
    job.progress(10);

    // 이미지 버퍼 로드
    let imageBuffer;
    if (fileBuffer) {
      // 버퍼가 직접 제공된 경우 (S3 모드에서 즉시 처리 시)
      imageBuffer = fileBuffer;
    } else if (filePath && fs.existsSync(filePath)) {
      // 로컬 모드: 파일 경로에서 읽기
      imageBuffer = fs.readFileSync(filePath);
    } else if (fileUrl) {
      // S3 모드: URL에서 다운로드
      job.progress(20);
      imageBuffer = await this.downloadFileFromUrl(fileUrl);
    } else {
      throw new Error('이미지 파일을 찾을 수 없습니다.');
    }

    job.progress(30);

    // 썸네일 생성
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toFormat('webp')
      .toBuffer();

    job.progress(60);

    // 썸네일 저장
    const thumbnailFilename = `thumb_${filename}.webp`;
    const thumbnailResult = await StorageService.saveThumbnail(
      thumbnailBuffer,
      thumbnailFilename
    );

    job.progress(100);

    return {
      thumbnailUrl: thumbnailResult.url,
      processingStatus: 'completed',
    };
  }

  /**
   * 동영상 처리 (썸네일 생성 - 추후 FFmpeg 통합 예정)
   */
  async processVideo(job, filePath, fileBuffer, fileUrl, filename) {
    job.progress(10);

    // TODO: FFmpeg를 사용한 썸네일 추출
    // 현재는 기본 정보만 반환
    // 추후 FFmpeg 통합 시 구현

    job.progress(100);

    return {
      processingStatus: 'completed',
      // TODO: thumbnailUrl, duration, resolution 등 추가
    };
  }

  /**
   * 오디오 처리 (메타데이터 추출 - 추후 구현)
   */
  async processAudio(job, filePath, fileBuffer, fileUrl, filename) {
    job.progress(10);

    // TODO: 오디오 메타데이터 추출 (duration, bitrate 등)
    // 현재는 기본 정보만 반환

    job.progress(100);

    return {
      processingStatus: 'completed',
      // TODO: duration, bitrate 등 추가
    };
  }

  /**
   * 문서 처리 (프리뷰 생성 - 추후 구현)
   */
  async processDocument(job, filePath, fileBuffer, fileUrl, filename) {
    job.progress(10);

    // TODO: PDF 첫 페이지 이미지 변환 등
    // 현재는 기본 정보만 반환

    job.progress(100);

    return {
      processingStatus: 'completed',
      // TODO: previewUrl 등 추가
    };
  }

  /**
   * 3D 모델 처리 (GLB 썸네일 생성)
   * .stl, .obj, .ply 파일만 프리뷰 생성 (.dxd는 제외)
   */
  async processModel3D(job, filePath, fileBuffer, fileUrl, filename, roomId) {
    const { messageId } = job.data;
    // .dxd 파일은 프리뷰 생성하지 않음 (업로드/다운로드는 지원)
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.dxd') {
      console.log(`[3D] ⏭️ .dxd 파일 스킵 (프리뷰 미지원): ${filename}`);
      return {};
    }

    // 지원하는 형식 확인 (.stl, .obj, .ply만)
    const supportedFormats = ['.stl', '.obj', '.ply'];
    if (!supportedFormats.includes(ext)) {
      console.log(`[3D] ⏭️ 지원하지 않는 형식 스킵: ${ext} (${filename})`);
      return {};
    }

    console.log(`[3D] 🏗️ 변환 준비: ${filename} (Job: ${job.id})`);

    // 1. 원본 파일 로드
    let originalBuffer;
    try {
      if (fileBuffer) {
        originalBuffer = fileBuffer;
      } else if (filePath && fs.existsSync(filePath)) {
        originalBuffer = fs.readFileSync(filePath);
      } else if (fileUrl) {
        originalBuffer = await this.downloadFileFromUrl(fileUrl);
      } else {
        throw new Error('3D 모델 파일을 찾을 수 없습니다.');
      }
    } catch (e) {
      console.error(`[3D] ❌ 파일 로드 실패: ${filename}`, e);
      throw e;
    }

    // [v2.6.0] 중단 체크
    await this.checkAborted(messageId);

    // 3. 임시 파일 경로 생성
    const tempDir = os.tmpdir();
    const tempInputPath = path.join(tempDir, `input_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
    const resourcePaths = [];

    try {
      // 원본 파일을 임시 경로에 저장
      fs.writeFileSync(tempInputPath, originalBuffer);
      console.log(`[3D] 💾 임시 파일 저장 완료: ${tempInputPath}`);

      // 4. Assimp로 STL/OBJ/PLY → GLB 변환 (assimpjs 사용)
      console.log(`[3D] 🔄 AssimpJS 변환 시작...`);
      const ajs = await require('assimpjs')();
      const fileList = new ajs.FileList();
      fileList.AddFile(path.basename(tempInputPath), new Uint8Array(originalBuffer));
      
      const result = ajs.ConvertFileList(fileList, 'gltf2');
      if (!result.IsSuccess() || result.FileCount() === 0) {
        const errCode = result.GetErrorCode();
        throw new Error(`AssimpJS 변환 실패 (Error Code: ${errCode})`);
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

      if (!gltfJson) throw new Error('변환 결과 중 glTF JSON 파일을 찾을 수 없습니다.');
      console.log(`[3D] ✅ AssimpJS 변환 완료 (리소스 개수: ${Object.keys(resources).length})`);

      // 5. gltf-pipeline로 glTF(JSON) → GLB 변환
      console.log(`[3D] 🔄 GLTF-Pipeline (GLB 패킹) 시작...`);
      const gltfPipeline = require('gltf-pipeline');
      const DRACO_THRESHOLD = 5 * 1024 * 1024;
      const shouldCompress = originalBuffer.length > DRACO_THRESHOLD;

      // 리소스들을 임시 디렉토리에 써주어야 gltfToGlb가 찾을 수 있음
      for (const [name, buffer] of Object.entries(resources)) {
        const resPath = path.join(tempDir, name);
        fs.writeFileSync(resPath, buffer);
        resourcePaths.push(resPath);
      }

      const options = {
        resourceDirectory: tempDir,
        dracoOptions: shouldCompress ? { compressionLevel: 7 } : undefined,
        fixUnusedElements: true
      };

      const conversionResult = await gltfPipeline.gltfToGlb(gltfJson, options);
      let finalGlbBuffer = conversionResult.glb;
      console.log(`[3D] ✅ GLB 패킹 완료 (크기: ${finalGlbBuffer.length} bytes)`);

      // [v2.6.0] 중단 체크
      await this.checkAborted(messageId);

      // 6. 3D 변환 모델 저장
      const renderFilename = `render_${path.parse(filename).name}.glb`;
      const renderResult = await StorageService.saveRender(finalGlbBuffer, renderFilename);
      console.log(`[3D] 🚀 저장 완료: ${renderResult.url}`);

      return {
        renderUrl: renderResult.url,
        processingStatus: 'completed'
      };
    } catch (error) {
        if (error.message === 'ABORTED') {
            console.log(`[3D] 🛑 작업 중단됨: ${messageId}`);
            return { processingStatus: 'cancelled' };
        }
        throw error;
    } finally {
      // 임시 파일 정리
      [tempInputPath, ...resourcePaths].forEach(p => {
        try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch(e) {}
      });
      console.log(`[3D] 🧹 임시 파일 정리 완료`);
    }
  }

  /**
   * 메시지 업데이트 및 소켓 브로드캐스트
   */
  async updateMessage(messageId, updateData) {
    try {
      const message = await Message.findByIdAndUpdate(
        messageId,
        { $set: updateData },
        { new: true }
      ).populate('roomId');

      if (!message) {
        console.error(`메시지를 찾을 수 없습니다: ${messageId}`);
        return;
      }

      // 소켓으로 메시지 업데이트 브로드캐스트
      await socketService.sendMessageUpdate(message.roomId._id.toString(), {
        messageId: message._id.toString(),
        ...updateData,
      });
    } catch (error) {
      console.error('메시지 업데이트 실패:', error);
      throw error;
    }
  }
}

// 워커 인스턴스 생성 및 시작
const worker = new FileProcessingWorker();

module.exports = worker;
