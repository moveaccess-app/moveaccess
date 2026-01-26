/**
 * Componente Button
 * Seguindo o Design System MoveAccess
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium cursor-pointer",
          "ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-[0.98]",
          // Variants
          variant === "default" && "bg-[var(--element-primary)] text-[var(--base-primary)] hover:bg-[var(--element-primary)]/90 hover:shadow-md",
          variant === "destructive" && "bg-[var(--status-negative)] text-[var(--base-primary)] hover:bg-[var(--status-negative)]/90 hover:shadow-md",
          variant === "outline" && "border border-[var(--divider-primary)] bg-[var(--background-primary)] hover:bg-[var(--background-secondary)] hover:text-[var(--element-primary)] hover:border-[var(--element-secondary)]",
          variant === "secondary" && "bg-[var(--background-secondary)] text-[var(--element-primary)] hover:bg-[var(--background-tertiary)]",
          variant === "ghost" && "hover:bg-[var(--background-secondary)] hover:text-[var(--element-primary)]",
          variant === "link" && "text-[var(--element-primary)] underline-offset-4 hover:underline",
          // Sizes
          size === "default" && "h-10 px-4 py-2",
          size === "sm" && "h-9 rounded-md px-3",
          size === "lg" && "h-11 rounded-md px-8",
          size === "icon" && "h-10 w-10",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
