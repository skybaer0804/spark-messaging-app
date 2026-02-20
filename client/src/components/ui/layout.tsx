import * as React from "react"
import { cn } from "@/lib/utils"

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: string;
  margin?: string;
  background?: string;
  color?: string;
  border?: string;
  borderRadius?: string;
  width?: string | number;
  height?: string | number;
  display?: string;
}

export const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ padding, margin, background, color, border, borderRadius, width, height, display, className, style, ...props }, ref) => {
    const computedStyle = {
      ...(padding && { padding: `var(--space-padding-${padding}, ${padding})` }),
      ...(margin && { margin: `var(--space-gap-${margin}, ${margin})` }),
      ...(background && { background: `var(--color-${background}, ${background})` }),
      ...(color && { color: `var(--color-${color}, ${color})` }),
      ...(border && { border: `var(--border-${border}, ${border})` }),
      ...(borderRadius && { borderRadius: `var(--primitive-radius-${borderRadius}, ${borderRadius})` }),
      width,
      height,
      display,
      ...style,
    } as React.CSSProperties

    return <div ref={ref} className={cn("box", className)} style={computedStyle} {...props} />
  }
)
Box.displayName = "Box"

export interface FlexProps extends BoxProps {
  direction?: "row" | "column" | "row-reverse" | "column-reverse"
  justify?: "flex-start" | "flex-end" | "center" | "space-between" | "space-around" | "space-evenly"
  align?: "flex-start" | "flex-end" | "center" | "baseline" | "stretch"
  wrap?: "nowrap" | "wrap" | "wrap-reverse"
  gap?: string
}

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ direction = "row", justify = "flex-start", align = "stretch", wrap = "nowrap", gap, style, ...props }, ref) => {
    const computedStyle = {
      display: "flex",
      flexDirection: direction,
      justifyContent: justify,
      alignItems: align,
      flexWrap: wrap,
      ...(gap && { gap: `var(--space-gap-${gap}, ${gap})` }),
      ...style,
    } as React.CSSProperties

    return <Box ref={ref} style={computedStyle} {...props} />
  }
)
Flex.displayName = "Flex"

export interface StackProps extends FlexProps {
  spacing?: string
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ spacing = "md", direction = "column", ...props }, ref) => {
    return <Flex ref={ref} direction={direction} gap={spacing} {...props} />
  }
)
Stack.displayName = "Stack"

export interface GridProps extends BoxProps {
  columns?: string | number
  rows?: string | number
  gap?: string
  columnGap?: string
  rowGap?: string
  autoFlow?: string
  alignItems?: string
  justifyItems?: string
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ columns, rows, gap, columnGap, rowGap, autoFlow, alignItems, justifyItems, style, ...props }, ref) => {
    const computedStyle = {
      display: "grid",
      ...(columns && { gridTemplateColumns: typeof columns === "number" ? `repeat(${columns}, minmax(0, 1fr))` : columns }),
      ...(rows && { gridTemplateRows: typeof rows === "number" ? `repeat(${rows}, minmax(0, 1fr))` : rows }),
      ...(gap && { gap: `var(--space-gap-${gap}, ${gap})` }),
      ...(columnGap && { columnGap: `var(--space-gap-${columnGap}, ${columnGap})` }),
      ...(rowGap && { rowGap: `var(--space-gap-${rowGap}, ${rowGap})` }),
      ...(autoFlow && { gridAutoFlow: autoFlow }),
      ...(alignItems && { alignItems }),
      ...(justifyItems && { justifyItems }),
      ...style,
    } as React.CSSProperties

    return <Box ref={ref} style={computedStyle} {...props} />
  }
)
Grid.displayName = "Grid"

export interface ContainerProps extends BoxProps {
  maxWidth?: string | number
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ maxWidth = "1200px", className, style, ...props }, ref) => {
    const computedStyle = {
      width: "100%",
      maxWidth,
      marginLeft: "auto",
      marginRight: "auto",
      ...style,
    } as React.CSSProperties

    return <Box ref={ref} className={cn("container", className)} style={computedStyle} {...props} />
  }
)
Container.displayName = "Container"
