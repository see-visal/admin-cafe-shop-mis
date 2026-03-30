import * as React from "react"
import { cn } from "@/lib/utils"

export interface GlassProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "base" | "card" | "sidebar"
}

/**
 * Glassmorphism UI Component
 * 
 * Key Characteristics Implemented:
 * - Transparency: Background can be partially seen through the element.
 * - Blur effect: The background behind the element is blurred.
 * - Light borders: Thin semi-transparent borders.
 * - Soft shadows: Gives a floating glass panel effect.
 * - Layered look: Elements appear stacked like glass sheets.
 */
const Glass = React.forwardRef<HTMLDivElement, GlassProps>(
  ({ className, variant = "base", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          {
            "glass": variant === "base",
            "glass-card": variant === "card",
            "glass-sidebar": variant === "sidebar",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Glass.displayName = "Glass"

export { Glass }
