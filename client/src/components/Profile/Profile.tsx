import { useState, useEffect } from 'preact/hooks';
import { useTheme, PresetColor } from '@/core/context/ThemeProvider';
import { MobileHeader } from '@/components/Mobile/MobileHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/core/hooks/useAuth';
import { useRouterState } from '@/routes/RouterState';
import { useToast } from '@/core/context/ToastContext';
import { authApi, workspaceApi } from '@/core/api/ApiService';
import { cn } from '@/lib/utils';
import {
  IconUser,
  IconMail,
  IconDeviceFloppy,
  IconEdit,
  IconMessageCircle,
  IconBell,
  IconShieldLock,
  IconLogout,
  IconPalette,
  IconColorSwatch,
  IconShape,
  IconExternalLink,
  IconChevronRight,
} from '@tabler/icons-preact';
import { PushService } from '@/core/api/PushService';
import { Badge } from '@/components/ui/badge';
import './Profile.scss';

const PRESET_COLORS: { value: PresetColor; label: string }[] = [
  { value: 'default', label: '기본' },
  { value: 'monotone', label: '모노톤' },
];

export function Profile() {
  const { user, updateUser, signOut } = useAuth();
  const { navigate } = useRouterState();
  const { showSuccess, showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  // 테마 관련 훅
  const {
    theme,
    toggleTheme,
    contrast,
    toggleContrast,
    presetColor,
    setPresetColor,
    borderRadius,
    setBorderRadius,
    resetToDefaults,
    deviceSize,
  } = useTheme();

  const [localBorderRadius, setLocalBorderRadius] = useState(borderRadius);

  useEffect(() => {
    Promise.all([
      PushService.getSubscriptionStatus().then((isSubscribed) => {
        setPushEnabled(isSubscribed && Notification.permission === 'granted');
      }),
      workspaceApi
        .getWorkspaces()
        .then((res) => {
          setWorkspaces(res.data);
        })
        .catch((err) => {
          console.error('Failed to fetch workspaces:', err);
        }),
    ]);
  }, []);

  const handleTogglePush = async () => {
    if (pushEnabled) {
      const success = await PushService.unsubscribeFromPush();
      if (success) {
        setPushEnabled(false);
        showSuccess('알림이 비활성화되었습니다.');
      } else {
        showError('알림 비활성화에 실패했습니다.');
      }
    } else {
      const success = await PushService.subscribeToPush();
      if (success) {
        setPushEnabled(Notification.permission === 'granted');
        showSuccess('알림이 활성화되었습니다.');
      } else {
        showError('알림 활성화에 실패했습니다. 브라우저 설정을 확인해주세요.');
      }
    }
  };

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    status: user?.status || 'offline',
    statusText: user?.statusText || '',
    role: user?.role || 'user',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        status: user.status || 'offline',
        statusText: user.statusText || '',
        role: user.role || 'user',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await authApi.updateProfile({
        username: formData.username,
        status: formData.status,
        statusText: formData.statusText,
        role: formData.role,
      });

      updateUser(res.data);
      showSuccess('프로필이 성공적으로 업데이트되었습니다.');
      setIsEditing(false);
    } catch (err) {
      showError('업데이트 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleBorderRadiusChange = (value: number) => {
    setLocalBorderRadius(value);
    setBorderRadius(value);
  };

  const statusOptions = [
    { value: 'online', label: '온라인' },
    { value: 'away', label: '부재중' },
    { value: 'busy', label: '다른 용무 중' },
    { value: 'offline', label: '오프라인' },
  ];

  const roleOptions = [
    { value: 'admin', label: 'Admin (관리자)' },
    { value: 'user', label: 'User (사용자)' },
    { value: 'guest', label: 'Guest (게스트)' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-y-auto animate-in fade-in duration-500">
      {deviceSize === 'mobile' && <MobileHeader />}

      <div className="max-w-4xl mx-auto w-full p-6 md:p-10 space-y-10">
        <header className="space-y-2">
          <Badge variant="outline" className="mb-2">Account Settings</Badge>
          <h1 className="text-3xl font-extrabold tracking-tight">사용자 설정</h1>
          <p className="text-lg text-muted-foreground opacity-80">
            개인 프로필과 워크스페이스, 그리고 나만의 테마를 여기서 관리하세요.
          </p>
        </header>

        {/* Profile Hero Card */}
        <Card className="relative overflow-hidden border-none shadow-xl bg-card">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          <CardContent className="p-8 relative z-10">
            <div className="flex items-center gap-8 flex-wrap">
              <div className="relative group">
                <Avatar className="w-24 h-24 text-3xl font-bold ring-4 ring-background shadow-2xl transition-transform group-hover:scale-105 duration-300">
                  <AvatarImage src={user?.profileImage} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {formData.username.substring(0, 1)}
                  </AvatarFallback>
                </Avatar>
                <div className={cn(
                  "absolute bottom-1 right-1 w-6 h-6 rounded-full border-4 border-background shadow-lg",
                  formData.status === 'online' ? "bg-green-500" :
                  formData.status === 'away' ? "bg-amber-500" :
                  formData.status === 'busy' ? "bg-red-500" : "bg-slate-400"
                )} />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-black">
                  {formData.username}
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-lg text-muted-foreground font-medium">
                    {formData.email}
                  </span>
                  <Badge className="bg-green-500 text-white border-transparent">Verified</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-xl mb-6">
            <TabsTrigger value="info" className="flex-1 py-3 rounded-lg text-base font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
              프로필 정보
            </TabsTrigger>
            <TabsTrigger value="workspaces" className="flex-1 py-3 rounded-lg text-base font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
              워크스페이스
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex-1 py-3 rounded-lg text-base font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
              테마 설정
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <Card className="border-none shadow-sm bg-muted/30">
              <CardContent className="p-0">
                <div className="flex flex-col">
                  {/* 이름 섹션 */}
                  <div className="p-5 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <IconUser size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                            이름
                          </p>
                          {isEditing ? (
                            <Input
                              id="username"
                              value={formData.username}
                              onInput={(e: any) => setFormData({ ...formData, username: e.currentTarget.value })}
                              placeholder="이름을 입력하세요"
                              className="max-w-[300px]"
                            />
                          ) : (
                            <p className="text-lg font-bold">
                              {formData.username}
                            </p>
                          )}
                        </div>
                      </div>
                      {!isEditing && <IconChevronRight size={18} className="text-muted-foreground/30" />}
                    </div>
                  </div>

                  <Separator />

                  {/* 상태 섹션 */}
                  <div className="p-5 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <IconMessageCircle size={20} />
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                            상태 및 메시지
                          </p>
                          {isEditing ? (
                            <div className="flex flex-col gap-2 mt-2 max-w-[300px]">
                              <Select
                                value={formData.status}
                                onValueChange={(value: any) =>
                                  setFormData({ ...formData, status: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="상태 메시지 입력"
                                value={formData.statusText}
                                onInput={(e: any) => setFormData({ ...formData, statusText: e.currentTarget.value })}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Badge variant={formData.status === 'online' ? 'default' : 'secondary'}>
                                {statusOptions.find((s) => s.value === formData.status)?.label}
                              </Badge>
                              {formData.statusText && (
                                <p className="font-medium">
                                  {formData.statusText}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {!isEditing && <IconChevronRight size={18} className="text-muted-foreground/30" />}
                    </div>
                  </div>

                  <Separator />

                  {/* 권한 섹션 */}
                  <div className="p-5 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <IconShieldLock size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                            권한
                          </p>
                          {isEditing ? (
                            <Select
                              value={formData.role}
                              onValueChange={(value: any) =>
                                setFormData({ ...formData, role: value })
                              }
                            >
                              <SelectTrigger className="w-[300px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {roleOptions.map(opt => (
                                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge variant="outline">
                              {roleOptions.find((r) => r.value === formData.role)?.label || formData.role}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {!isEditing && <IconChevronRight size={18} className="text-muted-foreground/30" />}
                    </div>
                  </div>

                  <Separator />

                  {/* 이메일 섹션 (수정 불가) */}
                  <div className="p-5 opacity-70">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                        <IconMail size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          이메일 (수정 불가)
                        </p>
                        <p className="font-medium text-muted-foreground">
                          {formData.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 알림 설정 섹션 */}
                  <div className="p-5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <IconBell size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                            알림 설정
                          </p>
                          <p className="font-medium">
                            웹 푸시 알림
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={pushEnabled}
                        onCheckedChange={handleTogglePush}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="pt-2">
              {!isEditing ? (
                <Button variant="default" className="w-full h-12 text-lg shadow-md hover:shadow-lg transition-all rounded-xl" onClick={() => setIsEditing(true)}>
                  <IconEdit size={18} className="mr-2" /> 프로필 수정하기
                </Button>
              ) : (
                <div className="flex gap-4">
                  <Button variant="outline" className="flex-1 h-12 text-lg rounded-xl" onClick={() => setIsEditing(false)}>
                    취소
                  </Button>
                  <Button variant="default" className="flex-1 h-12 text-lg shadow-md hover:shadow-lg transition-all rounded-xl" onClick={handleSave} disabled={loading}>
                    <IconDeviceFloppy size={18} className="mr-2" /> 저장하기
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="workspaces" className="space-y-4">
            {workspaces.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {workspaces.map((ws) => (
                  <Card key={ws._id} className="hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10 ring-2 ring-background shadow-sm" style={{ backgroundColor: ws.color }}>
                            <AvatarFallback>{ws.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-lg">{ws.name}</p>
                            <p className="text-sm text-muted-foreground">{ws.description || '워크스페이스 설명이 없습니다.'}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/workspace`)}>
                          <IconExternalLink size={18} className="text-muted-foreground" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center bg-muted/30 rounded-2xl border border-dashed border-border/60">
                <p className="text-muted-foreground">
                  소속된 워크스페이스가 없습니다.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="theme" className="space-y-6">
            <Card className="border-none bg-muted/30 overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                    <IconPalette size={18} />
                  </div>
                  <h4 className="font-bold text-lg">테마 모드</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-background rounded-lg p-4 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-bold">다크 모드</p>
                      <p className="text-xs text-muted-foreground">어두운 환경에서 눈의 피로 감소</p>
                    </div>
                    <Switch
                      checked={theme === 'dark'}
                      onCheckedChange={(checked) => checked !== (theme === 'dark') && toggleTheme()}
                    />
                  </div>
                  <div className="bg-background rounded-lg p-4 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-bold">고대비 모드</p>
                      <p className="text-xs text-muted-foreground">요소의 구분을 명확하게 표시</p>
                    </div>
                    <Switch
                      checked={contrast === 'high'}
                      onCheckedChange={(checked) => checked !== (contrast === 'high') && toggleContrast()}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-muted/30 overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                    <IconColorSwatch size={18} />
                  </div>
                  <h4 className="font-bold text-lg">강조 색상</h4>
                </div>
                <div className="theme-preset-grid mt-2">
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.value}
                      className={cn(
                        "theme-preset-btn transition-all flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-background/50",
                        presetColor === preset.value ? "is-active ring-2 ring-primary ring-offset-2 bg-background" : ""
                      )}
                      onClick={() => setPresetColor(preset.value)}
                    >
                      <div className={`w-10 h-10 rounded-full theme-preset-circle--${preset.value} shadow-inner`} />
                      <span className="text-xs font-bold">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-none bg-muted/30 overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                    <IconShape size={18} />
                  </div>
                  <h4 className="font-bold text-lg">레이아웃 및 모양</h4>
                </div>
                <div className="mt-2 p-6 bg-background rounded-xl shadow-sm border border-border/10">
                  <div className="flex items-center justify-between mb-4">
                    <Label className="font-bold">모서리 둥글기</Label>
                    <Badge variant="secondary">{localBorderRadius}px</Badge>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="16"
                    value={localBorderRadius}
                    onInput={(e) => handleBorderRadiusChange(Number((e.target as HTMLInputElement).value))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div 
                    className="transition-all duration-300 rounded-lg mt-8 bg-primary flex items-center justify-center h-14 text-white font-bold shadow-lg"
                    style={{ borderRadius: `${localBorderRadius}px` }}
                  >
                    버튼 모양 미리보기
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="pt-2">
              <Button variant="outline" className="w-full h-12 text-lg rounded-xl border-dashed hover:border-solid transition-all" onClick={resetToDefaults}>
                테마 초기화
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="pt-10 pb-10 border-t border-border/40 space-y-6">
          <Button
            variant="outline"
            className="w-full h-14 text-lg rounded-xl border-destructive/20 text-destructive hover:bg-destructive hover:text-white hover:border-destructive shadow-sm transition-all font-extrabold"
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
          >
            <IconLogout size={20} className="mr-2" /> 로그아웃
          </Button>
          <p className="text-center text-sm text-muted-foreground opacity-60 font-medium">
            © 2026 Spark Messaging. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
