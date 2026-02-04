const LocalStorageService = require('./LocalStorageService');
const storageConfig = require('../../config/storageConfig');

/**
 * Storage Service (Strategy Pattern - Singleton)
 * 환경변수에 따라 로컬 또는 S3 저장소를 자동 선택
 */
class StorageService {
  constructor() {
    this.initializeStrategy();
  }

  /**
   * 저장소 전략 초기화
   */
  initializeStrategy() {
    const storageType = storageConfig.type;

    if (storageType === 's3') {
      console.log('📦 Initializing S3 Storage Service');
      // S3 모드일 때만 동적으로 require (aws-sdk가 없어도 로컬 모드는 동작)
      const S3StorageService = require('./S3StorageService');
      this.strategy = new S3StorageService();
    } else {
      console.log('📁 Initializing Local Storage Service');
      this.strategy = new LocalStorageService();
    }
  }

  /**
   * 파일 저장
   * @param {Object} file - Express Multer file object
   * @param {String} type - 'original' 또는 'thumbnail'
   * @returns {Promise<Object>} - { filename, url }
   */
  async saveFile(file, type = 'original') {
    return this.strategy.saveFile(file, type);
  }

  /**
   * 썸네일 저장
   * @param {Buffer} thumbnailBuffer - 썸네일 바이너리
   * @param {String} filename - 썸네일 파일명
   * @returns {Promise<Object>} - { filename, url }
   */
  async saveThumbnail(thumbnailBuffer, filename) {
    return this.strategy.saveThumbnail(thumbnailBuffer, filename);
  }

  /**
   * 3D 변환 모델 저장
   * @param {Buffer} renderBuffer - GLB 바이너리
   * @param {String} filename - 파일명
   * @returns {Promise<Object>} - { filename, url }
   */
  async saveRender(renderBuffer, filename) {
    return this.strategy.saveRender(renderBuffer, filename);
  }

  /**
   * 파일 삭제
   * @param {String} fileUrl - 파일 URL
   * @returns {Promise<Boolean>} - 삭제 성공 여부
   */
  async deleteFile(fileUrl) {
    return this.strategy.deleteFile(fileUrl);
  }

  /**
   * 썸네일 삭제
   * @param {String} thumbnailUrl - 썸네일 URL
   * @returns {Promise<Boolean>} - 삭제 성공 여부
   */
  async deleteThumbnail(thumbnailUrl) {
    return this.strategy.deleteThumbnail(thumbnailUrl);
  }

  /**
   * 현재 저장소 타입 조회
   * @returns {String} - 'local' 또는 's3'
   */
  getStorageType() {
    return storageConfig.type;
  }
}

// Singleton 인스턴스 생성
module.exports = new StorageService();
