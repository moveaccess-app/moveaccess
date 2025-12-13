import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MoveAccess",
  description: "Sistema de gestão e controle de acesso para academias",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
