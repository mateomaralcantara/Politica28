import type { IconoNombre } from "@/lib/navegacion";

const TRAZOS: Record<IconoNombre | "menu" | "cerrar" | "buscar" | "mas" | "flecha" | "check" | "escudo", string[]> = {
  mando: ["M3 13h8V3H3z", "M13 21h8V11h-8z", "M3 21h8v-6H3z", "M13 3v6h8V3z"],
  mapa: ["M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3z", "M9 3v15", "M15 6v15"],
  jerarquia: ["M12 3v5", "M5 13V10h14v3", "M12 8v2", "M9 3h6v5H9z", "M2 13h6v6H2z", "M16 13h6v6h-6z", "M9 13h6v6H9z"],
  estrella: ["m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"],
  ojo: ["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  megafono: ["M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z", "M17 8a5 5 0 0 1 0 8", "M7 14l1 6h3l-1-5"],
  red: ["M12 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M5 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M19 21a2 2 0 1 0 0-4 2 2 0 0 0 0 4z", "M12 5v6", "M12 11 5 17", "M12 11l7 6"],
  calendario: ["M4 5h16v16H4z", "M4 10h16", "M8 3v4", "M16 3v4", "M8 14h3v3H8z"],
  contactos: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M22 21v-2a4 4 0 0 0-3-3.9", "M16 3.1a4 4 0 0 1 0 7.8"],
  urna: ["M4 12h16v9H4z", "M8 12V4h8v8", "M10 8h4", "M9 16h6"],
  barras: ["M3 21h18", "M6 17V9", "M11 17V5", "M16 17v-6", "M21 17v-3"],
  tendencia: ["m3 17 6-6 4 4 8-8", "M15 7h6v6"],
  capas: ["m12 2 10 5-10 5L2 7z", "m2 12 10 5 10-5", "m2 17 10 5 10-5"],
  encuesta: ["M9 4h6v3H9z", "M7 5H5v16h14V5h-2", "m8 13 2 2 4-4"],
  mensaje: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", "M7 9h10", "M7 13h6"],
  billetera: ["M3 7h18v14H3z", "M3 7l14-4v4", "M16 14h2"],
  chip: ["M7 7h10v10H7z", "M10 10h4v4h-4z", "M9 2v3", "M15 2v3", "M9 19v3", "M15 19v3", "M2 9h3", "M2 15h3", "M19 9h3", "M19 15h3"],
  engranajes: ["M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z", "M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"],
  documento: ["M14 2H6v20h12V6z", "M14 2v4h4", "M9 13h6", "M9 17h6"],
  ajustes: ["M4 21v-7", "M4 10V3", "M12 21v-9", "M12 8V3", "M20 21v-5", "M20 12V3", "M1 14h6", "M9 8h6", "M17 16h6"],
  formulario: ["M5 3h14v18H5z", "M9 7h6", "M9 11h6", "M9 15h3"],
  menu: ["M3 6h18", "M3 12h18", "M3 18h18"],
  cerrar: ["M6 6l12 12", "M18 6 6 18"],
  buscar: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "m21 21-4.3-4.3"],
  mas: ["M12 5v14", "M5 12h14"],
  flecha: ["M5 12h14", "m13 6 6 6-6 6"],
  check: ["m5 12 5 5L20 7"],
  escudo: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "m9 12 2 2 4-4"],
};

export type IconoProps = { nombre: keyof typeof TRAZOS; className?: string };

export default function Icono({ nombre, className = "h-5 w-5" }: IconoProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {TRAZOS[nombre].map((d) => <path key={d} d={d} />)}
    </svg>
  );
}
