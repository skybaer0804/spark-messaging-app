import { useState, useEffect } from 'preact/hooks';
import { Typography } from '@/ui-components/Typography/Typography';
import { Card, CardBody } from '@/ui-components/Card/Card';
import { Flex } from '@/ui-components/Layout/Flex';
import { Box } from '@/ui-components/Layout/Box';
import { List, ListItem, ListItemText, ListItemAvatar } from '@/ui-components/List/List';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Button } from '@/ui-components/Button/Button';
import { Input } from '@/ui-components/Input/Input';
import { Tabs, Tab } from '@/ui-components/Tabs/Tabs';
import { Dialog } from '@/ui-components/Dialog/Dialog';
import { useToast } from '@/core/context/ToastContext';
import { workspaceApi } from '@/core/api/ApiService';
import { IconSettings, IconUsers, IconHierarchy, IconPlus, IconKey, IconWorld, IconLock } from '@tabler/icons-preact';
import { currentWorkspaceId } from '@/stores/chatRoomsStore';
import './Organization.scss';

export function Organization() {
  const [activeTab, setActiveTab] = useState('workspace');
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [structure, setStructure] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  
  const { showSuccess, showError } = useToast();

  const handleRevealKey = async (workspaceId: string) => {
    try {
      const res = await workspaceApi.getPrivateKey(workspaceId);
      setRevealedKeys(prev => ({ ...prev, [workspaceId]: res.data.privateKey }));
    } catch (err) {
      showError('비밀키 조회 권한이 없습니다.');
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await workspaceApi.getWorkspaces();
      setWorkspaces(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStructure = async () => {
    if (!currentWorkspaceId.value) return;
    try {
      const res = await workspaceApi.getWorkspaceStructure(currentWorkspaceId.value);
      setStructure(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (activeTab === 'structure') {
      fetchStructure();
    }
  }, [activeTab, currentWorkspaceId.value]);

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    try {
      await workspaceApi.createWorkspace({ name: newWorkspaceName });
      showSuccess('워크스페이스가 생성되었습니다.');
      setShowCreateWorkspace(false);
      setNewWorkspaceName('');
      fetchWorkspaces();
    } catch (err) {
      showError('생성 실패');
    }
  };

  const currentWS = workspaces.find(w => w._id === currentWorkspaceId.value);

  return (
    <div className="organization">
      <header className="organization__header">
        <Typography variant="h2">조직 및 워크스페이스 관리</Typography>
        <Typography variant="body-medium" color="text-secondary">
          워크스페이스 설정 및 회사의 조직 구조를 관리합니다.
        </Typography>
      </header>

      <Box style={{ marginTop: '24px' }}>
        <Tabs value={activeTab} onChange={(val) => setActiveTab(val)}>
          <Tab value="workspace" label="워크스페이스" icon={<IconSettings size={18} />} />
          <Tab value="structure" label="조직도 관리" icon={<IconHierarchy size={18} />} />
          <Tab value="members" label="멤버 관리" icon={<IconUsers size={18} />} />
        </Tabs>
      </Box>

      <div className="organization__content" style={{ marginTop: '20px' }}>
        {activeTab === 'workspace' && (
          <Flex direction="column" gap="lg">
            <Flex justify="space-between" align="center">
              <Typography variant="h3">워크스페이스 목록</Typography>
              <Button variant="primary" size="sm" startIcon={<IconPlus />} onClick={() => setShowCreateWorkspace(true)}>
                새 워크스페이스
              </Button>
            </Flex>

            <Flex direction="column" gap="md">
              {workspaces.map((ws) => (
                <Card key={ws._id} variant="outlined">
                  <CardBody>
                    <Flex justify="space-between" align="center">
                      <Flex align="center" gap="md">
                        <Avatar style={{ backgroundColor: ws.color }}>{ws.initials}</Avatar>
                        <Box>
                          <Typography variant="h4">{ws.name}</Typography>
                          <Typography variant="caption" color="text-secondary">
                            Created at {new Date(ws.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Flex>
                      <Flex gap="sm">
                        <Button variant="secondary" size="sm">설정</Button>
                      </Flex>
                    </Flex>
                    
                    {ws._id === currentWorkspaceId.value && (
                      <Box style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                        <Typography variant="label-medium" color="primary" style={{ marginBottom: '8px', display: 'block' }}>
                          연동 정보 (현재 활성)
                        </Typography>
                        <Flex direction="column" gap="sm">
                          <Flex align="center" gap="sm">
                            <IconKey size={16} color="var(--color-text-secondary)" />
                            <Typography variant="body-small"><strong>Public Key:</strong> {ws.projectPublicKey}</Typography>
                          </Flex>
                          <Flex align="center" gap="sm">
                            <IconLock size={16} color="var(--color-text-secondary)" />
                            <Typography variant="body-small">
                              <strong>Private Key:</strong> {revealedKeys[ws._id] || '********'}
                            </Typography>
                            {!revealedKeys[ws._id] && (
                              <Button variant="text" size="xs" onClick={() => handleRevealKey(ws._id)}>조회</Button>
                            )}
                          </Flex>
                          <Flex align="center" gap="sm">
                            <IconWorld size={16} color="var(--color-text-secondary)" />
                            <Typography variant="body-small"><strong>Integration URL:</strong> {ws.projectUrl || 'Not set'}</Typography>
                          </Flex>
                        </Flex>
                      </Box>
                    )}
                  </CardBody>
                </Card>
              ))}
            </Flex>
          </Flex>
        )}

        {activeTab === 'structure' && (
          <Flex direction="column" gap="lg">
            <Flex justify="space-between" align="center">
              <Typography variant="h3">조직도 (회사 및 부서)</Typography>
              <Flex gap="sm">
                <Button variant="secondary" size="sm" startIcon={<IconPlus />}>회사 추가</Button>
                <Button variant="primary" size="sm" startIcon={<IconPlus />}>부서 추가</Button>
              </Flex>
            </Flex>

            {structure.length === 0 ? (
              <Card variant="outlined" style={{ padding: '40px', textAlign: 'center' }}>
                <Typography color="text-secondary">등록된 회사나 부서 정보가 없습니다.</Typography>
              </Card>
            ) : (
              <Flex direction="column" gap="md">
                {structure.map((company) => (
                  <Card key={company._id} variant="outlined">
                    <CardBody>
                      <Typography variant="h4" style={{ marginBottom: '12px' }}>{company.name}</Typography>
                      <List>
                        {company.departments?.map((dept: any) => (
                          <ListItem key={dept._id} style={{ paddingLeft: '24px' }}>
                            <ListItemAvatar>
                              <IconHierarchy size={18} />
                            </ListItemAvatar>
                            <ListItemText primary={dept.name} secondary={`${dept.order}순위`} />
                          </ListItem>
                        ))}
                        {(!company.departments || company.departments.length === 0) && (
                          <Typography variant="caption" color="text-secondary" style={{ marginLeft: '24px' }}>
                            부서 정보가 없습니다.
                          </Typography>
                        )}
                      </List>
                    </CardBody>
                  </Card>
                ))}
              </Flex>
            )}
          </Flex>
        )}

        {activeTab === 'members' && (
          <Flex direction="column" gap="lg">
            <Typography variant="h3">멤버 관리</Typography>
            <Typography color="text-secondary">준비 중인 기능입니다.</Typography>
          </Flex>
        )}
      </div>

      <Dialog 
        open={showCreateWorkspace} 
        onClose={() => setShowCreateWorkspace(false)}
        title="새 워크스페이스 생성"
        actions={
          <Flex gap="sm">
            <Button onClick={() => setShowCreateWorkspace(false)}>취소</Button>
            <Button variant="primary" onClick={handleCreateWorkspace}>생성</Button>
          </Flex>
        }
      >
        <Box style={{ padding: '8px 0' }}>
          <Typography variant="label-medium" style={{ marginBottom: '8px', display: 'block' }}>워크스페이스 이름</Typography>
          <Input 
            fullWidth 
            placeholder="예: Spark Enterprise" 
            value={newWorkspaceName} 
            onInput={(e) => setNewWorkspaceName(e.currentTarget.value)}
          />
        </Box>
      </Dialog>
    </div>
  );
}
