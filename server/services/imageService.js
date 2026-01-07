const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

class ImageService {
  async createThumbnail(originalPath, filename) {
    const thumbnailPath = path.join('uploads', 'thumbnails', `thumb_${filename}`);
    
    try {
      await sharp(originalPath)
        .resize(300, 300, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFormat('webp')
        .toFile(thumbnailPath);
      
      return thumbnailPath;
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return null;
    }
  }

  // 사용하지 않는 파일 삭제 유틸리티
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
    }
  }
}

module.exports = new ImageService();

