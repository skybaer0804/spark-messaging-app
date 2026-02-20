import { useState, useEffect } from 'preact/hooks';
import { useTheme } from '@/core/context/ThemeProvider';
import { MobileHeader } from '@/components/Mobile/MobileHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/core/context/ToastContext';
import { useAuth } from '@/core/hooks/useAuth';
import { workspaceApi } from '@/core/api/ApiService';
import {
  IconSettings,
  IconKey,
  IconWorld,
  IconLock,
  IconCalendar,
  IconHash,
  IconCopy,
  IconEye,
  IconEyeOff,
  IconDeviceFloppy,
  IconArrowLeft,
} from '@tabler/icons-preact';
import { useRouterState } from '@/routes/RouterState';
import { cn } from '@/lib/utils';

interface WorkspaceDetailProps {
  id?: string;
}

export function WorkspaceDetail({ id }: WorkspaceDetailProps) {
  const { user } = useAuth();
  const { navigate } = useRouterState();
  const { showSuccess, showError } = useToast();
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    initials: '',
    color: '',
    allowPublicJoin: false,
    projectUrl: '',
  });

  const fetchWorkspace = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await workspaceApi.getWorkspace(id);
      setWorkspace(res.data);
      setFormData({
        name: res.data.name,
        initials: res.data.initials || '',
        color: res.data.color || '#4f46e5',
        allowPublicJoin: res.data.allowPublicJoin || false,
        projectUrl: res.data.projectUrl || '',
      });
    } catch (err) {
      showError('워크스페이스 정보를 불러오는데 실패했습니다.');
      navigate('/workspace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspace();
  }, [id]);

  const handleUpdate = async () => {
    if (!id) return;
    try {
      await workspaceApi.updateWorkspace(id, formData);
      showSuccess('워크스페이스 정보가 업데이트되었습니다.');
      setIsEditing(false);
      fetchWorkspace();
    } catch (err) {
      showError('업데이트에 실패했습니다.');
    }
  };

  const handleRevealPrivateKey = async () => {
    if (!id || privateKey) {
      setShowPrivateKey(!showPrivateKey);
      return;
    }
    try {
      const res = await workspaceApi.getPrivateKey(id);
      setPrivateKey(res.data.privateKey);
      setShowPrivateKey(true);
    } catch (err) {
      showError('비밀키 조회 권한이 없습니다.');
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(`${label}가 클립보드에 복사되었습니다.`);
  };

  const { deviceSize } = useTheme();

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto">
        {deviceSize === 'mobile' && <MobileHeader />}
        <div className="flex-1 flex items-center justify-center">
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!workspace) return null;

  const isAdmin = user?.role === 'admin';
  const canEdit = isAdmin || workspace.ownerId === user?.id || !workspace.ownerId;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto animate-in fade-in duration-500">
      {deviceSize === 'mobile' && <MobileHeader />}
      
      <div className="max-w-4xl mx-auto w-full p-6 md:p-10 space-y-8">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/workspace')} className="rounded-full h-10 w-10">
              <IconArrowLeft size={20} />
            </Button>
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold tracking-tight">워크스페이스 상세</h1>
            </div>
          </div>
          {canEdit && (
            <Button variant={isEditing ? 'outline' : 'default'} onClick={() => setIsEditing(!isEditing)} className="shadow-sm">
              {isEditing ? (
                '취소'
              ) : (
                <div className="flex items-center gap-2">
                  <IconSettings size={18} /> <span>설정</span>
                </div>
              )}
            </Button>
          )}
        </header>

        <div className="grid grid-cols-1 gap-6">
          <Card className="border-none shadow-xl bg-card">
            <CardContent className="p-8">
              <div className="flex flex-col gap-10">
                {/* 기본 정보 섹션 */}
                <section className="space-y-6">
                  <h4 className="text-lg font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">
                    기본 정보
                  </h4>
                  <div className="flex items-center gap-8 flex-wrap">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-bold text-3xl transition-all shadow-lg overflow-hidden"
                      style={{ backgroundColor: isEditing ? formData.color : workspace.color }}
                    >
                      {isEditing ? (
                        <input
                          type="text"
                          className="w-full h-full bg-transparent text-center border-none outline-none focus:ring-0 uppercase"
                          value={formData.initials}
                          maxLength={2}
                          onInput={(e: any) => setFormData({ ...formData, initials: e.currentTarget.value.toUpperCase() })}
                        />
                      ) : (
                        workspace.initials || workspace.name.substring(0, 1).toUpperCase()
                      )}
                    </div>

                    <div className="flex-1 space-y-4">
                      {isEditing ? (
                        <div className="space-y-4 max-w-md">
                          <div className="space-y-2">
                            <Label htmlFor="ws-name">워크스페이스 이름</Label>
                            <Input
                              id="ws-name"
                              value={formData.name}
                              onInput={(e: any) => setFormData({ ...formData, name: e.currentTarget.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>브랜드 컬러</Label>
                            <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg border">
                              <input
                                type="color"
                                className="w-8 h-8 rounded-full border-none cursor-pointer overflow-hidden"
                                value={formData.color}
                                onInput={(e: any) => setFormData({ ...formData, color: e.currentTarget.value })}
                              />
                              <span className="font-mono text-sm font-bold uppercase tracking-wider">
                                {formData.color}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <h2 className="text-3xl font-black">
                            {workspace.name}
                          </h2>
                          <p className="text-muted-foreground font-medium">
                            {workspace.allowPublicJoin ? '공개 워크스페이스' : '비공개 워크스페이스'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                {/* 시스템 정보 섹션 */}
                <section className="space-y-6">
                  <h4 className="text-lg font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">
                    시스템 정보
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <IconHash size={16} />
                        <span className="text-xs font-bold uppercase">워크스페이스 ID</span>
                      </div>
                      <p className="font-mono text-sm break-all font-semibold">
                        {workspace._id}
                      </p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <IconCalendar size={16} />
                        <span className="text-xs font-bold uppercase">생성일</span>
                      </div>
                      <p className="font-semibold">
                        {new Date(workspace.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </section>

                {/* API 연동 섹션 */}
                <section className="space-y-6">
                  <h4 className="text-lg font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">
                    API 및 연동 설정
                  </h4>
                  <div className="space-y-4">
                    <div className="p-5 bg-background rounded-xl border-2 border-dashed">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <IconKey size={20} />
                          </div>
                          <span className="font-bold">Public API Key</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(workspace.projectPublicKey, 'Public Key')}
                        >
                          <IconCopy size={16} />
                        </Button>
                      </div>
                      <code className="block p-3 bg-muted/50 rounded-lg text-sm font-mono break-all border select-all">
                        {workspace.projectPublicKey}
                      </code>
                    </div>

                    <div className="p-5 bg-background rounded-xl border-2 border-dashed">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
                            <IconLock size={20} />
                          </div>
                          <span className="font-bold">Private Secret Key</span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleRevealPrivateKey}>
                            {showPrivateKey ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                          </Button>
                          {showPrivateKey && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyToClipboard(privateKey || '', 'Private Key')}
                            >
                              <IconCopy size={16} />
                            </Button>
                          )}
                        </div>
                      </div>
                      <code className="block p-3 bg-muted/50 rounded-lg text-sm font-mono break-all border select-all">
                        {showPrivateKey ? privateKey || '조회 권한이 없습니다.' : '••••••••••••••••••••••••••••••••••••••••'}
                      </code>
                    </div>

                    <div className="p-5 bg-background rounded-xl border-2 border-dashed">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500/10 rounded-lg text-green-600">
                            <IconWorld size={20} />
                          </div>
                          <span className="font-bold">Integration URL</span>
                        </div>
                      </div>
                      {isEditing ? (
                        <Input
                          placeholder="https://your-api-endpoint.com"
                          value={formData.projectUrl}
                          onInput={(e: any) => setFormData({ ...formData, projectUrl: e.currentTarget.value })}
                        />
                      ) : (
                        <p className="font-medium p-1">{workspace.projectUrl || '설정되지 않음'}</p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <h4 className="text-lg font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">
                    보안 및 정책
                  </h4>
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/20 border">
                    <div className="pt-1">
                      <Checkbox
                        id="allowPublicJoin"
                        disabled={!isEditing}
                        checked={formData.allowPublicJoin}
                        onCheckedChange={(checked: boolean) => setFormData({ ...formData, allowPublicJoin: checked })}
                      />
                    </div>
                    <div className="grid gap-1.5 leading-none">
                      <Label
                        htmlFor="allowPublicJoin"
                        className="text-sm font-bold leading-none cursor-pointer"
                      >
                        누구나 참여 가능 (Public Join)
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        활성화하면 초대 링크 없이도 사용자가 이 워크스페이스를 검색하여 가입할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </section>

                {isEditing && (
                  <div className="pt-4 border-t">
                    <Button className="w-full h-14 text-lg font-bold shadow-xl hover:shadow-2xl transition-all" onClick={handleUpdate}>
                      <IconDeviceFloppy size={22} className="mr-2" />
                      변경 사항 저장
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
