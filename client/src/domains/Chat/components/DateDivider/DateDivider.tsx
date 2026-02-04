import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Paper } from '@/ui-components/Paper/Paper';
import { Typography } from '@/ui-components/Typography/Typography';
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
