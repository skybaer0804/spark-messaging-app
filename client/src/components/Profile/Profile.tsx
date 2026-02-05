import { useState, useEffect } from 'preact/hooks';
import { useTheme } from '@/core/context/ThemeProvider';
import { MobileHeader } from '@/components/Mobile/MobileHeader';
import { Typography } from '@/ui-components/Typography/Typography';
import { Card, CardBody } from '@/ui-components/Card/Card';
import { Flex } from '@/ui-components/Layout/Flex';
import { Box } from '@/ui-components/Layout/Box';
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
} from '@tabler/icons-preact';
import { PushService } from '@/core/api/PushService';
import { WorkSpaceItem } from '../Workspace/WorkSpaceItem';
import './Profile.scss';

export function Profile() {
  const { user, updateUser, signOut } = useAuth();
  const { navigate } = useRouterState();
  const { showSuccess, showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  useEffect(() => {
    // 병렬 실행으로 성능 개선 (2-10배 빠름)
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
    <Box className="profile__body">
      <Flex direction="column" gap="sx">
        {/* 이름 섹션 */}
        <div className="profile__field">
          <Flex align="center" gap="sm" style={{ marginBottom: '4px' }}>
            <IconUser size={16} color="var(--color-text-secondary)" />
            <Typography variant="body-small" color="secondary">
              이름
            </Typography>
          </Flex>
          {isEditing ? (
            <Input
              fullWidth
              value={formData.username}
              onInput={(e) => setFormData({ ...formData, username: e.currentTarget.value })}
            />
          ) : (
            <Typography variant="body-medium" className="profile__value">
              {formData.username}
            </Typography>
          )}
        </div>

        {/* 상태 섹션 */}
        <div className="profile__field">
          <Flex align="center" gap="sm" style={{ marginBottom: '4px' }}>
            <IconMessageCircle size={16} color="var(--color-text-secondary)" />
            <Typography variant="body-small" color="secondary">
              상태
            </Typography>
          </Flex>
          {isEditing ? (
            <Flex direction="column" gap="xs">
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
            </Flex>
          ) : (
            <Box>
              <Typography variant="body-medium" className="profile__value">
                {statusOptions.find((s) => s.value === formData.status)?.label}
              </Typography>
              {formData.statusText && (
                <Typography variant="body-small" color="text-secondary" style={{ marginTop: '2px' }}>
                  {formData.statusText}
                </Typography>
              )}
            </Box>
          )}
        </div>

        {/* 권한 섹션 */}
        <div className="profile__field">
          <Flex align="center" gap="sm" style={{ marginBottom: '4px' }}>
            <IconShieldLock size={16} color="var(--color-text-secondary)" />
            <Typography variant="body-small" color="secondary">
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

        {/* 이메일 섹션 (수정 불가) */}
        <div className="profile__field">
          <Flex align="center" gap="sm" style={{ marginBottom: '4px' }}>
            <IconMail size={16} color="var(--color-text-secondary)" />
            <Typography variant="body-small" color="secondary">
              이메일
            </Typography>
          </Flex>
          <Typography variant="body-medium" className="profile__value" color="text-tertiary">
            {formData.email}
          </Typography>
        </div>

        {/* 알림 설정 섹션 */}
        <div className="profile__field">
          <Flex align="center" gap="sm" style={{ marginBottom: '4px' }}>
            <IconBell size={16} color="var(--color-text-secondary)" />
            <Typography variant="body-small" color="secondary">
              알림 설정
            </Typography>
          </Flex>
          <Box style={{ padding: '8px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '6px' }}>
            <Flex justify="space-between" align="center">
              <Box>
                <Typography variant="body-small">웹 푸시 알림</Typography>
                <Typography variant="caption" color="text-secondary">
                  {pushEnabled ? '활성화됨' : '비활성화됨'}
                </Typography>
              </Box>
              <Switch checked={pushEnabled} onChange={handleTogglePush} />
            </Flex>
          </Box>
        </div>
      </Flex>
    </Box>
  );

  const workspacesContent = (
    <Box className="profile__body">
      <Flex direction="column" gap="sm">
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
          <Box style={{ padding: '24px', textAlign: 'center' }}>
            <Typography variant="body-medium" color="text-secondary">
              소속된 워크스페이스가 없습니다.
            </Typography>
          </Box>
        )}
      </Flex>
    </Box>
  );

  const tabItems = [
    { value: 'info', label: '프로필 정보', content: profileInfoContent },
    { value: 'workspaces', label: '워크스페이스', content: workspacesContent },
  ];

  const { deviceSize } = useTheme();

  return (
    <div className="profile">
      {deviceSize === 'mobile' && <MobileHeader />}
      <div className="profile__content-wrapper">
        <Card className="profile__card">
          <CardBody>
            <Flex direction="column" gap="lg">
              <header className="profile__header">
                <Flex align="center" justify="space-between" width="100%">
                  <Flex align="center" gap="md">
                    <div style={{ position: 'relative' }}>
                      <Avatar size="xl" variant="rounded" className="profile__avatar" src={user?.profileImage}>
                        {formData.username.substring(0, 1)}
                      </Avatar>
                      <div
                        className={`avatar-status avatar-status--${formData.status}`}
                        style={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: 16,
                          height: 16,
                          border: '2px solid #fff',
                          borderRadius: '50%',
                        }}
                      />
                    </div>
                    <Box>
                      <Typography variant="h2" style={{ fontSize: '1.5rem' }}>
                        {formData.username}
                      </Typography>
                      <Typography variant="body-small" color="text-secondary">
                        {roleOptions.find((r) => r.value === formData.role)?.label || formData.role}
                      </Typography>
                    </Box>
                  </Flex>
                  {!isEditing ? (
                    <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                      <IconEdit size={18} /> 수정
                    </Button>
                  ) : (
                    <Flex gap="xs">
                      <Button variant="secondary" size="sm" onClick={() => setIsEditing(false)}>
                        취소
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleSave} disabled={loading}>
                        <IconDeviceFloppy size={18} /> 저장
                      </Button>
                    </Flex>
                  )}
                </Flex>
              </header>

              <Tabs items={tabItems} defaultValue="info" />

              <Box className="profile__logout-container">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={async () => {
                    await signOut();
                    navigate('/auth/login');
                  }}
                >
                  <IconLogout size={18} style={{ marginRight: '8px' }} /> 로그아웃
                </Button>
              </Box>
            </Flex>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
