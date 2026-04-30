/**
 * Componente Input
 * Campo de entrada seguindo o Design System MoveAccess
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const darkSurfaceInputClassName = "ui-input-dark-surface rounded-[inherit] border-0 bg-[#0e1726] px-0 py-0 text-base text-white shadow-none placeholder:text-slate-500 hover:border-0 focus:border-0 focus:ring-0";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "ui-input flex h-10 w-full rounded-md border px-3 py-2 text-sm",
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
