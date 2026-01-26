/**
 * Componente IconButton
 * Botão de ícone seguindo o Design System MoveAccess
 * Use para ícones clicáveis como ações em tabelas, botões de fechar, etc.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Tamanho do botão */
  size?: "sm" | "md" | "lg";
  /** Variante visual */
  variant?: "ghost" | "outline" | "solid";
  /** Rótulo acessível para screen readers */
  ariaLabel: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { className, size = "md", variant = "ghost", ariaLabel, disabled, ...props },
    ref
  ) => {
    const sizeClasses = {
      sm: "w-8 h-8",
      md: "w-10 h-10",
      lg: "w-12 h-12",
    };

    const variantClasses = {
      ghost: "bg-transparent hover:bg-[var(--background-secondary)]",
      outline:
        "bg-transparent border border-[var(--divider-primary)] hover:bg-[var(--background-secondary)] hover:border-[var(--element-secondary)]",
      solid:
        "bg-[var(--element-primary)] text-[var(--base-primary)] hover:opacity-90",
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          // Base
          "inline-flex items-center justify-center rounded-lg",
          "transition-all duration-200",
          // Interatividade
          "cursor-pointer",
          "hover:scale-105",
          "active:scale-95",
          // Focus ring
          "focus:outline-none focus:ring-2 focus:ring-[var(--status-info)] focus:ring-offset-2",
          // Tamanho
          sizeClasses[size],
          // Variante
          variantClasses[variant],
          // Disabled
          disabled && [
            "opacity-50",
            "cursor-not-allowed",
            "hover:scale-100",
            "active:scale-100",
          ],
          className
        )}
        {...props}
      />
    );
  }
);
IconButton.displayName = "IconButton";

export { IconButton };
