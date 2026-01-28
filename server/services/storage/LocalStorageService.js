const fs = require('fs').promises;
const path = require('path');
const storageConfig = require('../../config/storageConfig');

/**
 * 로컬 파일시스템을 사용한 저장소 서비스
 * 개발 환경에서 사용
 */
class LocalStorageService {
  constructor() {
    this.config = storageConfig.local;
    // 업로드 기본 경로 설정
    this.baseUploadPath = this.config.uploadPath;
  }

  /**
   * 파일 저장
   * @param {Object} file - Express Multer file object
   * @param {String} type - 'original' 또는 'thumbnail'
   * @returns {Promise<Object>} - { filename, url, localPath }
   */
  async saveFile(file, type = 'original') {
    try {
      // Multer가 이미 파일을 저장했으므로 URL만 생성
      if (!file.path) {
        throw new Error('File not saved by Multer');
      }

      const filename = path.basename(file.path);

      // 클라이언트 접근 URL 생성
      const fileUrl = `${this.config.serveUrl}/${type}/${filename}`;

      console.log(`✅ Local file saved: ${filename}`);
      console.log(`📍 URL: ${fileUrl}`);

      return {
        filename: filename,
        url: fileUrl,
        localPath: file.path,
      };
    } catch (error) {
      console.error('❌ LocalStorageService.saveFile error:', error);
      throw error;
    }
  }

  /**
   * 썸네일 저장
   * @param {Buffer} thumbnailBuffer - 썸네일 이미지 바이너리
   * @param {String} filename - 썸네일 파일명
   * @returns {Promise<Object>} - { filename, url, localPath }
   */
  async saveThumbnail(thumbnailBuffer, filename) {
    try {
      const thumbnailDir = path.join(
        this.baseUploadPath,
        this.config.thumbnailDir
      );

      // 디렉토리 생성
      await fs.mkdir(thumbnailDir, { recursive: true });

      const thumbnailPath = path.join(thumbnailDir, filename);

      // 썸네일 파일 저장
      await fs.writeFile(thumbnailPath, thumbnailBuffer);

      // 클라이언트 접근 URL 생성
      const thumbnailUrl = `${this.config.serveUrl}/${this.config.thumbnailDir}/${filename}`;

      console.log(`✅ Thumbnail saved: ${filename}`);
      console.log(`📍 URL: ${thumbnailUrl}`);

      return {
        filename: filename,
        url: thumbnailUrl,
        localPath: thumbnailPath,
      };
    } catch (error) {
      console.error('❌ LocalStorageService.saveThumbnail error:', error);
      throw error;
    }
  }

  /**
   * 3D 변환 모델 저장
   * @param {Buffer} renderBuffer - GLB 바이너리
   * @param {String} filename - 파일명
   * @returns {Promise<Object>} - { filename, url, localPath }
   */
  async saveRender(renderBuffer, filename) {
    try {
      const renderDir = path.join(
        this.baseUploadPath,
        this.config.renderDir
      );

      // 디렉토리 생성
      await fs.mkdir(renderDir, { recursive: true });

      const renderPath = path.join(renderDir, filename);

      // 파일 저장
      await fs.writeFile(renderPath, renderBuffer);

      // 클라이언트 접근 URL 생성
      const renderUrl = `${this.config.serveUrl}/${this.config.renderDir}/${filename}`;

      console.log(`✅ Render model saved: ${filename}`);
      console.log(`📍 URL: ${renderUrl}`);

      return {
        filename: filename,
        url: renderUrl,
        localPath: renderPath,
      };
    } catch (error) {
      console.error('❌ LocalStorageService.saveRender error:', error);
      throw error;
    }
  }

  /**
   * 파일 삭제
   * @param {String} fileUrl - 파일 URL
   * @returns {Promise<Boolean>} - 삭제 성공 여부
   */
  async deleteFile(fileUrl) {
    try {
      const filename = path.basename(fileUrl);

      // 모든 가능한 디렉토리에서 파일 찾기
      const directories = [
        this.config.originalDir,
        this.config.thumbnailDir,
      ];

      for (const dir of directories) {
        const filepath = path.join(this.baseUploadPath, dir, filename);

        try {
          await fs.unlink(filepath);
          console.log(`✅ File deleted: ${filepath}`);
          return true;
        } catch (err) {
          // 파일이 없으면 다음 디렉토리 시도
          continue;
        }
      }

      console.warn(`⚠️ File not found for deletion: ${fileUrl}`);
      return false;
    } catch (error) {
      console.error('❌ LocalStorageService.deleteFile error:', error);
      throw error;
    }
  }

  /**
   * 썸네일 삭제
   * @param {String} thumbnailUrl - 썸네일 URL
   * @returns {Promise<Boolean>} - 삭제 성공 여부
   */
  async deleteThumbnail(thumbnailUrl) {
    return this.deleteFile(thumbnailUrl);
  }
}

module.exports = LocalStorageService;
