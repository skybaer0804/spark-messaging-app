import type { ComponentChildren } from 'preact';
import { memo } from 'preact/compat';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/Sidebar/AppSidebar';
import { Content } from '@/layouts/Content/Content';
import './SidebarLayout.scss';

interface SidebarLayoutProps {
  children: ComponentChildren;
}

export const SidebarLayout = memo(({ children }: SidebarLayoutProps) => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-col min-w-0 flex-1">
          <Content>{children}</Content>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
});
