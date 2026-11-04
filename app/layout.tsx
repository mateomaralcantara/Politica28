import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fuente = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--fuente-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "POLÍTICA 28", template: "%s · POLÍTICA 28" },
  description: "Plataforma de gestión política y organización territorial — República Dominicana.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#4f46e5" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-DO" className={fuente.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
