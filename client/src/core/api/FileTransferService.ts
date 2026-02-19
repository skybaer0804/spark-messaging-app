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

  // 파일 전송 (v2.8.0 다중 파일 지원)
  public async sendFiles(
    roomId: string,
    files: File[],
    onProgress?: (progress: number) => void,
    signal?: AbortSignal,
    groupId?: string,
  ): Promise<any> {
    // 1. 파일 검증
    for (const file of files) {
      const validation = this.validateFile(file);
      if (!validation.valid) {
        throw new Error(`${file.name}: ${validation.error}`);
      }
    }

    const MAX_RETRIES = 3;
    let attempt = 0;

    const tryUpload = async (): Promise<any> => {
      try {
        if (signal?.aborted) throw new Error('Upload aborted');

        if (onProgress) onProgress(5); // 시작

        const formData = new FormData();
        files.forEach((file) => {
          formData.append('files', file);
        });
        formData.append('roomId', roomId);
        if (groupId) formData.append('groupId', groupId);

        // Axios request config with signal and progress
        const response = await chatApi.uploadFile(formData, {
          signal,
          onUploadProgress: (progressEvent: any) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              // 5% ~ 95% 구간으로 매핑
              const mappedProgress = 5 + percentCompleted * 0.9;
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

        const isNetworkError = !error.response;
        const isServerError = error.response && error.response.status >= 500;

        if ((isNetworkError || isServerError) && attempt < MAX_RETRIES) {
          attempt++;
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`[FileTransfer] Upload failed. Retrying in ${delay}ms (Attempt ${attempt}/${MAX_RETRIES})`);

          if (onProgress) onProgress(0);

          if (!navigator.onLine) {
            console.log('[FileTransfer] Offline detected. Waiting for connection...');
            await this.waitForOnline();
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } else {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }

          return tryUpload();
        }

        console.error('Files upload failed after retries:', error);
        throw error;
      }
    };

    return tryUpload();
  }

  // 기존 단일 파일 전송 (하위 호환성을 위해 유지하되 내부적으로 sendFiles 호출)
  public async sendFile(
    roomId: string,
    file: File,
    onProgress?: (progress: number) => void,
    signal?: AbortSignal,
    groupId?: string,
  ): Promise<any> {
    return this.sendFiles(roomId, [file], onProgress, signal, groupId);
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
}
