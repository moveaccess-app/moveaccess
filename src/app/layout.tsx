import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnalyticsProvider } from "@/lib/analytics";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "MoveAccess",
  description: "Sistema de Gestão de Acesso e Planos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Script para aplicar tema antes do render para evitar flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('moveaccess-theme');
                  let theme = stored || 'system';
                  
                  if (theme === 'system') {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  
                  document.documentElement.classList.add(theme);
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>
            <AnalyticsProvider>
              {children}
              <Toaster
              position="top-right"
              richColors
              closeButton
              duration={4000}
              toastOptions={{
                className: 'text-sm',
              }}
            />
            </AnalyticsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
