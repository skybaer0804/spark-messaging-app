const Queue = require('bull');
const redisConfig = require('../../config/redis');
const Message = require('../../models/Message'); // [v2.9.3] DB 동기화를 위해 추가

/**
 * 파일 처리 큐 (Bull Queue)
 * 썸네일/프리뷰 생성을 비동기로 처리
 */
class FileProcessingQueue {
  constructor() {
    // Redis 연결 설정
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    // 파일 처리 큐 생성
    this.queue = new Queue('file-processing', {
      redis: redisUrl,
      settings: {
        lockDuration: 600000, // 1분 (대용량 3D 파일 처리 대응)
        stalledInterval: 600000,
      },
      defaultJobOptions: {
        attempts: 2, // 재시도 2회로 상향 (일시적 Redis 장애 등 대응)
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: {
          age: 3600,
          count: 100,
        },
        removeOnFail: {
          age: 86400, // 실패 건은 24시간 보존 (디버깅용)
        },
      },
    });

    // [v2.9.1] 서버 시작 시점 기록
    this.serverStartTime = Date.now();

    // [v2.9.2] 초기 큐 상태 로깅
    this.queue
      .getJobCounts()
      .then((counts) => {
        console.log(`📊 [Queue Startup] Current counts: ${JSON.stringify(counts)}`);
      })
      .catch(() => {});

    // 큐 이벤트 리스너
    this.setupEventListeners();
  }

  /**
   * 큐 이벤트 리스너 설정
   */
  setupEventListeners() {
    this.queue.on('completed', async (job) => {
      const { fileType } = job.data;
      console.log(`✅ 파일 처리 완료: Job ${job.id} - ${fileType}`);

      try {
        const counts = await this.queue.getJobCounts();
        console.log(`📊 [Queue Stats] ${JSON.stringify(counts)}`);
      } catch (e) {}
    });

    this.queue.on('failed', (job, err) => {
      console.error(`❌ 파일 처리 실패: Job ${job.id} - ${err.message}`);
    });

    this.queue.on('error', (error) => {
      console.error('❌ 큐 에러:', error);
    });

    this.queue.on('active', (job) => {
      console.log(`🏃 [Queue] 작업 시작: Job ${job.id}`);
    });

    this.queue.on('waiting', (jobId) => {
      console.log(`⏳ [Queue] 작업 대기중: Job ${jobId}`);
    });

    this.queue.on('stalled', (job) => {
      console.warn(`⚠️ [Queue] 작업 정체(Stalled) 감지: Job ${job.id}`);
    });
  }

  /**
   * 파일 처리 작업 추가
   * @param {Object} jobData - 작업 데이터
   * @param {string} jobData.messageId - 메시지 ID
   * @param {string} jobData.fileType - 파일 타입 ('image', 'video', 'audio', 'document')
   * @param {string} jobData.fileUrl - 원본 파일 URL
   * @param {string} jobData.filePath - 로컬 파일 경로 (로컬 스토리지인 경우)
   * @param {Buffer} jobData.fileBuffer - 파일 버퍼 (S3 스토리지인 경우)
   * @param {string} jobData.filename - 파일명
   * @param {string} jobData.mimeType - MIME 타입
   * @returns {Promise<Object>} - Bull Job 객체
   */
  async addFileProcessingJob(jobData) {
    try {
      // [v2.9.2] 우선순위 로직이 Bull의 Sandboxed Worker와 충돌할 가능성이 있어 일단 단순화 (FIFO)
      const job = await this.queue.add('process-file', jobData);

      console.log(`📥 [Queue] 작업 추가 성공: Job ${job.id} | ${jobData.fileType} | Msg: ${jobData.messageId}`);
      return job;
    } catch (error) {
      console.error('파일 처리 작업 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 파일 타입별 우선순위 결정
   * @param {string} fileType - 파일 타입
   * @returns {number} - 우선순위 (낮을수록 높은 우선순위)
   */
  getPriority(fileType) {
    const priorities = {
      image: 1, // 이미지는 가장 높은 우선순위
      document: 2,
      audio: 3,
      model3d: 4, // 3D 모델
      video: 4, // 동영상은 처리 시간이 오래 걸림
    };
    return priorities[fileType] || 5;
  }

  /**
   * 작업 상태 조회
   * @param {string} jobId - 작업 ID
   * @returns {Promise<Object>} - 작업 상태
   */
  async getJobStatus(jobId) {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      id: job.id,
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
    };
  }

  /**
   * 큐 통계 조회
   * @returns {Promise<Object>} - 큐 통계
   */
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  /**
   * 큐 정리 (테스트/개발용)
   */
  async clean() {
    await this.queue.clean(0, 'completed');
    await this.queue.clean(0, 'failed');
  }

  /**
   * [v2.9.3] 데이터베이스와 큐 상태 동기화 (AutoFix)
   * DB상태가 'queued'이나 큐에 없는 작업을 찾아 복구
   */
  async syncWithDatabase() {
    console.log('🔍 [Queue] 정기 동기화 점검 시작...');
    try {
      const counts = await this.queue.getJobCounts();

      // 1. 'queued' 상태의 메시지 조회
      const queuedMessages = await Message.find({
        processingStatus: 'queued',
        fileUrl: { $exists: true, $ne: null },
      });

      let recovered = 0;
      for (const msg of queuedMessages) {
        // 해당 메시지 ID를 가진 작업이 큐에 있는지 확인 (ID는 messageId로 추적)
        // Bull의 기본 ID가 아닌 data 내의 messageId로 검색해야 함 (getJobs 활용)
        const activeJobs = await this.queue.getActive();
        const waitingJobs = await this.queue.getWaiting();

        const isAlreadyInQueue = [...activeJobs, ...waitingJobs].some(
          (job) => job.data && job.data.messageId === msg._id.toString() && job.data.fileIndex === (msg.fileIndex || 0),
        );

        if (!isAlreadyInQueue) {
          console.log(`🛠️ [AutoFix] 작업 유실 감지 - 복구 중: Msg ${msg._id}`);

          await this.addFileProcessingJob({
            messageId: msg._id.toString(),
            fileIndex: 0, // 기본값
            roomId: msg.roomId.toString(),
            fileType: msg.fileType || '3d', // 기본값
            fileUrl: msg.fileUrl,
            filePath: msg.filePath,
            filename: msg.fileName || 'unknown',
            mimeType: msg.mimeType,
          });
          recovered++;
        }
      }

      // 2. 'processing' 상태로 너무 오래 방치된 작업 점검 (15분 이상)
      const staleTime = new Date(Date.now() - 15 * 60 * 1000);
      const staleProcessingMessages = await Message.find({
        processingStatus: 'processing',
        updatedAt: { $lt: staleTime },
      });

      for (const msg of staleProcessingMessages) {
        console.warn(`⚠️ [AutoFix] 장기 정체 작업 감지 - 초기화: Msg ${msg._id}`);
        msg.processingStatus = 'queued'; // 다시 대기 상태로 돌려서 다음 sync에서 처리되게 함
        await msg.save();
      }

      console.log(`✅ [Queue] 동기화 점검 완료 (복구: ${recovered}, 정체 해결: ${staleProcessingMessages.length})`);
      return { recovered, stale: staleProcessingMessages.length, queueCounts: counts };
    } catch (error) {
      console.error('❌ [Queue] 동기화 점검 실패:', error);
    }
  }
}

// Singleton 인스턴스
module.exports = new FileProcessingQueue();
