/**
 * localStorage 캐싱 유틸리티
 * 반복적인 localStorage 읽기를 메모리 캐시로 최적화하여 성능 향상
 * 
 * @see https://vercel.com/blog/how-we-made-the-vercel-dashboard-twice-as-fast
 */

const storageCache = new Map<string, string | null>();

/**
 * localStorage에서 값을 가져오되, 메모리 캐시를 우선 사용
 */
export function getLocalStorage(key: string): string | null {
  if (!storageCache.has(key)) {
    try {
      storageCache.set(key, localStorage.getItem(key));
    } catch {
      // incognito/private browsing, quota exceeded, or disabled
      return null;
    }
  }
  return storageCache.get(key) ?? null;
}

/**
 * localStorage에 값을 저장하고 캐시도 동기화
 */
export function setLocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
    storageCache.set(key, value);
  } catch {
    // incognito/private browsing, quota exceeded, or disabled
    // 캐시는 업데이트하지 않음
  }
}

/**
 * localStorage에서 값을 제거하고 캐시도 삭제
 */
export function removeLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
    storageCache.delete(key);
  } catch {
    // 에러 발생 시에도 캐시는 삭제
    storageCache.delete(key);
  }
}

/**
 * 특정 키의 캐시를 무효화 (외부 변경 감지 시 사용)
 */
export function invalidateStorageCache(key: string): void {
  storageCache.delete(key);
}

/**
 * 모든 캐시를 무효화
 */
export function clearStorageCache(): void {
  storageCache.clear();
}

// 외부 변경 감지 (다른 탭에서 localStorage 변경 시)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key) {
      invalidateStorageCache(e.key);
    }
  });

  // 페이지가 다시 보일 때 캐시 무효화 (서버에서 설정한 쿠키 등 변경 가능)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // 중요한 키들만 무효화 (예: token)
      invalidateStorageCache('token');
    }
  });
}
