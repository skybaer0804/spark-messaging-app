import { Badge } from '@/components/ui/badge';
import { Flex } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import { IconMail, IconBell } from '@tabler/icons-preact';
import type { DesignSystemExampleDefinition } from './types';

const exampleData = {
  unread: 4,
  total: 120,
};

const usageCode = `import { Badge } from '@/components/ui/badge';
import { IconMail } from '@tabler/icons-preact';

<Badge badgeContent={4} color="error">
  <IconMail size={24} />
</Badge>
`;

export const badgeExample: DesignSystemExampleDefinition = {
  id: 'badge',
  label: 'Badge',
  description: '아이콘/요소에 상태(개수/점)를 덧씌워 표시합니다.',
  usageCode,
  Example: () => (
    <Flex gap="lg" align="center" wrap="wrap">
      <Badge badgeContent={exampleData.unread} color="error">
        <IconMail size={24} />
      </Badge>
      <Badge badgeContent={exampleData.total} color="primary">
        <IconMail size={24} />
      </Badge>
      <Badge variant="dot" color="success">
        <IconBell size={24} />
      </Badge>
      <Typography variant="caption" color="text-secondary">
        예시 데이터: unread={exampleData.unread}, total={exampleData.total}
      </Typography>
    </Flex>
  ),
};
