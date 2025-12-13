/**
 * AppLayout
 * Layout stub for authenticated app pages (dashboard, settings, etc.)
 * 
 * ⚠️ This is a structural stub - does not contain:
 * - Sidebar navigation
 * - User menu/profile
 * - Real-time notifications
 * - Permission-based UI
 * 
 * To be completed in future tasks.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AppLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ children, className }: AppLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-16 items-center gap-4 px-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold text-foreground">MoveAccess</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User menu placeholder */}
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30" />
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex">
        {/* Sidebar placeholder */}
        <aside className="hidden lg:block w-64 border-r border-border bg-card/30 min-h-[calc(100vh-4rem)] p-4">
          <nav className="space-y-2">
            <div className="h-10 bg-muted/30 rounded animate-pulse" />
            <div className="h-10 bg-muted/20 rounded animate-pulse" />
            <div className="h-10 bg-muted/20 rounded animate-pulse" />
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
