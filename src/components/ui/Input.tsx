/**
 * Componente Input
 * Campo de entrada seguindo o Design System MoveAccess
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border px-3 py-2 text-sm",
          "bg-[var(--background-primary)] border-[var(--divider-primary)]",
          "text-[var(--element-primary)] placeholder:text-[var(--element-disabled)]",
          "transition-all duration-200",
          "hover:border-[var(--element-secondary)]",
          "focus:outline-none focus:border-[var(--status-info)] focus:ring-2 focus:ring-[var(--status-info-background)]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--background-secondary)]",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:cursor-pointer",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
