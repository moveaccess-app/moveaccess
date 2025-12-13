/**
 * MarketingLayout
 * Layout stub for public marketing pages (landing, etc.)
 * 
 * ⚠️ This is a structural stub - does not contain:
 * - Final navigation structure
 * - Marketing-specific logic
 * - SEO optimizations
 * 
 * To be completed in future tasks.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface MarketingLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MarketingLayout({ children, className }: MarketingLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Header/Navbar placeholder */}
      <header className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="container-wide mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">M</span>
              </div>
              <span className="text-xl font-bold text-foreground">MoveAccess</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-20">{children}</main>

      {/* Footer placeholder */}
      <footer className="border-t border-border bg-card/50">
        <div className="container-wide mx-auto px-6 lg:px-12 py-8">
          <div className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} MoveAccess. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
