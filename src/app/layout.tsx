import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
