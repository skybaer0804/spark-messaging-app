import { JSX } from 'preact';
import { Switch, SwitchProps } from '../Switch/Switch';
import { Typography } from '../Typography/Typography';
import { Stack } from '../Layout/Stack';
import { Flex } from '../Layout/Flex';
import './SettingSwitch.scss';

export interface SettingSwitchProps extends SwitchProps {
  title: string;
  description?: string;
  icon?: JSX.Element;
  containerClassName?: string;
}

export function SettingSwitch({
  title,
  description,
  icon,
  containerClassName = '',
  ...switchProps
}: SettingSwitchProps) {
  return (
    <div className={`setting-switch ${containerClassName} ${switchProps.disabled ? 'setting-switch--disabled' : ''}`}>
      <Flex align="center" justify="space-between" gap="md" fullWidth>
        <Flex align="flex-start" gap="sm" style={{ flex: 1 }}>
          {icon && <div className="setting-switch__icon">{icon}</div>}
          <Stack spacing="none" style={{ flex: 1 }}>
            <Typography variant="body-small" className="setting-switch__title">
              {title}
            </Typography>
            {description && (
              <Typography variant="caption" color="text-secondary" className="setting-switch__description">
                {description}
              </Typography>
            )}
          </Stack>
        </Flex>
        <Switch {...switchProps} />
      </Flex>
    </div>
  );
}
