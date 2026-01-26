/**
 * Componente Badge
 * Badge de status seguindo o Design System MoveAccess
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
  /** Se o badge é clicável (adiciona hover e cursor pointer) */
  clicavel?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", clicavel = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          // Variants
          variant === "default" && "border-transparent bg-[var(--element-primary)] text-[var(--base-primary)]",
          variant === "secondary" && "border-transparent bg-[var(--background-secondary)] text-[var(--element-primary)]",
          variant === "destructive" && "border-transparent bg-[var(--status-negative)] text-[var(--base-primary)]",
          variant === "outline" && "border-[var(--divider-primary)] text-[var(--element-primary)]",
          variant === "success" && "border-transparent bg-[var(--status-positive)] text-[var(--base-primary)]",
          variant === "warning" && "border-transparent bg-[var(--status-alert)] text-[var(--element-primary)]",
          // Estilos de interação para badges clicáveis
          clicavel && [
            "cursor-pointer",
            "hover:opacity-80",
            "hover:scale-105",
            "active:scale-95",
          ],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge };
