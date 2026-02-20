import * as React from "react"
import { cn } from "@/lib/utils"

export interface ListProps extends React.HTMLAttributes<HTMLUListElement> {
  disablePadding?: boolean;
}

export function List({ disablePadding = false, className, children, ...props }: ListProps) {
  return (
    <ul className={cn("list-none", !disablePadding && "py-2", className)} {...props}>
      {children}
    </ul>
  );
}

export interface ListItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
  disableGutters?: boolean;
  divider?: boolean;
  alignItems?: 'center' | 'flex-start';
}

export function ListItem({
  disableGutters = false,
  divider = false,
  alignItems = 'center',
  className,
  children,
  ...props
}: ListItemProps) {
  return (
    <li
      className={cn(
        "flex",
        alignItems === 'center' ? "items-center" : "items-start",
        !disableGutters && "px-4 py-2",
        divider && "border-b border-border",
        className,
      )}
      {...props}
    >
      {children}
    </li>
  );
}

export interface ListItemTextProps extends React.HTMLAttributes<HTMLDivElement> {
  primary?: React.ReactNode;
  secondary?: React.ReactNode;
}

export function ListItemText({ primary, secondary, className, ...props }: ListItemTextProps) {
  return (
    <div className={cn("flex flex-col flex-1 min-w-0", className)} {...props}>
      {primary && (
        <span className="text-sm font-medium leading-none truncate">
          {primary}
        </span>
      )}
      {secondary && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {secondary}
        </p>
      )}
    </div>
  );
}

export function ListItemAvatar({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex shrink-0 mr-4", className)} {...props}>
      {children}
    </div>
  );
}
