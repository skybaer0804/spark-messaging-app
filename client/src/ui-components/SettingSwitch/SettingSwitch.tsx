import { JSX } from 'preact';
import { cn } from '@/lib/utils';
import { Switch, SwitchProps } from '../Switch/Switch';
import { Typography } from '../Typography/Typography';

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
    <div
      className={cn(
        'flex items-center justify-between gap-4 w-full',
        switchProps.disabled && 'opacity-50',
        containerClassName,
      )}
    >
      <div className="flex items-start gap-2 flex-1">
        {icon && <div className="flex items-center mt-0.5">{icon}</div>}
        <div className="flex flex-col flex-1">
          <Typography variant="body-small">{title}</Typography>
          {description && (
            <Typography variant="caption" color="text-secondary">
              {description}
            </Typography>
          )}
        </div>
      </div>
      <Switch {...switchProps} />
    </div>
  );
}
