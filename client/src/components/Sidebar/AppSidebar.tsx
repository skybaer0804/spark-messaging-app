import { useMemo, useEffect } from 'preact/hooks';
import { memo } from 'preact/compat';
import { IconSparkles, IconUser, IconPin, IconPinFilled } from '@tabler/icons-preact';
import { useRouterState } from '@/routes/RouterState';
import { appRoutes, type AppRouteNode } from '@/routes/appRoutes';
import { currentWorkspaceId, setCurrentWorkspaceId, totalUnreadCount, workspacesList } from '@/stores/chatRoomsStore';
import { workspaceApi } from '@/core/api/ApiService';
import { useAuth } from '@/core/hooks/useAuth';
import { useTheme } from '@/core/context/ThemeProvider';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export const AppSidebar = memo(() => {
  const { pathname, navigate } = useRouterState();
  const { user } = useAuth();
  const { sidebarConfig, setSidebarConfig } = useTheme();
  const { secondMenuPinned } = sidebarConfig;
  const workspaces = workspacesList.value;
  const activeWorkspaceId = currentWorkspaceId.value;
  const unread = totalUnreadCount.value;

  const lnbRouteIds = useMemo(() => new Set(['chatapp', 'video-meeting', 'notification']), []);
  const lnbRoutes = useMemo(() => {
    const result: AppRouteNode[] = [];
    for (const route of appRoutes) {
      if (lnbRouteIds.has(route.id)) {
        result.push(route);
      }
    }
    return result;
  }, [lnbRouteIds]);

  const pinnedSecondMenuRoute: AppRouteNode | undefined = useMemo(() => {
    const mainRoutes = appRoutes;
    const activeMainRoute = pathname.startsWith('/design-system')
      ? mainRoutes.find((r) => r.id === 'design-system')
      : mainRoutes.find((r) => pathname.startsWith(r.path) && r.path !== '/');
    
    if (activeMainRoute?.secondMenu && activeMainRoute?.children?.length) {
      return activeMainRoute;
    }
    return undefined;
  }, [pathname]);

  const fetchWorkspaces = async () => {
    try {
      const res = await workspaceApi.getWorkspaces();
      workspacesList.value = res.data;
      if (res.data.length > 0 && !currentWorkspaceId.value) {
        setCurrentWorkspaceId(res.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    }
  };

  useEffect(() => {
    if (user) fetchWorkspaces();
  }, [user]);

  const handleTogglePin = () => {
    setSidebarConfig({ secondMenuPinned: !secondMenuPinned });
  };

  return (
    <div className="flex h-full">
      {/* Primary Sidebar (Icons) */}
      <Sidebar collapsible="none" className="w-16 flex-shrink-0 border-r border-sidebar-border bg-sidebar">
        <SidebarHeader className="h-16 flex items-center justify-center p-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                isActive={pathname === '/'}
                onClick={() => navigate('/')}
                className={cn(
                  "w-12 h-12 rounded-full mx-auto flex items-center justify-center transition-all",
                  pathname === '/' ? "bg-primary text-primary-foreground rounded-2xl" : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                )}
              >
                <IconSparkles size={28} />
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="flex flex-col items-center py-2 gap-4">
          <Separator className="w-8 h-[2px] bg-sidebar-border opacity-50" />
          
          {/* Active Workspace */}
          <div className="flex flex-col gap-2">
            {workspaces
              .filter((ws) => ws._id === activeWorkspaceId)
              .map((ws) => (
                <SidebarMenu key={ws._id}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      size="lg"
                      onClick={() => navigate('/workspace')}
                      className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center mx-auto"
                    >
                      {ws.initials || ws.name.substring(0, 1).toUpperCase()}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              ))}
          </div>

          <Separator className="w-8 h-[2px] bg-sidebar-border opacity-50" />

          {/* Main Navigation */}
          <nav className="flex flex-col gap-2 w-full">
            {lnbRoutes.map((route) => {
              const isActive = pathname.startsWith(route.path) && (route.path !== '/' || pathname === '/');
              const isChat = route.id === 'chatapp';
              
              return (
                <SidebarMenu key={route.id}>
                  <SidebarMenuItem className="px-2">
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => navigate(route.path)}
                      tooltip={route.label}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all mx-auto",
                        isActive 
                          ? "bg-primary text-primary-foreground rounded-2xl" 
                          : "text-muted-foreground hover:bg-primary/10 hover:text-primary hover:rounded-2xl"
                      )}
                    >
                      <div className="relative">
                        {route.icon}
                        {isChat && unread > 0 && (
                          <Badge className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center p-0 text-[10px] bg-destructive text-destructive-foreground border-2 border-sidebar">
                            {unread}
                          </Badge>
                        )}
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              );
            })}
          </nav>
        </SidebarContent>

        <SidebarFooter className="py-4 flex items-center justify-center">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => navigate('/profile')}
                className="w-12 h-12 rounded-full overflow-hidden transition-all hover:rounded-2xl mx-auto p-0"
              >
                <Avatar className={cn(
                  "w-full h-full transition-all",
                  pathname.startsWith('/profile') ? "rounded-2xl" : "rounded-full"
                )}>
                  <AvatarImage src={user?.profileImage} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {user?.username?.substring(0, 1).toUpperCase() || <IconUser size={24} />}
                  </AvatarFallback>
                </Avatar>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Secondary Sidebar (Sub-menu) */}
      {pinnedSecondMenuRoute && (
        <Sidebar collapsible="none" className={cn(
          "w-64 border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
          !secondMenuPinned && "hidden"
        )}>
          <SidebarHeader className="h-16 flex flex-row items-center justify-between px-4 border-b border-sidebar-border">
            <h2 className="font-bold text-lg truncate">
              {pinnedSecondMenuRoute.label}
            </h2>
            <button
              onClick={handleTogglePin}
              className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground transition-colors"
              title={secondMenuPinned ? '2차 메뉴 고정 해제' : '2차 메뉴 고정'}
            >
              {secondMenuPinned ? <IconPinFilled size={18} /> : <IconPin size={18} />}
            </button>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {pinnedSecondMenuRoute.children?.map((child) => {
                    const isActive = pathname === child.path;
                    return (
                      <SidebarMenuItem key={child.id}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => navigate(child.path)}
                          className={cn(
                            "w-full justify-start px-3 py-2 h-10 rounded-md transition-colors",
                            isActive 
                              ? "bg-primary/10 text-primary font-semibold" 
                              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          {child.label}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      )}
    </div>
  );
});
