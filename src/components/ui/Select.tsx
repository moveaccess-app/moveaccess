/**
 * Componente Select
 * Campo de seleção seguindo o Design System MoveAccess
 * Com estilos de hover, focus e transições
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Mostra estado de erro */
  hasError?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, hasError, disabled, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        disabled={disabled}
        className={cn(
          // Base
          "flex h-10 w-full rounded-md border px-3 py-2 text-sm",
          "bg-[var(--background-primary)] text-[var(--element-primary)]",
          "border-[var(--divider-primary)]",
          // Placeholder
          "text-[var(--element-secondary)]",
          // Transições
          "transition-all duration-200",
          // Cursor
          "cursor-pointer",
          // Hover
          "hover:border-[var(--element-secondary)]",
          // Focus
          "focus:outline-none",
          "focus:border-[var(--status-info)]",
          "focus:ring-2 focus:ring-[var(--status-info)]/20",
          // Estado de erro
          hasError && [
            "border-[var(--status-negative)]",
            "focus:border-[var(--status-negative)]",
            "focus:ring-[var(--status-negative)]/20",
          ],
          // Disabled
          disabled && [
            "opacity-50",
            "cursor-not-allowed",
            "hover:border-[var(--divider-primary)]",
          ],
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

export { Select };
