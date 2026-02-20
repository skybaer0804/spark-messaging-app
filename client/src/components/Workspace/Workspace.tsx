import { useState, useEffect } from 'preact/hooks';
import { useTheme } from '@/core/context/ThemeProvider';
import { MobileHeader } from '@/components/Mobile/MobileHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/core/context/ToastContext';
import { useAuth } from '@/core/hooks/useAuth';
import { workspaceApi, authApi } from '@/core/api/ApiService';
import { cn } from '@/lib/utils';
import {
  IconPlus,
  IconKey,
  IconWorld,
  IconLock,
  IconPencil,
  IconCheck,
  IconCircleCheck,
  IconCopy,
  IconEye,
  IconExternalLink,
} from '@tabler/icons-preact';
import { currentWorkspaceId, setCurrentWorkspaceId, workspacesList } from '@/stores/chatRoomsStore';
import { Badge } from '@/components/ui/badge';

const PRESET_COLORS = [
  '#4f46e5', // Indigo
  '#10b981', // Emerald
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#0ea5e9', // Sky
];

export function Workspace() {
  const { user, updateUser } = useAuth();
  const workspaces = workspacesList.value;
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showEditWorkspace, setShowEditWorkspace] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<any>(null);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceColor, setNewWorkspaceColor] = useState(PRESET_COLORS[0]);
  const [newWorkspaceAllowPublicJoin, setNewWorkspaceAllowPublicJoin] = useState(false);
  const [editWorkspaceData, setEditWorkspaceData] = useState({
    name: '',
    allowPublicJoin: false,
    color: PRESET_COLORS[0],
  });
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});

  const { showSuccess, showError } = useToast();
  const isAdmin = user?.role === 'admin';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(`${label} 복사되었습니다.`);
  };

  const handleRevealKey = async (workspaceId: string) => {
    try {
      const res = await workspaceApi.getPrivateKey(workspaceId);
      setRevealedKeys((prev) => ({ ...prev, [workspaceId]: res.data.privateKey }));
    } catch (err) {
      showError('비밀키 조회 권한이 없습니다.');
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await workspaceApi.getWorkspaces();
      workspacesList.value = res.data;
    } catch (err) {
      console.error(err);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await authApi.getMe();
      updateUser(res.data);
    } catch (err) {
      console.error('Failed to refresh user data', err);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    try {
      await workspaceApi.createWorkspace({
        name: newWorkspaceName,
        color: newWorkspaceColor,
        allowPublicJoin: newWorkspaceAllowPublicJoin,
      });
      setShowCreateWorkspace(false);
      setNewWorkspaceName('');
      setNewWorkspaceColor(PRESET_COLORS[0]);
      setNewWorkspaceAllowPublicJoin(false);
      // 병렬 실행으로 성능 개선
      await Promise.all([fetchWorkspaces(), refreshUser()]);
    } catch (err) {
      showError('생성 실패');
    }
  };

  const handleJoinWorkspace = async (workspaceId: string) => {
    try {
      await workspaceApi.joinWorkspace(workspaceId);
      showSuccess('워크스페이스에 참여하였습니다.');
      refreshUser();
      fetchWorkspaces();
    } catch (err: any) {
      showError(err.response?.data?.message || '참여 실패');
    }
  };

  const handleEditWorkspace = (workspace: any) => {
    setEditingWorkspace(workspace);
    setEditWorkspaceData({
      name: workspace.name,
      allowPublicJoin: workspace.allowPublicJoin || false,
      color: workspace.color || PRESET_COLORS[0],
    });
    setShowEditWorkspace(true);
  };

  const handleUpdateWorkspace = async () => {
    if (!editingWorkspace) return;
    try {
      await workspaceApi.updateWorkspace(editingWorkspace._id, editWorkspaceData);
      showSuccess('워크스페이스 정보가 수정되었습니다.');
      setShowEditWorkspace(false);
      fetchWorkspaces();
    } catch (err) {
      showError('수정 실패');
    }
  };

  const isJoined = (workspaceId: string) => {
    return user?.workspaces?.includes(workspaceId);
  };

  const { deviceSize } = useTheme();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto animate-in fade-in duration-500">
      {deviceSize === 'mobile' && <MobileHeader />}
      
      <div className="max-w-5xl mx-auto w-full p-6 md:p-10">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              워크스페이스 관리
            </h1>
            <p className="text-lg text-muted-foreground opacity-80">
              워크스페이스 설정 및 회사의 조직 구조를 관리합니다.
            </p>
          </div>
          {isAdmin && (
            <Button
              variant="default"
              size="lg"
              onClick={() => setShowCreateWorkspace(true)}
              className="shadow-md hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-2">
                <IconPlus size={20} />
                <span>새 워크스페이스</span>
              </div>
            </Button>
          )}
        </header>

        <div className="space-y-8">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold opacity-80 uppercase tracking-wider">
              워크스페이스 목록
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {workspaces.map((ws) => {
                const isActive = ws._id === currentWorkspaceId.value;
                const joined = isJoined(ws._id);

                return (
                  <Card
                    key={ws._id}
                    className={cn(
                      'transition-all duration-300',
                      isActive
                        ? 'border-primary shadow-sm ring-1 ring-primary/10'
                        : 'hover:border-primary/20',
                    )}
                  >
                    <CardContent className="p-5 md:p-6">
                      <div className="flex justify-between align-start flex-wrap gap-4">
                        <div className="flex items-center gap-6 flex-1 min-w-[280px]">
                          <Avatar
                            className="w-12 h-12 text-lg font-bold ring-2 ring-background shadow-sm"
                            style={{ backgroundColor: ws.color }}
                          >
                            <AvatarFallback>{ws.initials}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xl font-bold">
                                {ws.name}
                              </h4>
                              {ws.allowPublicJoin ? (
                                <Badge
                                  variant="outline"
                                  className="gap-1 px-1.5 py-0 text-[10px] bg-primary/5 text-primary border-primary/20"
                                >
                                  <IconWorld size={10} /> 공개
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="gap-1 px-1.5 py-0 text-[10px] bg-muted/50 text-muted-foreground"
                                >
                                  <IconLock size={10} /> 비공개
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <span>ID: {ws._id}</span>
                              <span className="mx-1 opacity-30">•</span>
                              <span>Created on {new Date(ws.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 items-center">
                          {joined ? (
                            <>
                              {!isActive ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setCurrentWorkspaceId(ws._id)}
                                  className="hover:bg-primary hover:text-white"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <IconCircleCheck size={16} /> 활성화
                                  </div>
                                </Button>
                              ) : (
                                <Badge className="bg-success text-white px-3 py-1 font-bold">
                                  <IconCheck size={14} className="mr-1" /> 활성 중
                                </Badge>
                              )}
                              {(isAdmin || ws.ownerId === user?.id || !ws.ownerId) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditWorkspace(ws)}
                                  title="수정"
                                  className="rounded-full hover:bg-muted"
                                >
                                  <IconPencil size={18} className="text-muted-foreground" />
                                </Button>
                              )}
                            </>
                          ) : (
                            ws.allowPublicJoin && (
                              <Button variant="default" size="sm" onClick={() => handleJoinWorkspace(ws._id)}>
                                참여하기
                              </Button>
                            )
                          )}
                        </div>
                      </div>

                      {joined && isActive && (
                        <div className="mt-8 space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="h-px flex-1 bg-border/60"></div>
                            <span className="text-[10px] uppercase tracking-widest font-bold text-primary/70">
                              개발 연동 정보
                            </span>
                            <div className="h-px flex-1 bg-border/60"></div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <IconKey size={14} />
                                  <span className="text-[10px] font-bold">PUBLIC KEY</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => copyToClipboard(ws.projectPublicKey, 'Public Key')}
                                >
                                  <IconCopy size={12} />
                                </Button>
                              </div>
                              <div className="text-sm font-mono bg-background/50 p-2 rounded border border-border/30 break-all select-all">
                                {ws.projectPublicKey}
                              </div>
                            </div>

                            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <IconLock size={14} />
                                  <span className="text-[10px] font-bold">PRIVATE KEY</span>
                                </div>
                                <div className="flex gap-1">
                                  {!revealedKeys[ws._id] ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => handleRevealKey(ws._id)}
                                    >
                                      <IconEye size={12} />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={() => copyToClipboard(revealedKeys[ws._id], 'Private Key')}
                                    >
                                      <IconCopy size={12} />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm font-mono bg-background/50 p-2 rounded border border-border/30 break-all select-all">
                                {revealedKeys[ws._id] || '••••••••••••••••••••••••••••••'}
                              </div>
                            </div>

                            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 space-y-3 md:col-span-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <IconWorld size={14} />
                                  <span className="text-[10px] font-bold">INTEGRATION URL</span>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(ws.projectUrl || '', 'URL')}
                                  >
                                    <IconCopy size={12} />
                                  </Button>
                                  {ws.projectUrl && (
                                    <a href={ws.projectUrl} target="_blank" rel="noopener noreferrer">
                                      <Button variant="ghost" size="icon" className="h-6 w-6">
                                        <IconExternalLink size={12} />
                                      </Button>
                                    </a>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm font-mono bg-background/50 p-2 rounded border border-border/30 truncate">
                                {ws.projectUrl || '연동 URL이 설정되지 않았습니다.'}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        <Dialog open={showCreateWorkspace} onOpenChange={setShowCreateWorkspace}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>새 워크스페이스 생성</DialogTitle>
              <DialogDescription>
                새로운 협업 공간을 만듭니다.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">워크스페이스 이름</Label>
                <Input
                  id="name"
                  placeholder="예: Spark Enterprise"
                  value={newWorkspaceName}
                  onInput={(e: any) => setNewWorkspaceName(e.currentTarget.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>브랜드 컬러</Label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((color) => (
                    <div
                      key={color}
                      onClick={() => setNewWorkspaceColor(color)}
                      className={cn(
                        'w-8 h-8 rounded-full cursor-pointer flex items-center justify-center transition-all',
                        newWorkspaceColor === color ? 'ring-2 ring-ring ring-offset-2' : '',
                      )}
                      style={{ backgroundColor: color }}
                    >
                      {newWorkspaceColor === color && <IconCheck size={16} color="white" />}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>누구나 참여 허용</Label>
                  <p className="text-xs text-muted-foreground">
                    다른 사용자가 초대 없이 워크스페이스에 참여할 수 있습니다.
                  </p>
                </div>
                <Switch
                  checked={newWorkspaceAllowPublicJoin}
                  onCheckedChange={setNewWorkspaceAllowPublicJoin}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateWorkspace(false)}>취소</Button>
              <Button onClick={handleCreateWorkspace}>생성</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEditWorkspace} onOpenChange={setShowEditWorkspace}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>워크스페이스 수정</DialogTitle>
              <DialogDescription>
                워크스페이스 정보를 수정합니다.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">워크스페이스 이름</Label>
                <Input
                  id="edit-name"
                  value={editWorkspaceData.name}
                  onInput={(e: any) => setEditWorkspaceData({ ...editWorkspaceData, name: e.currentTarget.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>브랜드 컬러</Label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((color) => (
                    <div
                      key={color}
                      onClick={() => setEditWorkspaceData({ ...editWorkspaceData, color })}
                      className={cn(
                        'w-8 h-8 rounded-full cursor-pointer flex items-center justify-center transition-all',
                        editWorkspaceData.color === color ? 'ring-2 ring-ring ring-offset-2' : '',
                      )}
                      style={{ backgroundColor: color }}
                    >
                      {editWorkspaceData.color === color && <IconCheck size={16} color="white" />}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>누구나 참여 허용</Label>
                  <p className="text-xs text-muted-foreground">
                    다른 사용자가 초대 없이 워크스페이스에 참여할 수 있습니다.
                  </p>
                </div>
                <Switch
                  checked={editWorkspaceData.allowPublicJoin}
                  onCheckedChange={(checked) =>
                    setEditWorkspaceData({ ...editWorkspaceData, allowPublicJoin: checked })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditWorkspace(false)}>취소</Button>
              <Button onClick={handleUpdateWorkspace}>저장</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
