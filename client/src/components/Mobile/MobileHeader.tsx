import { SidebarTrigger } from '@/components/ui/sidebar';
import { useRouterState } from '@/routes/RouterState';
import { findRouteTitleByPath } from '@/routes/appRoutes';
import { useTheme } from '@/core/context/ThemeProvider';

export function MobileHeader() {
  const { pathname } = useRouterState();
  const { deviceSize } = useTheme();
  const title = findRouteTitleByPath(pathname);

  if (deviceSize !== 'mobile') return null;

  return (
    <div
      className="mobile-header sticky top-0 z-50 bg-background border-b border-border shadow-sm p-4 pt-[calc(1rem+var(--safe-area-inset-top))]"
    >
      <div className="flex items-center gap-2">
        <SidebarTrigger className="h-10 w-10 hover:bg-muted rounded-md flex items-center justify-center transition-colors" />
        
        <h4 className="text-lg font-bold ml-1">
          {title}
        </h4>
      </div>
    </div>
  );
}
