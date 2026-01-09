import { useState, useEffect } from 'preact/hooks';
import { Typography } from '@/ui-components/Typography/Typography';
import { Card, CardBody } from '@/ui-components/Card/Card';
import { Flex } from '@/ui-components/Layout/Flex';
import { Box } from '@/ui-components/Layout/Box';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Button } from '@/ui-components/Button/Button';
import { Input } from '@/ui-components/Input/Input';
import { Select } from '@/ui-components/Select/Select';
import { useAuth } from '@/core/hooks/useAuth';
import { useToast } from '@/core/context/ToastContext';
import { authApi } from '@/core/api/ApiService';
import { IconUser, IconMail, IconDeviceFloppy, IconEdit, IconMessageCircle, IconHierarchy } from '@tabler/icons-preact';
import './Profile.scss';

export function Profile() {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    status: user?.status || 'offline',
    statusText: user?.statusText || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        status: user.status || 'offline',
        statusText: user.statusText || '',
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

  return (
    <div className="profile">
      <Card className="profile__card">
        <CardBody>
          <Flex direction="column" gap="xl">
            <header className="profile__header">
              <Flex align="center" justify="space-between" fullWidth>
                <Flex align="center" gap="lg">
                  <div style={{ position: 'relative' }}>
                    <Avatar size="xl" className="profile__avatar" src={user?.profileImage}>
                      {formData.username.substring(0, 1)}
                    </Avatar>
                    <div className={`avatar-status avatar-status--${formData.status}`} 
                         style={{ position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, border: '3px solid #fff' }} />
                  </div>
                  <Box>
                    <Typography variant="h2">{formData.username}</Typography>
                    <Typography variant="body-medium" color="text-secondary">
                      {user?.role} Account
                    </Typography>
                  </Box>
                </Flex>
                {!isEditing ? (
                  <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
                    <IconEdit size={18} /> 수정하기
                  </Button>
                ) : (
                  <Flex gap="sm">
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

            <Box className="profile__body">
              <Flex direction="column" gap="lg">
                {/* 이름 섹션 */}
                <div className="profile__field">
                  <Flex align="center" gap="sm" style={{ marginBottom: '8px' }}>
                    <IconUser size={18} color="var(--color-text-secondary)" />
                    <Typography variant="label-medium" color="secondary">이름</Typography>
                  </Flex>
                  {isEditing ? (
                    <Input
                      fullWidth
                      value={formData.username}
                      onInput={(e) => setFormData({ ...formData, username: e.currentTarget.value })}
                    />
                  ) : (
                    <Typography variant="body-large" className="profile__value">{formData.username}</Typography>
                  )}
                </div>

                {/* 상태 섹션 */}
                <div className="profile__field">
                  <Flex align="center" gap="sm" style={{ marginBottom: '8px' }}>
                    <IconMessageCircle size={18} color="var(--color-text-secondary)" />
                    <Typography variant="label-medium" color="secondary">상태</Typography>
                  </Flex>
                  {isEditing ? (
                    <Flex direction="column" gap="sm">
                      <Select
                        fullWidth
                        options={statusOptions}
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: (e.currentTarget as HTMLSelectElement).value })}
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
                      <Typography variant="body-large" className="profile__value">
                        {statusOptions.find(s => s.value === formData.status)?.label}
                      </Typography>
                      {formData.statusText && (
                        <Typography variant="body-medium" color="text-secondary" style={{ marginTop: '4px' }}>
                          {formData.statusText}
                        </Typography>
                      )}
                    </Box>
                  )}
                </div>

                {/* 이메일 섹션 (수정 불가) */}
                <div className="profile__field">
                  <Flex align="center" gap="sm" style={{ marginBottom: '8px' }}>
                    <IconMail size={18} color="var(--color-text-secondary)" />
                    <Typography variant="label-medium" color="secondary">이메일</Typography>
                  </Flex>
                  <Typography variant="body-large" className="profile__value" color="text-tertiary">
                    {formData.email}
                  </Typography>
                </div>

                {/* 소속 섹션 (수정 불가) */}
                <div className="profile__field">
                  <Flex align="center" gap="sm" style={{ marginBottom: '8px' }}>
                    <IconHierarchy size={18} color="var(--color-text-secondary)" />
                    <Typography variant="label-medium" color="secondary">소속 정보</Typography>
                  </Flex>
                  <Box style={{ padding: '12px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                    <Typography variant="body-medium">
                      {user?.companyId ? '회사 정보 로딩 중...' : '소속된 회사가 없습니다.'}
                    </Typography>
                    <Typography variant="caption" color="text-secondary" style={{ display: 'block', marginTop: '4px' }}>
                      관리자에게 문의하여 조직에 가입하세요.
                    </Typography>
                  </Box>
                </div>
              </Flex>
            </Box>
          </Flex>
        </CardBody>
      </Card>
    </div>
  );
}
