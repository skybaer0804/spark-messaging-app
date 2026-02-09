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
import { Switch } from '@/ui-components/Switch/Switch';
import { Chip } from '@/ui-components/Chip/Chip';
import { Grid } from '@/ui-components/Layout/Grid';
import { Dialog } from '@/ui-components/Dialog/Dialog';
import { useToast } from '@/core/context/ToastContext';
import { useAuth } from '@/core/hooks/useAuth';
import { workspaceApi, authApi } from '@/core/api/ApiService';
import {
  IconPlus,
  IconKey,
  IconWorld,
  IconLock,
  IconPencil,
  IconCheck,
  IconCircleCheck,
} from '@tabler/icons-preact';
import { currentWorkspaceId, setCurrentWorkspaceId, workspacesList } from '@/stores/chatRoomsStore';
import './Workspace.scss';

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
  const [editWorkspaceData, setEditWorkspaceData] = useState({ name: '', allowPublicJoin: false, color: PRESET_COLORS[0] });
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});

  const { showSuccess, showError } = useToast();
  const isAdmin = user?.role === 'admin';

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
        allowPublicJoin: newWorkspaceAllowPublicJoin
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
    <div className="workspace">
      {deviceSize === 'mobile' && <MobileHeader />}
      <div className="workspace__scroll-container">
        <div className="workspace__container">
          <header className="workspace__header">
            <Typography variant="h2">워크스페이스 관리</Typography>
            <Typography variant="body-medium" color="text-secondary">
              워크스페이스 설정 및 회사의 조직 구조를 관리합니다.
            </Typography>
          </header>

          <Box style={{ marginTop: '24px' }}>
            <Flex direction="column" gap="lg">
              <Flex justify="space-between" align="center">
                <Typography variant="h3">워크스페이스 목록</Typography>
                {isAdmin && (
                  <Button variant="primary" size="sm" onClick={() => setShowCreateWorkspace(true)}>
                    <Flex align="center" gap="xs">
                      <IconPlus size={16} />
                      {deviceSize !== 'mobile' && ' 새 워크스페이스'}
                    </Flex>
                  </Button>
                )}
              </Flex>

              <Grid container spacing={2} columns={1}>
                {workspaces.map((ws) => (
                  <Grid item key={ws._id} xs={1}>
                    <Card style={{ height: '100%' }}>
                      <CardBody>
                        <Flex justify="space-between" align="center">
                          <Flex align="center" gap="md">
                            <Avatar style={{ backgroundColor: ws.color }}>{ws.initials}</Avatar>
                            <Box>
                              <Flex align="center" gap="xs">
                                <Typography variant="h4">{ws.name}</Typography>
                                {ws.allowPublicJoin ? (
                                  <IconWorld size={14} color="var(--color-primary)" title="누구나 참여 가능" />
                                ) : (
                                  <IconLock size={14} color="var(--color-text-secondary)" title="초대 전용" />
                                )}
                              </Flex>
                              <Typography variant="caption" color="text-secondary">
                                Created at {new Date(ws.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </Flex>
                          <Flex gap="sm" align="center">
                            {isJoined(ws._id) ? (
                              <>
                                {ws._id !== currentWorkspaceId.value ? (
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setCurrentWorkspaceId(ws._id)}
                                  >
                                    <Flex align="center" gap="xs">
                                      <IconCircleCheck size={16} /> 활성
                                    </Flex>
                                  </Button>
                                ) : (
                                  <Chip label="활성 중" variant="default" size="lg" />
                                )}
                                {(isAdmin || ws.ownerId === user?.id || !ws.ownerId) && (
                                  <Button variant="secondary" size="sm" onClick={() => handleEditWorkspace(ws)}>
                                    <Flex align="center" gap="xs">
                                      <IconPencil size={14} />
                                      {deviceSize !== 'mobile' && ' 수정'}
                                    </Flex>
                                  </Button>
                                )}
                              </>
                            ) : (
                              ws.allowPublicJoin && (
                                <Button variant="primary" size="sm" onClick={() => handleJoinWorkspace(ws._id)}>
                                  참여하기
                                </Button>
                              )
                            )}
                          </Flex>
                        </Flex>

                        {isJoined(ws._id) && ws._id === currentWorkspaceId.value && (
                          <Box
                            style={{
                              marginTop: '16px',
                              padding: '12px',
                              backgroundColor: 'var(--color-bg-secondary)',
                              borderRadius: '8px',
                            }}
                          >
                            <Typography
                              variant="body-medium"
                              color="primary"
                              style={{ marginBottom: '8px', display: 'block', fontWeight: 'bold' }}
                            >
                              연동 정보 (현재 활성)
                            </Typography>
                            <Flex direction="column" gap="sm">
                              <Flex align="center" gap="sm">
                                <IconKey size={16} color="var(--color-text-secondary)" />
                                <Typography variant="body-small" style={{ wordBreak: 'break-all' }}>
                                  <strong>Public Key:</strong> {ws.projectPublicKey}
                                </Typography>
                              </Flex>
                              <Flex align="center" gap="sm">
                                <IconLock size={16} color="var(--color-text-secondary)" />
                                <Typography variant="body-small" style={{ wordBreak: 'break-all' }}>
                                  <strong>Private Key:</strong> {revealedKeys[ws._id] || '********'}
                                </Typography>
                                {!revealedKeys[ws._id] && (
                                  <Button variant="secondary" size="sm" onClick={() => handleRevealKey(ws._id)}>
                                    조회
                                  </Button>
                                )}
                              </Flex>
                              <Flex align="center" gap="sm">
                                <IconWorld size={16} color="var(--color-text-secondary)" />
                                <Typography variant="body-small" style={{ wordBreak: 'break-all' }}>
                                  <strong>Integration URL:</strong> {ws.projectUrl || 'Not set'}
                                </Typography>
                              </Flex>
                            </Flex>
                          </Box>
                        )}
                      </CardBody>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Flex>
          </Box>

          <Dialog
            open={showCreateWorkspace}
            onClose={() => setShowCreateWorkspace(false)}
            title="새 워크스페이스 생성"
            actions={
              <Flex gap="sm">
                <Button onClick={() => setShowCreateWorkspace(false)}>취소</Button>
                <Button variant="primary" onClick={handleCreateWorkspace}>
                  생성
                </Button>
              </Flex>
            }
          >
            <Box style={{ padding: '8px 0' }}>
              <Flex direction="column" gap="md">
                <Box>
                  <Typography variant="body-medium" style={{ marginBottom: '8px', display: 'block' }}>
                    워크스페이스 이름
                  </Typography>
                  <Input
                    fullWidth
                    placeholder="예: Spark Enterprise"
                    value={newWorkspaceName}
                    onInput={(e) => setNewWorkspaceName(e.currentTarget.value)}
                  />
                </Box>
                <Box>
                  <Typography variant="body-medium" style={{ marginBottom: '8px', display: 'block' }}>
                    브랜드 컬러
                  </Typography>
                  <Flex gap="sm">
                    {PRESET_COLORS.map((color) => (
                      <div
                        key={color}
                        onClick={() => setNewWorkspaceColor(color)}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: newWorkspaceColor === color ? '2px solid var(--color-text-primary)' : 'none',
                        }}
                      >
                        {newWorkspaceColor === color && <IconCheck size={16} color="white" />}
                      </div>
                    ))}
                  </Flex>
                </Box>
                <Box>
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Typography variant="body-medium" style={{ display: 'block' }}>
                        누구나 참여 허용
                      </Typography>
                      <Typography variant="caption" color="text-secondary" style={{ display: 'block', marginTop: '4px' }}>
                        체크하면 다른 사용자가 초대 없이 워크스페이스에 참여할 수 있습니다.
                      </Typography>
                    </Box>
                    <Switch
                      checked={newWorkspaceAllowPublicJoin}
                      onChange={(checked) => setNewWorkspaceAllowPublicJoin(checked)}
                    />
                  </Flex>
                </Box>
              </Flex>
            </Box>
          </Dialog>

          <Dialog
            open={showEditWorkspace}
            onClose={() => setShowEditWorkspace(false)}
            title="워크스페이스 수정"
            actions={
              <Flex gap="sm">
                <Button onClick={() => setShowEditWorkspace(false)}>취소</Button>
                <Button variant="primary" onClick={handleUpdateWorkspace}>
                  저장
                </Button>
              </Flex>
            }
          >
            <Box style={{ padding: '8px 0' }}>
              <Flex direction="column" gap="md">
                <Box>
                  <Typography variant="body-medium" style={{ marginBottom: '8px', display: 'block' }}>
                    워크스페이스 이름
                  </Typography>
                  <Input
                    fullWidth
                    value={editWorkspaceData.name}
                    onInput={(e) => setEditWorkspaceData({ ...editWorkspaceData, name: e.currentTarget.value })}
                  />
                </Box>
                <Box>
                  <Typography variant="body-medium" style={{ marginBottom: '8px', display: 'block' }}>
                    브랜드 컬러
                  </Typography>
                  <Flex gap="sm">
                    {PRESET_COLORS.map((color) => (
                      <div
                        key={color}
                        onClick={() => setEditWorkspaceData({ ...editWorkspaceData, color })}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: editWorkspaceData.color === color ? '2px solid var(--color-text-primary)' : 'none',
                        }}
                      >
                        {editWorkspaceData.color === color && <IconCheck size={16} color="white" />}
                      </div>
                    ))}
                  </Flex>
                </Box>
                <Box>
                  <Flex justify="space-between" align="center">
                    <Box>
                      <Typography variant="body-medium" style={{ display: 'block' }}>
                        누구나 참여 허용
                      </Typography>
                      <Typography variant="caption" color="text-secondary" style={{ display: 'block', marginTop: '4px' }}>
                        체크하면 다른 사용자가 초대 없이 워크스페이스에 참여할 수 있습니다.
                      </Typography>
                    </Box>
                    <Switch
                      checked={editWorkspaceData.allowPublicJoin}
                      onChange={(checked) => setEditWorkspaceData({ ...editWorkspaceData, allowPublicJoin: checked })}
                    />
                  </Flex>
                </Box>
              </Flex>
            </Box>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
