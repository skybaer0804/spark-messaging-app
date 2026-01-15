import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconMessageCircle, IconRocket } from '@tabler/icons-preact';

export const ChatEmptyState = () => (
  <Box className="chat-app__empty-state">
    <div className="chat-app__empty-state-hero">
      <Stack align="center" spacing="sm">
        <Flex align="center" gap="xs" className="chat-app__empty-state-badge">
          <IconMessageCircle size={16} />
          <Typography variant="body-small">실시간 메시징</Typography>
        </Flex>
        <div className="chat-app__empty-state-icon-wrapper">
          <IconRocket size={40} />
        </div>
        <Typography variant="h1" className="chat-app__empty-state-title">
          Start <span className="highlight">Messaging</span>
        </Typography>
        <Typography variant="body-large" className="chat-app__empty-state-desc">
          사이드바에서 대화방을 선택하거나 검색하여
          <br />
          팀원들과 실시간으로 소통을 시작해보세요.
        </Typography>
      </Stack>
    </div>
  </Box>
);
