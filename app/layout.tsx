import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Unbounded } from "next/font/google";
import "./globals.css";

const fuente = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--fuente-sans", display: "swap" });
// Tipografía de marca para el nombre «POLÍTICA 28».
const marca = Unbounded({ subsets: ["latin"], weight: ["600", "800", "900"], variable: "--fuente-marca", display: "swap" });

export const metadata: Metadata = {
  title: { default: "POLÍTICA 28", template: "%s · POLÍTICA 28" },
  description: "Plataforma de gestión política y organización territorial — República Dominicana.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1d4ed8" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-DO" className={`${fuente.variable} ${marca.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
