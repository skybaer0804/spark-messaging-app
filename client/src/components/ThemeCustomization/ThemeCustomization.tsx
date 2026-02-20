import { useState } from 'preact/hooks';
import { useTheme, PresetColor } from '@/core/context/ThemeProvider';
import { useAuth } from '@/core/hooks/useAuth';
import { useRouterState } from '@/routes/RouterState';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { IconPalette, IconShape, IconColorSwatch, IconLogout } from '@tabler/icons-preact';
import { cn } from '@/lib/utils';
import './ThemeCustomization.scss';

interface ThemeCustomizationProps {
  open: boolean;
  onClose: () => void;
}

const PRESET_COLORS: { value: PresetColor; label: string }[] = [
  { value: 'default', label: '기본' },
  { value: 'monotone', label: '모노톤' },
  { value: 'theme1', label: '테마 1' },
  { value: 'theme2', label: '테마 2' },
  { value: 'theme3', label: '테마 3' },
  { value: 'theme4', label: '테마 4' },
  { value: 'theme5', label: '테마 5' },
  { value: 'theme6', label: '테마 6' },
  { value: 'theme7', label: '테마 7' },
];

export function ThemeCustomization({ open, onClose }: ThemeCustomizationProps) {
  const {
    theme,
    toggleTheme,
    contrast,
    toggleContrast,
    presetColor,
    setPresetColor,
    borderRadius,
    setBorderRadius,
    sidebarConfig,
    setSidebarConfig,
    resetToDefaults,
    deviceSize,
  } = useTheme();

  const { signOut, isAuthenticated } = useAuth();
  const { navigate } = useRouterState();

  const [localBorderRadius, setLocalBorderRadius] = useState(borderRadius);

  const handleBorderRadiusChange = (value: number) => {
    setLocalBorderRadius(value);
    setBorderRadius(value);
  };

  const handleLogout = async () => {
    await signOut();
    onClose();
    navigate('/login');
  };

  const isMobile = deviceSize === 'mobile';

  return (
    <Sheet open={open} onOpenChange={(val) => !val && onClose()}>
      <SheetContent className="sm:max-w-[400px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>테마 및 계정 설정</SheetTitle>
          <SheetDescription>
            사용자 환경에 맞는 테마와 알림, 계정 정보를 설정합니다.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8">
          {/* 테마 모드 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
              <IconPalette size={18} />
              <span>테마 모드</span>
            </div>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>다크 모드</Label>
                    <p className="text-xs text-muted-foreground">어두운 환경에서 눈의 피로를 줄여줍니다.</p>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => checked !== (theme === 'dark') && toggleTheme()}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>고대비 모드</Label>
                    <p className="text-xs text-muted-foreground">텍스트와 요소의 구분을 명확하게 합니다.</p>
                  </div>
                  <Switch
                    checked={contrast === 'high'}
                    onCheckedChange={(checked) => checked !== (contrast === 'high') && toggleContrast()}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 프리셋 색상 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
              <IconColorSwatch size={18} />
              <span>프리셋 색상</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.value}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all hover:bg-muted/50",
                    presetColor === preset.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border"
                  )}
                  onClick={() => setPresetColor(preset.value)}
                >
                  <div className={`w-6 h-6 rounded-full theme-preset-circle--${preset.value} shadow-inner`} />
                  <span className="text-[10px] font-bold">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Border Radius */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
              <IconShape size={18} />
              <span>모서리 둥글기</span>
            </div>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">0px</span>
                  <span className="text-sm font-bold text-primary">{localBorderRadius}px</span>
                  <span className="text-xs font-medium">16px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="16"
                  value={localBorderRadius}
                  onInput={(e: any) => handleBorderRadiusChange(Number(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div 
                  className="flex items-center justify-center h-12 bg-primary text-white text-xs font-bold shadow-sm"
                  style={{ borderRadius: `${localBorderRadius}px` }}
                >
                  미리보기
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar 설정 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider">
              <span>사이드바 설정</span>
            </div>
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>미니 드로우</Label>
                    <p className="text-xs text-muted-foreground">사이드바를 작게 표시합니다.</p>
                  </div>
                  <Switch
                    checked={sidebarConfig.miniDrawer}
                    onCheckedChange={(checked) => setSidebarConfig({ miniDrawer: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>고정</Label>
                    <p className="text-xs text-muted-foreground">사이드바를 화면에 고정합니다.</p>
                  </div>
                  <Switch
                    checked={sidebarConfig.pinned}
                    onCheckedChange={(checked) => setSidebarConfig({ pinned: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 계정 설정 (로그아웃) */}
          {isAuthenticated && (
            <div className="pt-4">
              <Button
                variant="destructive"
                className="w-full h-12 rounded-xl font-bold"
                onClick={handleLogout}
              >
                <IconLogout size={20} className="mr-2" />
                로그아웃
              </Button>
            </div>
          )}

          {/* 초기화 */}
          <div className="pb-10">
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl border-dashed"
              onClick={resetToDefaults}
            >
              기본값으로 복원
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
