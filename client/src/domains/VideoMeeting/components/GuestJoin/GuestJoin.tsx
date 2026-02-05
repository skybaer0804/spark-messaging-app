import { useState, useEffect } from 'preact/hooks';
import { videoMeetingApi } from '@/core/api/ApiService';
import { Box } from '@/ui-components/Layout/Box';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { Input } from '@/ui-components/Input/Input';
import { Button } from '@/ui-components/Button/Button';
import { Paper } from '@/ui-components/Paper/Paper';
import { IconLock, IconUser, IconVideo } from '@tabler/icons-preact';
import { useToast } from '@/core/context/ToastContext';
import { route } from 'preact-router';

interface GuestJoinProps {
  hash: string;
}

export function GuestJoin({ hash }: GuestJoinProps) {
  const toast = useToast();
  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    fetchMeeting();
  }, [hash]);

  const fetchMeeting = async () => {
    try {
      const res = await videoMeetingApi.getMeetingByHash(hash);
      setMeeting(res.data);
    } catch (error) {
      toast.showError('회의 정보를 가져오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    let finalNickname = nickname.trim();
    if (!finalNickname) {
      finalNickname = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
      setNickname(finalNickname);
    }

    if (meeting.isPrivate) {
      try {
        setIsVerifying(true);
        await videoMeetingApi.verifyMeetingPassword(hash, password);
      } catch (error) {
        toast.showError('비밀번호가 일치하지 않습니다.');
        setIsVerifying(false);
        return;
      }
    }

    // 게스트 정보 저장
    sessionStorage.setItem('guest_nickname', finalNickname);
    sessionStorage.setItem('guest_meeting_hash', hash);

    // 실제 회의 화면으로 이동
    route(`/video-meeting?join=${hash}`);
  };

  if (loading)
    return (
      <Box padding="xl">
        <Typography>로딩 중...</Typography>
      </Box>
    );
  if (!meeting)
    return (
      <Box padding="xl">
        <Typography>회의를 찾을 수 없습니다.</Typography>
      </Box>
    );

  return (
    <Box
      className="guest-join"
      style={{
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg-secondary)',
      }}
    >
      <Paper padding="xl" elevation={3} style={{ width: '100%', maxWidth: '400px' }}>
        <Stack spacing="xl">
          <Box style={{ textAlign: 'center' }}>
            <Box
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <IconVideo size={32} color="var(--color-primary)" />
            </Box>
            <Typography variant="h2">{meeting.title}</Typography>
            <Typography variant="body-small" color="text-secondary">
              {meeting.description}
            </Typography>
          </Box>

          <Stack spacing="md">
            <Input
              label="사용할 닉네임"
              value={nickname}
              onInput={(e) => setNickname(e.currentTarget.value)}
              placeholder="닉네임을 입력하세요 (미입력 시 자동생성)"
              startAdornment={<IconUser size={18} />}
              fullWidth
            />

            {meeting.isPrivate && (
              <Input
                type="password"
                label="회의 비밀번호"
                value={password}
                onInput={(e) => setPassword(e.currentTarget.value)}
                placeholder="비밀번호를 입력하세요"
                startAdornment={<IconLock size={18} />}
                fullWidth
              />
            )}
          </Stack>

          <Button variant="primary" fullWidth size="lg" onClick={handleJoin} disabled={isVerifying}>
            {isVerifying ? '확인 중...' : '회의 참여하기'}
          </Button>

          <Typography variant="caption" align="center" color="text-tertiary">
            회원은 로그인 후 참여하면 더 많은 기능을 사용할 수 있습니다.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
