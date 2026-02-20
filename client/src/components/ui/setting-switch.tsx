import * as React from "react"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Typography } from "@/components/ui/typography"

export interface SettingSwitchProps extends React.ComponentPropsWithoutRef<typeof Switch> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export function SettingSwitch({
  title,
  description,
  icon,
  containerClassName,
  className,
  ...props
}: SettingSwitchProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 w-full",
        props.disabled && "opacity-50",
        containerClassName
      )}
    >
      <div className="flex items-start gap-2 flex-1">
        {icon && <div className="flex items-center mt-0.5">{icon}</div>}
        <div className="flex flex-col flex-1">
          <Typography variant="body-small" className="font-medium">{title}</Typography>
          {description && (
            <Typography variant="caption" className="text-muted-foreground">
              {description}
            </Typography>
          )}
        </div>
      </div>
      <Switch className={className} {...props} />
    </div>
  )
}
