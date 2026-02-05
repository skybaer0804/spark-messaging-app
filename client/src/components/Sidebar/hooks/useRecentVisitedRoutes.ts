import { useEffect, useMemo, useState } from 'preact/hooks';
import { useRouterState } from '@/routes/RouterState';
import { appRoutes } from '@/routes/appRoutes';
import { getLocalStorage, setLocalStorage } from '@/core/utils/storageCache';

const STORAGE_KEY = 'spark-recent-visited-paths';

const normalizePath = (pathname: string) => pathname.split('?')[0].split('#')[0] || '/';

const loadPaths = (): string[] => {
  try {
    const raw = getLocalStorage(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p) => typeof p === 'string').map((p) => normalizePath(p));
  } catch {
    return [];
  }
};

const savePaths = (paths: string[]) => {
  try {
    setLocalStorage(STORAGE_KEY, JSON.stringify(paths));
  } catch {
    // ignore
  }
};

export interface RecentVisitedRouteItem {
  path: string;
  label: string;
  title?: string;
  icon?: preact.JSX.Element;
}

function findRouteMetaByPath(path: string): RecentVisitedRouteItem | null {
  const hit = appRoutes.find((r) => r.path === path);
  if (hit) return { path: hit.path, label: hit.label, title: hit.title, icon: hit.icon };

  for (const r of appRoutes) {
    const c = r.children?.find((child) => child.path === path);
    if (c) return { path: c.path, label: c.label, title: c.title, icon: r.icon };
  }

  return { path, label: path, title: path };
}

export function useRecentVisitedRoutes(options?: { max?: number; excludePaths?: string[] }) {
  const { pathname } = useRouterState();
  const max = options?.max ?? 6;
  const excludePaths = useMemo(() => new Set((options?.excludePaths ?? []).map(normalizePath)), [options?.excludePaths]);

  const [paths, setPaths] = useState<string[]>(() => loadPaths().slice(0, max));

  useEffect(() => {
    const nextPath = normalizePath(pathname);
    if (excludePaths.has(nextPath)) return;

    setPaths((prev) => {
      const deduped = [nextPath, ...prev.filter((p) => p !== nextPath)].slice(0, max);
      savePaths(deduped);
      return deduped;
    });
  }, [excludePaths, max, pathname]);

  // 단일 루프로 최적화: map().filter() 체인을 하나로 통합
  return useMemo(() => {
    const result: RecentVisitedRouteItem[] = [];
    for (const path of paths) {
      const meta = findRouteMetaByPath(path);
      if (meta) {
        result.push(meta);
      }
    }
    return result;
  }, [paths]);
}






