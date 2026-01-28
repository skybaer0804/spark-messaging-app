import { JSX } from 'preact';
import { forwardRef } from 'preact/compat';

export interface BoxProps extends JSX.HTMLAttributes<HTMLDivElement> {
  padding?: string; // e.g., 'md', 'lg' mapping to tokens or raw values
  margin?: string;
  background?: string; // Token reference or raw value
  color?: string;
  border?: string;
  borderRadius?: string;
  width?: string | number;
  height?: string | number;
  display?: string;
  className?: string;
}

export const Box = forwardRef<HTMLDivElement, BoxProps>(({
  padding,
  margin,
  background,
  color,
  border,
  borderRadius,
  width,
  height,
  display,
  className = '',
  style,
  children,
  ...props
}, ref) => {
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
    ...((style as object) || {}),
  };

  return (
    <div ref={ref} className={`box ${className}`} style={computedStyle} {...props}>
      {children}
    </div>
  );
});
