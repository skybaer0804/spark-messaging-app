import { signal, computed } from '@preact/signals';

export interface UploadItem {
  id: string; // tempId
  roomId: string; // 어느 방에서 업로드 중인지
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
  retryCount: number;
  abortController?: AbortController;
  groupId?: string; // [v2.6.0]
}

// 업로드 상태를 관리하는 시그널 (Key: tempId)
export const uploadState = signal<Record<string, UploadItem>>({});

// 현재 진행 중인 업로드 목록 (computed)
export const activeUploads = computed(() => {
  return Object.values(uploadState.value).filter(
    (item) => item.status === 'pending' || item.status === 'uploading'
  );
});

// 전체 업로드 개수 (완료된 것 제외하고 실패한 것도 포함하여 관리할지 결정 필요 -> 여기서는 활성 + 실패만)
export const visibleUploads = computed(() => {
  return Object.values(uploadState.value).filter((item) => item.status !== 'completed');
});

// Actions
export const addUpload = (item: UploadItem) => {
  uploadState.value = {
    ...uploadState.value,
    [item.id]: item,
  };
};

export const updateUploadProgress = (id: string, progress: number) => {
  if (!uploadState.value[id]) return;
  
  // 시그널 최적화를 위해 불변성 유지 (전체 객체 교체)
  const current = uploadState.value[id];
  if (current.progress === progress) return;

  uploadState.value = {
    ...uploadState.value,
    [id]: { ...current, progress, status: 'uploading' },
  };
};

export const completeUpload = (id: string) => {
  if (!uploadState.value[id]) return;
  
  // 완료된 항목은 잠시 후 제거하거나 즉시 제거 (여기서는 상태만 변경하고 UI에서 처리)
  // 단, 메모리 관리를 위해 일정 시간 후 삭제하는 로직은 컴포넌트나 서비스에서 담당
  const current = uploadState.value[id];
  uploadState.value = {
    ...uploadState.value,
    [id]: { ...current, progress: 100, status: 'completed' },
  };

  // 1초 후 목록에서 제거 (선택사항)
  setTimeout(() => {
    removeUpload(id);
  }, 1000);
};

export const failUpload = (id: string, error: string) => {
  if (!uploadState.value[id]) return;

  const current = uploadState.value[id];
  uploadState.value = {
    ...uploadState.value,
    [id]: { ...current, status: 'failed', error },
  };
};

export const removeUpload = (id: string) => {
  const next = { ...uploadState.value };
  delete next[id];
  uploadState.value = next;
};

export const cancelUpload = (id: string) => {
  const item = uploadState.value[id];
  if (item && item.abortController) {
    item.abortController.abort();
  }
  removeUpload(id);
};
