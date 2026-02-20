import { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { useTheme } from '@/core/context/ThemeProvider';
import {
  Tabs as ShadcnTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from '@/lib/utils';

export type TabsValue = string | number;

export interface TabsItem {
  value: TabsValue;
  label: preact.ComponentChildren;
  content: preact.ComponentChildren;
  disabled?: boolean;
}

export interface TabsProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: TabsItem[];
  value?: TabsValue;
  defaultValue?: TabsValue;
  onChange?: (value: TabsValue, event: Event) => void;
  ariaLabel?: string;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'standard' | 'scrollable' | 'fullWidth';
  selectionFollowsFocus?: boolean;
  keepMounted?: boolean;
}

export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  ariaLabel = 'tabs',
  orientation = 'horizontal',
  variant = 'standard',
  selectionFollowsFocus = false,
  keepMounted = false,
  className = '',
  ...props
}: TabsProps) {
  const { theme, contrast } = useTheme();

  const handleValueChange = (val: string) => {
    if (onChange) {
      onChange(val, {} as any);
    }
  };

  return (
    <ShadcnTabs
      value={value?.toString()}
      defaultValue={defaultValue?.toString()}
      onValueChange={handleValueChange}
      orientation={orientation}
      className={cn("w-full", className)}
      data-theme={theme}
      data-contrast={contrast}
      {...(props as any)}
    >
      <TabsList
        className={cn(
          "w-full justify-start rounded-none border-b bg-transparent p-0",
          variant === 'fullWidth' && "grid w-full grid-cols-2", // grid-cols dynamic is hard, but usually 2 or more
          orientation === 'vertical' && "flex-col h-auto"
        )}
        aria-label={ariaLabel}
      >
        {items.map((item) => (
          <TabsTrigger
            key={item.value}
            value={item.value.toString()}
            disabled={item.disabled}
            className={cn(
              "relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none",
              variant === 'fullWidth' && "w-full"
            )}
          >
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {items.map((item) => (
        <TabsContent
          key={item.value}
          value={item.value.toString()}
          className="mt-4"
        >
          {item.content}
        </TabsContent>
      ))}
    </ShadcnTabs>
  );
}
