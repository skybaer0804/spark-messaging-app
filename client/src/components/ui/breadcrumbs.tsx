import * as React from "react"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb"

export interface BreadcrumbItemData {
  label: React.ReactNode;
  href?: string;
  onClick?: (event: any) => void;
  disabled?: boolean;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItemData[];
  separator?: React.ReactNode;
  maxItems?: number;
  itemsBeforeCollapse?: number;
  itemsAfterCollapse?: number;
}

export function Breadcrumbs({
  items,
  separator,
  maxItems,
  itemsBeforeCollapse = 1,
  itemsAfterCollapse = 1,
  className,
  ...props
}: BreadcrumbsProps) {
  const [expanded, setExpanded] = React.useState(false);
  const shouldCollapse = !!maxItems && items.length > maxItems && !expanded;

  const renderItems = React.useMemo(() => {
    if (!shouldCollapse) {
      return items.map((it, index) => ({ ...it, index, isLast: index === items.length - 1 }));
    }

    const before = Math.max(0, itemsBeforeCollapse);
    const after = Math.max(0, itemsAfterCollapse);

    const start = items.slice(0, before);
    const end = items.slice(Math.max(items.length - after, before), items.length);

    return { start, end };
  }, [items, shouldCollapse, itemsBeforeCollapse, itemsAfterCollapse]);

  return (
    <Breadcrumb className={className} {...props}>
      <BreadcrumbList>
        {!shouldCollapse ? (
          (renderItems as any[]).map((item, idx) => (
            <React.Fragment key={idx}>
              <BreadcrumbItem>
                {item.isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink 
                    href={item.disabled ? undefined : item.href}
                    onClick={item.disabled ? (e) => e.preventDefault() : item.onClick}
                  >
                    {item.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!item.isLast && <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>}
            </React.Fragment>
          ))
        ) : (
          <>
            {(renderItems as any).start.map((item: any, idx: number) => (
              <React.Fragment key={`start-${idx}`}>
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    href={item.disabled ? undefined : item.href}
                    onClick={item.disabled ? (e) => e.preventDefault() : item.onClick}
                  >
                    {item.label}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
              </React.Fragment>
            ))}
            <BreadcrumbItem>
              <BreadcrumbEllipsis onClick={() => setExpanded(true)} className="cursor-pointer" />
            </BreadcrumbItem>
            <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
            {(renderItems as any).end.map((item: any, idx: number) => (
              <React.Fragment key={`end-${idx}`}>
                <BreadcrumbItem>
                  {idx === (renderItems as any).end.length - 1 ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink 
                      href={item.disabled ? undefined : item.href}
                      onClick={item.disabled ? (e) => e.preventDefault() : item.onClick}
                    >
                      {item.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {idx < (renderItems as any).end.length - 1 && <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>}
              </React.Fragment>
            ))}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
