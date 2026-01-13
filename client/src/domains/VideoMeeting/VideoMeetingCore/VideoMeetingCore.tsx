import { memo } from 'preact/compat';
import { useState, useEffect } from 'preact/hooks';
import type { Category, Room } from '../types';
import type { VideoMeetingStore } from '../stores/VideoMeetingStore';
import { Button } from '@/ui-components/Button/Button';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Input } from '@/ui-components/Input/Input';
import { Box } from '@/ui-components/Layout/Box';
import { Stack } from '@/ui-components/Layout/Stack';
import { Flex } from '@/ui-components/Layout/Flex';
import { Grid } from '@/ui-components/Layout/Grid';
import { Paper } from '@/ui-components/Paper/Paper';
import { Typography } from '@/ui-components/Typography/Typography';
import { Card, CardHeader, CardBody, CardFooter } from '@/ui-components/Card/Card';
import { StatusChip } from '@/ui-components/StatusChip/StatusChip';
import { Drawer } from '@/ui-components/Drawer/Drawer';
import { Switch } from '@/ui-components/Switch/Switch';
import {
  IconArrowLeft,
  IconCalendar,
  IconVideo,
  IconUsers,
  IconLock,
  IconLockOpen,
  IconLink,
} from '@tabler/icons-preact';
import { authApi, workspaceApi } from '@/core/api/ApiService';

interface VideoMeetingCoreProps {
  store: VideoMeetingStore;
}

function VideoMeetingCoreComponent({ store }: VideoMeetingCoreProps) {
  const isConnected = store.isConnected.value;
  const userRole = store.userRole.value;
  const currentRoom = store.currentRoom.value;
  const roomList = store.roomList.value;
  const showCreateForm = store.showCreateForm.value;
  const selectedCategory = store.selectedCategory.value;
  const roomTitle = store.roomTitle.value;
  const pendingRequests = store.pendingRequests.value;
  const joinRequestStatus = store.joinRequestStatus.value;
  const scheduledMeetings = store.scheduledMeetings.value;
  const myRooms = store.getMyRooms();

  // Drawer & Form State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    isReserved: false,
    isPrivate: false,
    password: '',
    invitedUsers: [] as string[],
    invitedWorkspaces: [] as string[],
  });
  const [userList, setUserList] = useState<any[]>([]);
  const [workspaceList, setWorkspaceList] = useState<any[]>([]);

  useEffect(() => {
    if (drawerOpen) {
      Promise.all([authApi.getUsers(), workspaceApi.getWorkspaces()]).then(([uRes, wsRes]) => {
        setUserList(uRes.data);
        setWorkspaceList(wsRes.data);
      });
    }
  }, [drawerOpen]);

  const handleCreateMeeting = async () => {
    if (meetingForm.isReserved) {
      await store.scheduleMeeting(meetingForm);
    } else {
      // 즉시 회의의 경우 기본 로직 수행 (필요시 확장)
      await store.createRoom(selectedCategory, meetingForm.title);
    }
    setDrawerOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setMeetingForm({
      title: '',
      description: '',
      scheduledAt: '',
      isReserved: false,
      isPrivate: false,
      password: '',
      invitedUsers: [],
      invitedWorkspaces: [],
    });
  };

  const copyJoinLink = (hash: string) => {
    const link = `${window.location.origin}/video-meeting/join/${hash}`;
    navigator.clipboard.writeText(link);
    store.showSuccess('참여 링크가 복사되었습니다.');
  };

  const handleJoinRoom = async (room: Room) => {
    await store.joinRoom(room);
  };

  if (!currentRoom) {
    return (
      <Box padding="lg" style={{ backgroundColor: 'var(--color-bg-secondary)', height: '100%', overflowY: 'auto' }}>
        <Stack spacing="xl">
          {/* Header Actions */}
          <Flex justify="space-between" align="center">
            <Typography variant="h2">화상 회의</Typography>
            <Button variant="primary" onClick={() => setDrawerOpen(true)} disabled={!isConnected}>
              <IconVideo size={18} style={{ marginRight: '8px' }} />새 회의 만들기
            </Button>
          </Flex>

          {/* Meeting Creation Drawer */}
          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="새 회의 만들기" width="450px">
            <Stack spacing="lg" padding="md">
              <Box>
                <Stack spacing="md">
                  <Input
                    label="회의 제목"
                    value={meetingForm.title}
                    onInput={(e) => setMeetingForm({ ...meetingForm, title: e.currentTarget.value })}
                    fullWidth
                    placeholder="회의 제목을 입력하세요"
                  />
                  <Input
                    label="회의 설명"
                    value={meetingForm.description}
                    onInput={(e) => setMeetingForm({ ...meetingForm, description: e.currentTarget.value })}
                    multiline
                    rows={3}
                    fullWidth
                    placeholder="회의에 대한 설명을 입력하세요"
                  />
                </Stack>
              </Box>

              <Box>
                <Flex justify="space-between" align="center" style={{ marginBottom: '8px' }}>
                  <Typography variant="body-medium" style={{ fontWeight: 600 }}>
                    회의 예약
                  </Typography>
                  <Switch
                    checked={meetingForm.isReserved}
                    onChange={(checked) => setMeetingForm({ ...meetingForm, isReserved: checked })}
                  />
                </Flex>
                {meetingForm.isReserved && (
                  <Box style={{ marginTop: '12px' }}>
                    <Typography variant="caption" style={{ marginBottom: '4px', display: 'block' }}>
                      시작 시간
                    </Typography>
                    <input
                      type="datetime-local"
                      value={meetingForm.scheduledAt}
                      onChange={(e) => setMeetingForm({ ...meetingForm, scheduledAt: e.currentTarget.value })}
                      style={{
                        padding: '10px',
                        width: '100%',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border-default)',
                        backgroundColor: 'var(--color-bg-default)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </Box>
                )}
              </Box>

              <Box>
                <Flex justify="space-between" align="center" style={{ marginBottom: '8px' }}>
                  <Typography variant="body-medium" style={{ fontWeight: 600 }}>
                    비공개 설정 (비밀번호)
                  </Typography>
                  <Switch
                    checked={meetingForm.isPrivate}
                    onChange={(checked) => setMeetingForm({ ...meetingForm, isPrivate: checked })}
                  />
                </Flex>
                {meetingForm.isPrivate && (
                  <Input
                    type="password"
                    label="비밀번호"
                    value={meetingForm.password}
                    onInput={(e) => setMeetingForm({ ...meetingForm, password: e.currentTarget.value })}
                    fullWidth
                    placeholder="입장 시 필요한 비밀번호"
                    style={{ marginTop: '12px' }}
                  />
                )}
              </Box>

              <Box>
                <Typography variant="body-medium" style={{ fontWeight: 600, marginBottom: '12px' }}>
                  참가자 초대 (선택)
                </Typography>
                <Paper variant="outlined" style={{ maxHeight: '200px', overflowY: 'auto', padding: '0' }}>
                  <Box
                    padding="xs"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderBottom: '1px solid var(--color-border-default)',
                    }}
                  >
                    <Typography variant="caption" style={{ fontWeight: 600 }}>
                      사용자
                    </Typography>
                  </Box>
                  {userList.map((u) => (
                    <Flex
                      key={u._id}
                      padding="sm"
                      align="center"
                      gap="sm"
                      style={{ borderBottom: '1px solid var(--color-border-muted)' }}
                    >
                      <input
                        type="checkbox"
                        checked={meetingForm.invitedUsers.includes(u._id)}
                        onChange={(e) => {
                          const ids = e.currentTarget.checked
                            ? [...meetingForm.invitedUsers, u._id]
                            : meetingForm.invitedUsers.filter((id) => id !== u._id);
                          setMeetingForm({ ...meetingForm, invitedUsers: ids });
                        }}
                      />
                      <Typography variant="body-small">{u.username}</Typography>
                    </Flex>
                  ))}
                </Paper>
              </Box>

              <Flex gap="md" style={{ marginTop: '16px' }}>
                <Button variant="secondary" onClick={() => setDrawerOpen(false)} fullWidth>
                  취소
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateMeeting}
                  disabled={!meetingForm.title || (meetingForm.isReserved && !meetingForm.scheduledAt)}
                  fullWidth
                >
                  {meetingForm.isReserved ? '회의 예약' : '지금 시작'}
                </Button>
              </Flex>
            </Stack>
          </Drawer>

          {/* Meeting Lists */}
          <Grid columns="repeat(auto-fill, minmax(350px, 1fr))" gap="xl">
            {/* Scheduled Meetings */}
            <Stack spacing="md" style={{ gridColumn: '1 / -1' }}>
              <Typography variant="h3">회의 목록 ({scheduledMeetings.length})</Typography>
              {scheduledMeetings.length === 0 ? (
                <Paper padding="xl" variant="outlined" style={{ textAlign: 'center' }}>
                  <Typography color="text-secondary">아직 예약되거나 진행 중인 회의가 없습니다.</Typography>
                </Paper>
              ) : (
                <Grid columns="repeat(auto-fill, minmax(320px, 1fr))" gap="lg">
                  {scheduledMeetings.map((m) => (
                    <Card key={m._id} className="meeting-card">
                      <CardHeader>
                        <Flex justify="space-between" align="flex-start">
                          <Stack spacing="xs">
                            <Typography variant="h4">{m.title}</Typography>
                            <Flex align="center" gap="xs">
                              <IconCalendar size={14} color="var(--color-text-secondary)" />
                              <Typography variant="caption" color="text-secondary">
                                {new Date(m.scheduledAt).toLocaleString()}
                              </Typography>
                            </Flex>
                          </Stack>
                          <StatusChip
                            label={
                              m.status === 'ongoing'
                                ? '진행중'
                                : m.status === 'scheduled'
                                ? '예정'
                                : m.status === 'completed'
                                ? '종료'
                                : '취소'
                            }
                            variant={m.status === 'ongoing' ? 'active' : m.status === 'completed' ? 'default' : 'badge'}
                          />
                        </Flex>
                      </CardHeader>
                      <CardBody>
                        <Typography variant="body-small" style={{ minHeight: '40px' }}>
                          {m.description || '설명이 없습니다.'}
                        </Typography>
                        <Flex align="center" justify="space-between" style={{ marginTop: '16px' }}>
                          <Flex align="center" gap="xs">
                            <IconUsers size={14} color="var(--color-text-tertiary)" />
                            <Typography variant="caption" color="text-tertiary">
                              호스트: {m.hostId.username}
                            </Typography>
                          </Flex>
                          {m.isPrivate ? (
                            <IconLock size={14} color="var(--color-warning)" />
                          ) : (
                            <IconLockOpen size={14} color="var(--color-text-tertiary)" />
                          )}
                        </Flex>
                      </CardBody>
                      <CardFooter>
                        <Flex gap="sm" fullWidth>
                          <IconButton size="medium" onClick={() => copyJoinLink(m.joinHash)} title="참여 링크 복사">
                            <IconLink size={18} />
                          </IconButton>
                          <Button
                            fullWidth
                            variant={m.status === 'ongoing' ? 'primary' : 'secondary'}
                            disabled={m.status === 'completed' || m.status === 'cancelled'}
                          >
                            {m.status === 'ongoing' ? '지금 참여' : '상세 보기'}
                          </Button>
                        </Flex>
                      </CardFooter>
                    </Card>
                  ))}
                </Grid>
              )}
            </Stack>

            {/* Active Socket Rooms (Public Only) */}
            <Stack spacing="md" style={{ gridColumn: '1 / -1' }}>
              <Typography variant="h3">진행 중인 공개 회의 ({roomList.length})</Typography>
              <Grid columns="repeat(auto-fill, minmax(300px, 1fr))" gap="lg">
                {roomList.map((room) => (
                  <Card key={room.roomId}>
                    <CardHeader>
                      <Flex justify="space-between">
                        <StatusChip label={room.category} variant="badge" />
                        {myRooms.has(room.roomId) && <StatusChip label="내 회의실" variant="active" />}
                      </Flex>
                      <Typography variant="h4" style={{ marginTop: '8px' }}>
                        {room.title}
                      </Typography>
                    </CardHeader>
                    <CardFooter>
                      <Button fullWidth onClick={() => handleJoinRoom(room)}>
                        참여하기
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </Grid>
            </Stack>
          </Grid>
        </Stack>
      </Box>
    );
  }

  // Active Meeting View
  return (
    <Box style={{ flexShrink: 0 }} className="video-meeting-core__header">
      <Box padding="md" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
        <Stack direction="row" align="center" justify="space-between">
          <Stack direction="row" align="center" spacing="sm">
            <IconButton onClick={() => store.leaveRoom()} color="default" size="medium">
              <IconArrowLeft size={24} />
            </IconButton>
            <Typography variant="h3">{currentRoom.title}</Typography>
            <StatusChip label={currentRoom.category} variant="badge" />
          </Stack>

          {userRole === 'demander' && pendingRequests.length > 0 && (
            <Paper
              elevation={2}
              padding="sm"
              style={{ position: 'absolute', top: '60px', right: '20px', zIndex: 100, width: '300px' }}
            >
              <Stack spacing="sm">
                <Typography variant="h4">참여 요청 ({pendingRequests.length})</Typography>
                {pendingRequests.map((req) => (
                  <Paper key={req.socketId} variant="outlined" padding="sm">
                    <Typography variant="body-small">{req.name}</Typography>
                    <Flex gap="sm" style={{ marginTop: '8px' }}>
                      <Button size="sm" onClick={() => store.approveRequest(req.socketId)} fullWidth>
                        수락
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => store.rejectRequest(req.socketId)} fullWidth>
                        거절
                      </Button>
                    </Flex>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          )}

          {userRole === 'guest' && (
            <StatusChip label="게스트 모드 (관람/발언 전용)" variant="badge" style={{ marginLeft: '12px' }} />
          )}
        </Stack>
      </Box>
    </Box>
  );
}

export const VideoMeetingCore = memo(VideoMeetingCoreComponent);
