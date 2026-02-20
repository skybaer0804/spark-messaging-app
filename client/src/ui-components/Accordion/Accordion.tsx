import { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { useTheme } from '@/core/context/ThemeProvider';
import {
  Accordion as ShadcnAccordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from '@/lib/utils';

export type AccordionValue = string | number;

export interface AccordionItem {
  value: AccordionValue;
  summary: preact.ComponentChildren;
  details: preact.ComponentChildren;
  disabled?: boolean;
}

export interface AccordionProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: AccordionItem[];
  expanded?: AccordionValue | AccordionValue[] | null;
  defaultExpanded?: AccordionValue | AccordionValue[] | null;
  onChange?: (expanded: AccordionValue | AccordionValue[] | null, event: Event) => void;
  allowMultiple?: boolean;
  ariaLabel?: string;
  disableGutters?: boolean;
}

export function Accordion({
  items,
  expanded,
  defaultExpanded,
  onChange,
  allowMultiple = false,
  ariaLabel = 'accordion',
  disableGutters = false,
  className = '',
  ...props
}: AccordionProps) {
  const { theme, contrast } = useTheme();

  const handleValueChange = (val: string | string[]) => {
    if (onChange) {
      onChange(val as any, {} as any);
    }
  };

  const type = allowMultiple ? "multiple" : "single";

  return (
    <ShadcnAccordion
      type={type as any}
      value={expanded as any}
      defaultValue={defaultExpanded as any}
      onValueChange={handleValueChange}
      className={cn("w-full", className)}
      data-theme={theme}
      data-contrast={contrast}
      {...(props as any)}
    >
      {items.map((item) => (
        <AccordionItem
          key={item.value}
          value={item.value.toString()}
          disabled={item.disabled}
          className={cn(disableGutters && "border-none")}
        >
          <AccordionTrigger className="hover:no-underline">
            {item.summary}
          </AccordionTrigger>
          <AccordionContent>
            {item.details}
          </AccordionContent>
        </AccordionItem>
      ))}
    </ShadcnAccordion>
  );
}
