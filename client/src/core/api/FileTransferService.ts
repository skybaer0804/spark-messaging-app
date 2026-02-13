import type SparkMessaging from '@skybaer0804/spark-messaging-client';
import { chatApi } from './ApiService';
import { validateFile as validateFileConfig } from '../config/fileConfig';

export class FileTransferService {
  constructor(_client: SparkMessaging, _connectionService?: any, _chatService?: any) {
    // ConnectionService와 ChatService는 현재 사용되지 않음
  }

  // 파일 검증 (백엔드와 동일한 로직 사용)
  public validateFile(file: File): { valid: boolean; error?: string } {
    const validation = validateFileConfig(file);
    return validation;
  }

  // 파일을 Base64로 읽기
  public readFileAsBase64(file: File, onProgress?: (progress: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 50; // 0-50% 범위
          onProgress(progress);
        }
      };

      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };

      reader.onerror = () => {
        reject(new Error('파일 읽기 실패'));
      };

      reader.readAsDataURL(file);
    });
  }

  // 파일 전송 (v2.8.0 Robust Upload with Retry & Abort)
  public async sendFile(
    roomId: string,
    file: File,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal,
    groupId?: string
  ): Promise<any> {
    // 1. 파일 검증
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const MAX_RETRIES = 3;
    let attempt = 0;

    const tryUpload = async (): Promise<any> => {
      try {
        if (signal?.aborted) throw new Error('Upload aborted');

        if (onProgress) onProgress(10); // 시작

        const formData = new FormData();
        formData.append('file', file);
        formData.append('roomId', roomId);
        if (groupId) formData.append('groupId', groupId);

        // Axios request config with signal and progress
        const response = await chatApi.uploadFile(formData, {
          signal,
          onUploadProgress: (progressEvent: any) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              // 10% ~ 90% 구간으로 매핑 (처음 10%는 준비, 마지막 10%는 서버 처리)
              const mappedProgress = 10 + (percentCompleted * 0.8);
              onProgress(mappedProgress);
            }
          },
        });

        if (onProgress) onProgress(100); // 완료
        return response.data;

      } catch (error: any) {
        if (signal?.aborted || error.message === 'canceled') {
          throw new Error('Upload aborted');
        }

        // 네트워크 에러이거나 5xx 서버 에러인 경우 재시도
        const isNetworkError = !error.response; // 응답이 없으면 네트워크 에러
        const isServerError = error.response && error.response.status >= 500;

        if ((isNetworkError || isServerError) && attempt < MAX_RETRIES) {
          attempt++;
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
          console.warn(`[FileTransfer] Upload failed. Retrying in ${delay}ms (Attempt ${attempt}/${MAX_RETRIES})`);
          
          if (onProgress) onProgress(0); // 에러 시 진행률 초기화 표시

          // 오프라인 상태라면 온라인이 될 때까지 대기
          if (!navigator.onLine) {
            console.log('[FileTransfer] Offline detected. Waiting for connection...');
            await this.waitForOnline();
            // 스마트 재시도: 연결 회복 후 즉시 시도하지 않고 잠시 대기
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          return tryUpload(); // 재귀 호출
        }

        console.error('File upload failed after retries:', error);
        throw error;
      }
    };

    return tryUpload();
  }

  // 온라인 상태 대기 헬퍼
  private waitForOnline(): Promise<void> {
    return new Promise((resolve) => {
      const handleOnline = () => {
        window.removeEventListener('online', handleOnline);
        resolve();
      };
      window.addEventListener('online', handleOnline);
    });
  }

  // 이미지 썸네일 생성 (현재 사용되지 않음)
  // private generateThumbnail(file: File, maxWidth: number, maxHeight: number): Promise<string> {
  //   return new Promise((resolve, reject) => {
  //     const img = new Image();
  //     const canvas = document.createElement('canvas');
  //     const ctx = canvas.getContext('2d');

  //     if (!ctx) {
  //       reject(new Error('Canvas context를 가져올 수 없습니다.'));
  //       return;
  //     }

  //     img.onload = () => {
  //       // 비율 유지하며 리사이징
  //       let width = img.width;
  //       let height = img.height;

  //       if (width > height) {
  //         if (width > maxWidth) {
  //           height = (height * maxWidth) / width;
  //           width = maxWidth;
  //         }
  //       } else {
  //         if (height > maxHeight) {
  //           width = (width * maxHeight) / height;
  //           height = maxHeight;
  //         }
  //       }

  //       canvas.width = width;
  //       canvas.height = height;
  //       ctx.drawImage(img, 0, 0, width, height);

  //       const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
  //       resolve(thumbnail);
  //     };

  //     img.onerror = () => {
  //       reject(new Error('이미지 로드 실패'));
  //     };

  //     const reader = new FileReader();
  //     reader.onload = (e) => {
  //       img.src = e.target?.result as string;
  //     };
  //     reader.onerror = () => {
  //       reject(new Error('파일 읽기 실패'));
  //     };
  //     reader.readAsDataURL(file);
  //   });
  // }
}
