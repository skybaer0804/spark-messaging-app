import { Box, Flex } from '@/components/ui/layout';
import { Paper } from '@/components/ui/paper';
import { Typography } from '@/components/ui/typography';
import { formatDate } from '@/core/utils/messageUtils';
import './DateDivider.scss';

interface DateDividerProps {
  date: Date | number;
}

export function DateDivider({ date }: DateDividerProps) {
  return (
    <Flex align="center" gap="sm" className="chat-app__divider">
      <Box className="chat-app__divider-line" />
      <Paper elevation={0} padding="xs" className="chat-app__divider-badge">
        <Typography variant="caption">
          {formatDate(date)}
        </Typography>
      </Paper>
      <Box className="chat-app__divider-line" />
    </Flex>
  );
}
