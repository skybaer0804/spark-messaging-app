import type { ComponentChildren } from 'preact';
import { createContext } from 'preact';
import { useContext, useMemo, useState } from 'preact/hooks';
import { route as navigateTo } from 'preact-router';

interface RouterState {
  pathname: string;
  navigate: (to: string) => void;
  setPathname: (next: string) => void;
}

const RouterStateContext = createContext<RouterState | undefined>(undefined);

export const useRouterState = () => {
  const ctx = useContext(RouterStateContext);
  if (!ctx) throw new Error('useRouterState must be used within RouterStateProvider');
  return ctx;
};

export function RouterStateProvider({ children }: { children: ComponentChildren }) {
  const [pathname, setPathname] = useState('/chatapp');

  const value = useMemo<RouterState>(
    () => ({
      pathname,
      navigate: (to) => navigateTo(to),
      setPathname,
    }),
    [pathname],
  );

  return <RouterStateContext.Provider value={value}>{children}</RouterStateContext.Provider>;
}
