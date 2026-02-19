const FileProcessingQueue = require('../services/queue/FileProcessingQueue');
const path = require('path');

/**
 * 파일 처리 워커 (Sandboxed 분리 버전)
 */
class FileProcessingWorker {
  constructor() {
    this.queue = FileProcessingQueue.queue;
    this.setupProcessor();
  }

  /**
   * 큐 프로세서 설정 (Sandboxed Worker)
   */
  setupProcessor() {
    const processorPath = path.join(__dirname, 'fileProcessor.js');
    
    // [v2.9.2] 3D WASM 연산 시 메인 스레드 블로킹 방지를 위해 Sandboxed Worker로 실행
    // concurrency: 1을 유지하여 CPU 자원 보호
    this.queue.process('process-file', 1, processorPath);
    
    console.log(`[Worker] ✅ Sandboxed processor registered: ${processorPath}`);
  }
}

// 워커 인스턴스 생성 및 시작
new FileProcessingWorker();

module.exports = {};

