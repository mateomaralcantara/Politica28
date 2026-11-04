import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Unbounded } from "next/font/google";
import "./globals.css";

const fuente = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--fuente-sans", display: "swap" });
// Tipografía de marca para el nombre «POLÍTICA 28».
const marca = Unbounded({ subsets: ["latin"], weight: ["600", "800", "900"], variable: "--fuente-marca", display: "swap" });

/**
 * URL pública del sitio. WhatsApp, Facebook y otras redes necesitan la dirección
 * completa de la imagen de vista previa. En Vercel se toma sola del dominio de
 * producción; en otro alojamiento, defina NEXT_PUBLIC_SITE_URL.
 */
function urlDelSitio(): URL {
  const explicita = process.env.NEXT_PUBLIC_SITE_URL;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return new URL(explicita ?? (vercel ? `https://${vercel}` : "http://localhost:3000"));
}

const TITULO = "POLÍTICA 28";
const DESCRIPCION = "Gestión política, inteligencia electoral y organización territorial — República Dominicana. Versión Beta.";

export const metadata: Metadata = {
  metadataBase: urlDelSitio(),
  applicationName: TITULO,
  title: { default: TITULO, template: `%s · ${TITULO}` },
  description: DESCRIPCION,
  openGraph: {
    type: "website",
    siteName: TITULO,
    title: TITULO,
    description: DESCRIPCION,
    locale: "es_DO",
    url: "/",
  },
  twitter: { card: "summary_large_image", title: TITULO, description: DESCRIPCION },
  appleWebApp: { title: "Política 28", capable: true, statusBarStyle: "default" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#1d4ed8" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-DO" className={`${fuente.variable} ${marca.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
