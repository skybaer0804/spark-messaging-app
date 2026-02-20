import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const typographyVariants = cva(
  "text-foreground",
  {
    variants: {
      variant: {
        "display-large": "text-5xl font-bold tracking-tight",
        h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
        h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
        h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
        h4: "scroll-m-20 text-xl font-semibold tracking-tight",
        "body-large": "text-lg",
        "body-medium": "text-base leading-7",
        "body-small": "text-sm leading-6",
        caption: "text-xs text-muted-foreground",
      },
      align: {
        left: "text-left",
        center: "text-center",
        right: "text-right",
        justify: "text-justify",
      },
    },
    defaultVariants: {
      variant: "body-medium",
      align: "left",
    },
  }
)

export interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  component?: React.ElementType
  fontWeight?: "normal" | "medium" | "semibold" | "bold"
  color?: string
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, align, component, fontWeight, color, style, ...props }, ref) => {
    const Tag = component || (variant?.startsWith("h") ? (variant as React.ElementType) : variant === "display-large" ? "h1" : "p")
    const weightClass = fontWeight ? `font-${fontWeight}` : ""
    
    const computedStyle = {
      ...(color && { color: `var(--color-${color}, inherit)` }),
      ...style,
    } as React.CSSProperties

    return (
      <Tag
        ref={ref}
        className={cn(typographyVariants({ variant, align, className }), weightClass)}
        style={computedStyle}
        {...props}
      />
    )
  }
)
Typography.displayName = "Typography"

export { Typography, typographyVariants }
