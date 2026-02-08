import { useState, useEffect } from 'preact/hooks';
import { useTheme, PresetColor } from '@/core/context/ThemeProvider';
import { MobileHeader } from '@/components/Mobile/MobileHeader';
import { Typography } from '@/ui-components/Typography/Typography';
import { Card, CardBody } from '@/ui-components/Card/Card';
import { Flex } from '@/ui-components/Layout/Flex';
import { Box } from '@/ui-components/Layout/Box';
import { Stack } from '@/ui-components/Layout/Stack';
import { Paper } from '@/ui-components/Paper/Paper';
import { Divider } from '@/ui-components/Divider/Divider';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Button } from '@/ui-components/Button/Button';
import { Input } from '@/ui-components/Input/Input';
import { Select } from '@/ui-components/Select/Select';
import { Tabs } from '@/ui-components/Tabs/Tabs';
import { Switch } from '@/ui-components/Switch/Switch';
import { useAuth } from '@/core/hooks/useAuth';
import { useRouterState } from '@/routes/RouterState';
import { useToast } from '@/core/context/ToastContext';
import { authApi, workspaceApi } from '@/core/api/ApiService';
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
} from '@tabler/icons-preact';
import { PushService } from '@/core/api/PushService';
import { WorkSpaceItem } from '../Workspace/WorkSpaceItem';
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
    sidebarConfig,
    setSidebarConfig,
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

  const profileInfoContent = (
    <Box className="profile-tab-content fade-up">
      <Stack spacing="lg">
        <Paper elevation={0} className="profile__info-card">
          <Stack spacing="xl">
            {/* 이름 섹션 */}
            <div className="profile__field">
              <Flex align="center" gap="sm" style={{ marginBottom: '8px' }}>
                <IconUser size={16} color="var(--color-interactive-primary)" />
                <Typography variant="body-small" color="secondary" style={{ fontWeight: 600 }}>
                  이름
                </Typography>
              </Flex>
              {isEditing ? (
                <Input
                  fullWidth
                  value={formData.username}
                  onInput={(e) => setFormData({ ...formData, username: e.currentTarget.value })}
                  placeholder="이름을 입력하세요"
                />
              ) : (
                <Typography variant="body-medium" className="profile__value">
                  {formData.username}
                </Typography>
              )}
            </div>

            <Divider />

            {/* 상태 섹션 */}
            <div className="profile__field">
              <Flex align="center" gap="sm" style={{ marginBottom: '8px' }}>
                <IconMessageCircle size={16} color="var(--color-interactive-primary)" />
                <Typography variant="body-small" color="secondary" style={{ fontWeight: 600 }}>
                  상태 및 메시지
                </Typography>
              </Flex>
              {isEditing ? (
                <Stack spacing="xs">
                  <Select
                    fullWidth
                    options={statusOptions}
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: (e.currentTarget as HTMLSelectElement).value as any })
                    }
                  />
                  <Input
                    fullWidth
                    placeholder="상태 메시지 입력"
                    value={formData.statusText}
                    onInput={(e) => setFormData({ ...formData, statusText: e.currentTarget.value })}
                  />
                </Stack>
              ) : (
                <Box>
                  <Typography variant="body-medium" className="profile__value">
                    {statusOptions.find((s) => s.value === formData.status)?.label}
                  </Typography>
                  {formData.statusText && (
                    <Typography variant="body-small" color="text-secondary" style={{ marginTop: '4px' }}>
                      {formData.statusText}
                    </Typography>
                  )}
                </Box>
              )}
            </div>

            <Divider />

            {/* 권한 섹션 */}
            <div className="profile__field">
              <Flex align="center" gap="sm" style={{ marginBottom: '8px' }}>
                <IconShieldLock size={16} color="var(--color-interactive-primary)" />
                <Typography variant="body-small" color="secondary" style={{ fontWeight: 600 }}>
                  권한
                </Typography>
              </Flex>
              {isEditing ? (
                <Select
                  fullWidth
                  options={roleOptions}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: (e.currentTarget as HTMLSelectElement).value as any })}
                />
              ) : (
                <Typography variant="body-medium" className="profile__value">
                  {roleOptions.find((r) => r.value === formData.role)?.label || formData.role}
                </Typography>
              )}
            </div>

            <Divider />

            {/* 이메일 섹션 (수정 불가) */}
            <div className="profile__field">
              <Flex align="center" gap="sm" style={{ marginBottom: '8px' }}>
                <IconMail size={16} color="var(--color-interactive-primary)" />
                <Typography variant="body-small" color="secondary" style={{ fontWeight: 600 }}>
                  이메일 (수정 불가)
                </Typography>
              </Flex>
              <Typography variant="body-medium" className="profile__value" color="text-tertiary">
                {formData.email}
              </Typography>
            </div>

            <Divider />

            {/* 알림 설정 섹션 */}
            <div className="profile__field">
              <Flex align="center" gap="sm" style={{ marginBottom: '8px' }}>
                <IconBell size={16} color="var(--color-interactive-primary)" />
                <Typography variant="body-small" color="secondary" style={{ fontWeight: 600 }}>
                  알림 설정
                </Typography>
              </Flex>
              <Box style={{ padding: '12px', backgroundColor: 'var(--color-background-secondary)', borderRadius: '12px' }}>
                <Flex justify="space-between" align="center">
                  <Box>
                    <Typography variant="body-medium" style={{ fontWeight: 500 }}>웹 푸시 알림</Typography>
                    <Typography variant="caption" color="text-secondary">
                      {pushEnabled ? '활성화됨' : '비활성화됨'}
                    </Typography>
                  </Box>
                  <Switch checked={pushEnabled} onChange={handleTogglePush} />
                </Flex>
              </Box>
            </div>
          </Stack>
        </Paper>

        {/* 수정 버튼 - 탭 하단에 위치 */}
        <Box className="profile__tab-actions">
          {!isEditing ? (
            <Button variant="primary" fullWidth onClick={() => setIsEditing(true)}>
              <IconEdit size={18} style={{ marginRight: '8px' }} /> 프로필 수정하기
            </Button>
          ) : (
            <Flex gap="sm">
              <Button variant="secondary" style={{ flex: 1 }} onClick={() => setIsEditing(false)}>
                취소
              </Button>
              <Button variant="primary" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
                <IconDeviceFloppy size={18} style={{ marginRight: '8px' }} /> 저장하기
              </Button>
            </Flex>
          )}
        </Box>
      </Stack>
    </Box>
  );

  const workspacesContent = (
    <Box className="profile-tab-content fade-up">
      <Stack spacing="md">
        {workspaces.length > 0 ? (
          workspaces.map((ws) => (
            <WorkSpaceItem
              key={ws._id}
              id={ws._id}
              name={ws.name}
              description={ws.description}
              color={ws.color}
              initials={ws.initials}
              onClick={() => navigate(`/workspace/${ws._id}`)}
            />
          ))
        ) : (
          <Box style={{ padding: '40px', textAlign: 'center', backgroundColor: 'var(--color-background-primary)', borderRadius: '16px', border: '1px dashed var(--color-border-default)' }}>
            <Typography variant="body-medium" color="text-secondary">
              소속된 워크스페이스가 없습니다.
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );

  const themeSettingsContent = (
    <Box className="profile-tab-content fade-up">
      <Stack spacing="lg">
        {/* 테마 모드 */}
        <Paper elevation={0} className="theme-settings-card">
          <Stack spacing="md">
            <Flex align="center" gap="sm">
              <IconPalette size={20} color="var(--color-interactive-primary)" />
              <Typography variant="h4">테마 모드</Typography>
            </Flex>
            <Divider />
            <Flex align="center" justify="space-between">
              <Box>
                <Typography variant="body-medium" style={{ fontWeight: 600 }}>다크 모드</Typography>
                <Typography variant="caption" color="text-secondary">어두운 환경에서 눈의 피로를 줄여줍니다.</Typography>
              </Box>
              <Switch
                checked={theme === 'dark'}
                onChange={(checked) => checked !== (theme === 'dark') && toggleTheme()}
              />
            </Flex>
            <Flex align="center" justify="space-between">
              <Box>
                <Typography variant="body-medium" style={{ fontWeight: 600 }}>고대비 모드</Typography>
                <Typography variant="caption" color="text-secondary">텍스트와 요소의 구분을 명확하게 합니다.</Typography>
              </Box>
              <Switch
                checked={contrast === 'high'}
                onChange={(checked) => checked !== (contrast === 'high') && toggleContrast()}
              />
            </Flex>
          </Stack>
        </Paper>

        {/* 강조 색상 */}
        <Paper elevation={0} className="theme-settings-card">
          <Stack spacing="md">
            <Flex align="center" gap="sm">
              <IconColorSwatch size={20} color="var(--color-interactive-primary)" />
              <Typography variant="h4">강조 색상</Typography>
            </Flex>
            <Divider />
            <div className="theme-preset-grid">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.value}
                  className={`theme-preset-btn ${presetColor === preset.value ? 'is-active' : ''}`}
                  onClick={() => setPresetColor(preset.value)}
                >
                  <div className={`theme-preset-circle theme-preset-circle--${preset.value}`} />
                  <Typography variant="caption">{preset.label}</Typography>
                </button>
              ))}
            </div>
          </Stack>
        </Paper>

        {/* 레이아웃 설정 */}
        <Paper elevation={0} className="theme-settings-card">
          <Stack spacing="md">
            <Flex align="center" gap="sm">
              <IconShape size={20} color="var(--color-interactive-primary)" />
              <Typography variant="h4">레이아웃 및 모양</Typography>
            </Flex>
            <Divider />
            <Box>
              <Flex align="center" justify="space-between" style={{ marginBottom: '12px' }}>
                <Typography variant="body-medium" style={{ fontWeight: 600 }}>모서리 둥글기</Typography>
                <Typography variant="body-small">{localBorderRadius}px</Typography>
              </Flex>
              <input
                type="range"
                min="0"
                max="16"
                value={localBorderRadius}
                onInput={(e) => handleBorderRadiusChange(Number((e.target as HTMLInputElement).value))}
                className="theme-radius-slider"
              />
              <div className="theme-radius-preview" style={{ borderRadius: `${localBorderRadius}px` }}>
                <Typography variant="body-small">버튼 모양 미리보기</Typography>
              </div>
            </Box>
            <Divider />
            <Flex align="center" justify="space-between">
              <Box>
                <Typography variant="body-medium" style={{ fontWeight: 600 }}>미니 사이드바</Typography>
                <Typography variant="caption" color="text-secondary">아이콘만 표시하여 더 넓은 화면을 사용합니다.</Typography>
              </Box>
              <Switch
                checked={sidebarConfig.miniDrawer}
                onChange={(checked) => setSidebarConfig({ miniDrawer: checked })}
              />
            </Flex>
          </Stack>
        </Paper>

        {/* 초기화 */}
        <Box style={{ marginTop: '8px' }}>
          <Button variant="secondary" fullWidth onClick={resetToDefaults}>
            테마 초기화
          </Button>
        </Box>
      </Stack>
    </Box>
  );

  const tabItems = [
    { value: 'info', label: '프로필 정보', content: profileInfoContent },
    { value: 'workspaces', label: '워크스페이스', content: workspacesContent },
    { value: 'theme', label: '테마 설정', content: themeSettingsContent },
  ];

  return (
    <div className="profile-app">
      {deviceSize === 'mobile' && <MobileHeader />}

      <div className="profile-app__container">
        {/* Hero Section */}
        <header className="profile-app__hero">
          <Box className="profile-app__badge">Account Settings</Box>
          <Typography variant="h1" className="profile-app__title">
            사용자 <span className="highlight">설정</span>
          </Typography>
          <Typography variant="body-large" color="text-secondary" className="profile-app__desc">
            개인 프로필과 워크스페이스, 그리고 나만의 테마를 여기서 관리하세요.
          </Typography>
        </header>

        {/* Profile Header (Basic Info) */}
        <Card className="profile-app__header-card">
          <CardBody>
            <Flex align="center" gap="lg">
              <div style={{ position: 'relative' }}>
                <Avatar size="xl" variant="rounded" className="profile-app__avatar" src={user?.profileImage}>
                  {formData.username.substring(0, 1)}
                </Avatar>
                <div className={`avatar-status-dot avatar-status-dot--${formData.status}`} />
              </div>
              <Box>
                <Typography variant="h2" style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                  {formData.username}
                </Typography>
                <Typography variant="body-medium" color="text-secondary">
                  {formData.email}
                </Typography>
              </Box>
            </Flex>
          </CardBody>
        </Card>

        {/* Main Content (Tabs) */}
        <div className="profile-app__tabs-wrapper">
          <Tabs items={tabItems} defaultValue="info" />
        </div>

        {/* Footer (Logout) */}
        <footer className="profile-app__footer">
          <Divider style={{ marginBottom: '24px' }} />
          <Button
            variant="secondary"
            fullWidth
            onClick={async () => {
              await signOut();
              navigate('/login');
            }}
            className="logout-btn"
          >
            <IconLogout size={18} style={{ marginRight: '8px' }} /> 로그아웃
          </Button>
          <Typography variant="caption" color="text-tertiary" style={{ display: 'block', textAlign: 'center', marginTop: '16px' }}>
            © 2026 Spark Messaging. All rights reserved.
          </Typography>
        </footer>
      </div>
    </div>
  );
}
