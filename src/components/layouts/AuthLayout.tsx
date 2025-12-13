/**
 * AuthLayout
 * Layout stub for authentication pages (login, signup, forgot-password)
 * 
 * ⚠️ This is a structural stub - does not contain:
 * - Authentication logic
 * - Session management
 * - Protected route guards
 * 
 * To be completed in future tasks.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-background relative overflow-hidden",
        className
      )}
    >
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-glow" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-bold text-foreground">MoveAccess</span>
          </div>

          {/* Main content */}
          {children}
        </div>
      </div>
    </div>
  );
}
