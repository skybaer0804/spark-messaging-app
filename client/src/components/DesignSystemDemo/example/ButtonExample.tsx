import { Stack, Flex } from '@/components/ui/layout';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Typography } from '@/components/ui/typography';
import { IconPlus, IconSearch } from '@tabler/icons-preact';
import type { DesignSystemExampleDefinition } from './types';

const exampleData = {
  variants: ['primary', 'secondary'] as const,
  sizes: ['sm', 'md', 'lg'] as const,
};

const usageCode = `import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { IconSearch } from '@tabler/icons-preact';

<Button variant="primary">Primary</Button>
<Button variant="secondary" size="sm">Secondary</Button>
<IconButton color="default" title="검색">
  <IconSearch size={20} />
</IconButton>
`;

export const buttonExample: DesignSystemExampleDefinition = {
  id: 'button',
  label: 'Button',
  description: '기본 버튼/아이콘 버튼의 변형(variant/size)을 제공합니다.',
  usageCode,
  Example: () => (
    <Stack spacing="md">
      <Typography variant="body-small" color="text-secondary">
        데이터: variants({exampleData.variants.join(', ')}), sizes({exampleData.sizes.join(', ')})
      </Typography>
      <Flex gap="sm" wrap="wrap" align="center">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button disabled>Disabled</Button>
        <Button variant="secondary" size="sm">
          <IconPlus size={18} /> Small
        </Button>
        <IconButton color="default" title="검색">
          <IconSearch size={20} />
        </IconButton>
      </Flex>
    </Stack>
  ),
};
