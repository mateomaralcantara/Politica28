import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POLÍTICA 28",
  description: "Plataforma de gestión política y organización territorial — República Dominicana.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-DO">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
