import { Checkbox } from '@/components/ui/checkbox';
import { Flex } from '@/components/ui/layout';
import { Typography } from '@/components/ui/typography';
import type { DesignSystemExampleDefinition } from './types';

const usageCode = `import { Checkbox } from '@/components/ui/checkbox';

<Checkbox defaultChecked />
<Checkbox disabled />
`;

export const checkboxExample: DesignSystemExampleDefinition = {
  id: 'checkbox',
  label: 'Checkbox',
  description: '복수 선택에 사용하는 선택 컨트롤입니다.',
  usageCode,
  Example: () => (
    <Flex gap="md" align="center" wrap="wrap">
      <Checkbox defaultChecked />
      <Checkbox />
      <Checkbox disabled defaultChecked />
      <Checkbox color="error" defaultChecked />
      <Typography variant="caption" color="text-secondary">
        defaultChecked/disabled/color 등으로 상태를 표현합니다.
      </Typography>
    </Flex>
  ),
};






