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
import { IconArrowLeft, IconCalendar, IconVideo, IconUsers } from '@tabler/icons-preact';
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

  // Reservation State
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    invitedUsers: [] as string[],
    invitedWorkspaces: [] as string[],
  });
  const [userList, setUserList] = useState<any[]>([]);
  const [workspaceList, setWorkspaceList] = useState<any[]>([]);

  useEffect(() => {
    if (showScheduleForm) {
      Promise.all([authApi.getUsers(), workspaceApi.getWorkspaces()]).then(([uRes, wsRes]) => {
        setUserList(uRes.data);
        setWorkspaceList(wsRes.data);
      });
    }
  }, [showScheduleForm]);

  const handleCreateRoom = async () => {
    await store.createRoom(selectedCategory, roomTitle);
  };

  const handleJoinRoom = async (room: Room) => {
    await store.joinRoom(room);
  };

  const handleScheduleMeeting = async () => {
    await store.scheduleMeeting(newMeeting);
    setShowScheduleForm(false);
  };

  if (!currentRoom) {
    return (
      <Box padding="lg" style={{ backgroundColor: 'var(--color-bg-secondary)', height: '100%', overflowY: 'auto' }}>
        <Stack spacing="xl">
          {/* Header Actions */}
          <Flex justify="space-between" align="center">
            <Typography variant="h2">화상 회의</Typography>
            <Stack direction="row" spacing="md">
              <Button variant="secondary" onClick={() => setShowScheduleForm(true)} disabled={!isConnected}>
                <IconCalendar size={18} style={{ marginRight: '8px' }} />
                회의 예약
              </Button>
              <Button variant="primary" onClick={() => store.setShowCreateForm(true)} disabled={!isConnected}>
                <IconVideo size={18} style={{ marginRight: '8px' }} />
                즉시 회의 시작
              </Button>
            </Stack>
          </Flex>

          {/* Schedule Form */}
          {showScheduleForm && (
            <Paper padding="lg" elevation={3}>
              <Stack spacing="lg">
                <Typography variant="h3">새 회의 예약</Typography>
                <Grid columns="1fr 1fr" gap="lg">
                  <Stack spacing="md">
                    <Input
                      label="회의 제목"
                      value={newMeeting.title}
                      onInput={(e) => setNewMeeting({ ...newMeeting, title: e.currentTarget.value })}
                      fullWidth
                    />
                    <Input
                      label="설명"
                      value={newMeeting.description}
                      onInput={(e) => setNewMeeting({ ...newMeeting, description: e.currentTarget.value })}
                      multiline
                      rows={2}
                      fullWidth
                    />
                    <Box>
                      <Typography
                        variant="body-small"
                        style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}
                      >
                        예약 시간
                      </Typography>
                      <input
                        type="datetime-local"
                        value={newMeeting.scheduledAt}
                        onChange={(e) => setNewMeeting({ ...newMeeting, scheduledAt: e.currentTarget.value })}
                        style={{
                          padding: '8px',
                          width: '100%',
                          borderRadius: '4px',
                          border: '1px solid var(--color-border-default)',
                        }}
                      />
                    </Box>
                  </Stack>
                  <Stack spacing="md">
                    <Typography variant="body-small" style={{ fontWeight: 600 }}>
                      참가자 초대
                    </Typography>
                    <Box
                      style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        border: '1px solid var(--color-border-default)',
                        borderRadius: '4px',
                      }}
                    >
                      <Typography
                        variant="caption"
                        style={{ backgroundColor: 'var(--color-bg-tertiary)', display: 'block', padding: '4px' }}
                      >
                        사용자
                      </Typography>
                      {userList.map((u) => (
                        <Flex key={u._id} padding="xs" align="center" gap="sm">
                          <input
                            type="checkbox"
                            checked={newMeeting.invitedUsers.includes(u._id)}
                            onChange={(e) => {
                              const ids = e.currentTarget.checked
                                ? [...newMeeting.invitedUsers, u._id]
                                : newMeeting.invitedUsers.filter((id) => id !== u._id);
                              setNewMeeting({ ...newMeeting, invitedUsers: ids });
                            }}
                          />
                          <Typography variant="body-small">{u.username}</Typography>
                        </Flex>
                      ))}
                      <Typography
                        variant="caption"
                        style={{ backgroundColor: 'var(--color-bg-tertiary)', display: 'block', padding: '4px' }}
                      >
                        워크스페이스
                      </Typography>
                      {workspaceList.map((ws) => (
                        <Flex key={ws._id} padding="xs" align="center" gap="sm">
                          <input
                            type="checkbox"
                            checked={newMeeting.invitedWorkspaces.includes(ws._id)}
                            onChange={(e) => {
                              const ids = e.currentTarget.checked
                                ? [...newMeeting.invitedWorkspaces, ws._id]
                                : newMeeting.invitedWorkspaces.filter((id) => id !== ws._id);
                              setNewMeeting({ ...newMeeting, invitedWorkspaces: ids });
                            }}
                          />
                          <Typography variant="body-small">{ws.name}</Typography>
                        </Flex>
                      ))}
                    </Box>
                  </Stack>
                </Grid>
                <Flex justify="flex-end" gap="md">
                  <Button variant="secondary" onClick={() => setShowScheduleForm(false)}>
                    취소
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleScheduleMeeting}
                    disabled={!newMeeting.title || !newMeeting.scheduledAt}
                  >
                    예약 저장
                  </Button>
                </Flex>
              </Stack>
            </Paper>
          )}

          {/* Instant Meeting Form */}
          {showCreateForm && (
            <Paper padding="lg" elevation={3}>
              <Stack spacing="lg">
                <Typography variant="h3">즉시 회의 시작</Typography>
                <Flex gap="sm">
                  {(['회의', '웨비나', '상담'] as Category[]).map((cat) => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? 'primary' : 'secondary'}
                      onClick={() => store.setSelectedCategory(cat)}
                      size="sm"
                    >
                      {cat}
                    </Button>
                  ))}
                </Flex>
                <Input
                  label="회의 제목"
                  value={roomTitle}
                  onInput={(e) => store.setRoomTitle(e.currentTarget.value)}
                  placeholder="회의 제목을 입력하세요..."
                  fullWidth
                />
                <Flex justify="flex-end" gap="md">
                  <Button variant="secondary" onClick={() => store.setShowCreateForm(false)}>
                    취소
                  </Button>
                  <Button variant="primary" onClick={handleCreateRoom} disabled={!roomTitle.trim()}>
                    생성 및 참여
                  </Button>
                </Flex>
              </Stack>
            </Paper>
          )}

          {/* Meeting Lists */}
          <Grid columns="1fr 1fr" gap="xl">
            {/* Scheduled Meetings */}
            <Stack spacing="md">
              <Typography variant="h3">예약된 회의 ({scheduledMeetings.length})</Typography>
              {scheduledMeetings.length === 0 ? (
                <Paper padding="lg" variant="outlined">
                  <Typography align="center" color="text-secondary">
                    예약된 회의가 없습니다.
                  </Typography>
                </Paper>
              ) : (
                scheduledMeetings.map((m) => (
                  <Card key={m._id}>
                    <CardHeader>
                      <Flex justify="space-between">
                        <Typography variant="h4">{m.title}</Typography>
                        <StatusChip label={m.status === 'ongoing' ? '진행중' : m.status} variant={m.status === 'ongoing' ? 'active' : 'default'} />
                      </Flex>
                      <Typography variant="caption" color="text-secondary">
                        {new Date(m.scheduledAt).toLocaleString()}
                      </Typography>
                    </CardHeader>
                    <CardBody>
                      <Typography variant="body-small">{m.description || '설명이 없습니다.'}</Typography>
                      <Typography variant="caption" style={{ marginTop: '8px', display: 'block' }}>
                        호스트: {m.hostId.username}
                      </Typography>
                    </CardBody>
                    <CardFooter>
                      <Button
                        fullWidth
                        variant={m.status === 'ongoing' ? 'primary' : 'secondary'}
                        disabled={m.status === 'cancelled'}
                      >
                        {m.status === 'ongoing' ? '지금 참여' : '상세 정보'}
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </Stack>

            {/* Active Socket Rooms */}
            <Stack spacing="md">
              <Typography variant="h3">현재 진행 중인 공개 회의 ({roomList.length})</Typography>
              {roomList.length === 0 ? (
                <Paper padding="lg" variant="outlined">
                  <Typography align="center" color="text-secondary">
                    진행 중인 공개 회의가 없습니다.
                  </Typography>
                </Paper>
              ) : (
                roomList.map((room) => (
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
                ))
              )}
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
        </Stack>
      </Box>
    </Box>
  );
}

export const VideoMeetingCore = memo(VideoMeetingCoreComponent);
