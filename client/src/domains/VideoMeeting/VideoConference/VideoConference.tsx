import { useMemo } from 'preact/hooks';
import { memo } from 'preact/compat';
import { useVideoConference } from './hooks/useVideoConference';
import type { VideoConferenceAdapter } from './types';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Grid } from '@/ui-components/Layout/Grid';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { IconPlayerPlay, IconPlayerStop, IconVideo, IconVideoOff } from '@tabler/icons-preact';

interface VideoConferenceProps {
  adapter: VideoConferenceAdapter;
}

function VideoConferenceComponent({ adapter }: VideoConferenceProps) {
  const {
    localStream,
    isVideoEnabled,
    participants,
    socketId,
    localVideoRef,
    handleStartLocalStream,
    handleStopLocalStream,
    handleSetVideoRef,
    localStreamSignal,
    isVideoEnabledSignal,
    participantsSignal,
    socketIdSignal,
  } = useVideoConference(adapter);

  const effectiveLocalStream = localStreamSignal?.value ?? localStream;
  const effectiveIsVideoEnabled = isVideoEnabledSignal?.value ?? isVideoEnabled;
  const effectiveParticipants = participantsSignal?.value ?? participants;
  const effectiveSocketId = socketIdSignal?.value ?? socketId;

  // 본인 포함 모든 참가자 리스트 구성
  const allParticipants = useMemo(() => {
    const list = [...effectiveParticipants];
    const isSelfInList = list.some((p) => p.socketId === effectiveSocketId);

    if (!isSelfInList && effectiveSocketId) {
      // 본인 정보 추가
      list.unshift({
        socketId: effectiveSocketId,
        name: '나',
        role: 'demander',
        isVideoEnabled: effectiveIsVideoEnabled,
        stream: effectiveLocalStream || undefined,
      });
    } else if (isSelfInList) {
      // 이미 있으면 업데이트
      const selfIndex = list.findIndex((p) => p.socketId === effectiveSocketId);
      if (selfIndex !== -1) {
        const self = list[selfIndex];
        list.splice(selfIndex, 1);
        list.unshift({
          ...self,
          name: '나',
          isVideoEnabled: effectiveIsVideoEnabled,
          stream: effectiveLocalStream || undefined,
        });
      }
    }
    return list;
  }, [effectiveParticipants, effectiveSocketId, effectiveIsVideoEnabled, effectiveLocalStream]);

  return (
    <Box style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px' }}>
      {/* 5열 그리드를 사용하여 5개(lg=1), 1개(xs=5) 레이아웃 구현 */}
      <Grid container spacing={2} columns={5}>
        {allParticipants.map((participant) => {
          const isSelf = participant.socketId === effectiveSocketId;
          const hasVideo = participant.isVideoEnabled !== false && (isSelf ? effectiveLocalStream : participant.stream);

          return (
            <Grid key={participant.socketId} item xs={5} sm={2} lg={1} style={{ flexBasis: 'auto' }}>
              <Paper
                elevation={2}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  width: '100%',
                  aspectRatio: '1/1',
                  borderRadius: '12px',
                  backgroundColor: 'var(--color-background-tertiary, #1a1a1a)',
                  border: isSelf ? '2px solid var(--color-primary-main)' : '1px solid var(--color-border-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                {/* 비디오 화면 */}
                {hasVideo ? (
                  <video
                    ref={(el) => {
                      if (isSelf) {
                        localVideoRef.current = el;
                        if (el && effectiveSocketId) {
                          handleSetVideoRef('local', el);
                        }
                      } else {
                        handleSetVideoRef(participant.socketId, el);
                      }
                    }}
                    autoPlay
                    playsInline
                    muted={isSelf}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '10px',
                    }}
                  />
                ) : (
                  /* 아바타 화면 */
                  <Flex direction="column" align="center" justify="center" gap="sm">
                    <Box
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        backgroundColor: isSelf ? 'var(--color-primary-main)' : 'var(--color-bg-tertiary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      }}
                    >
                      {participant.name.charAt(0)}
                    </Box>
                    <Typography variant="body-medium" style={{ color: 'white' }}>
                      {participant.isVideoEnabled === false ? '영상 꺼짐' : '연결 대기 중...'}
                    </Typography>
                  </Flex>
                )}

                {/* 하단 정보 바 */}
                <Box
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 2,
                  }}
                >
                  <Typography variant="caption" style={{ color: 'white', fontWeight: 'bold' }}>
                    {participant.name} {isSelf && '(나)'}
                  </Typography>

                  <Flex gap="xs">
                    {participant.isVideoEnabled === false ? (
                      <IconVideoOff size={14} color="#ff4d4f" />
                    ) : (
                      <IconVideo size={14} color="#52c41a" />
                    )}
                  </Flex>
                </Box>

                {/* 본인 비디오 컨트롤 버튼 (오버레이) */}
                {isSelf && (
                  <Box
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      zIndex: 3,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={effectiveIsVideoEnabled ? handleStopLocalStream : handleStartLocalStream}
                      style={{
                        backgroundColor: effectiveIsVideoEnabled ? 'rgba(255, 77, 79, 0.8)' : 'rgba(82, 196, 26, 0.8)',
                        color: 'white',
                      }}
                    >
                      {effectiveIsVideoEnabled ? <IconPlayerStop size={16} /> : <IconPlayerPlay size={16} />}
                    </IconButton>
                  </Box>
                )}
              </Paper>
            </Grid>
          );
        })}

        {/* 빈 그리드 아이템 채우기 */}
        {allParticipants.length === 0 && (
          <Grid item xs={5}>
            <Paper
              elevation={0}
              style={{
                height: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--color-background-secondary)',
                border: '1px dashed var(--color-border-default)',
                borderRadius: '12px',
              }}
            >
              <Flex direction="column" align="center" gap="md">
                <IconButton onClick={handleStartLocalStream} color="primary" size="large">
                  <IconPlayerPlay size={32} />
                </IconButton>
                <Typography variant="body-medium" color="text-secondary">
                  화상회의를 시작하려면 버튼을 누르세요
                </Typography>
              </Flex>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

export const VideoConference = memo(VideoConferenceComponent, (prevProps, nextProps) => {
  return prevProps.adapter === nextProps.adapter;
});
