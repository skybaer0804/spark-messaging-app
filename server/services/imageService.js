const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;
const StorageService = require('./storage/StorageService');

/**
 * ImageService
 * 썸네일 생성은 이제 chatController에서 직접 처리하므로
 * 이 서비스는 하위 호환성을 위해 유지 (필요시 삭제 가능)
 */
class ImageService {
  /**
   * @deprecated chatController에서 직접 처리하도록 변경됨
   * 하위 호환성을 위해 유지
   */
  async createThumbnail(originalPath, filename) {
    try {
      const imageBuffer = fs.readFileSync(originalPath);
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(300, 300, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFormat('webp')
        .toBuffer();

      const thumbnailFilename = `thumb_${filename}.webp`;
      const thumbnailResult = await StorageService.saveThumbnail(
        thumbnailBuffer,
        thumbnailFilename
      );
      
      return thumbnailResult.url;
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return null;
    }
  }

  // 사용하지 않는 파일 삭제 유틸리티
  async deleteFile(filePath) {
    try {
      await fsPromises.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
    }
  }
}

module.exports = new ImageService();

