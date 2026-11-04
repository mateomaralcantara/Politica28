import type { Metadata } from "next";
import ComunicacionesPanel from "@/components/comunicaciones/ComunicacionesPanel";
import { listarPublico } from "@/lib/comunicaciones/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Comunicaciones" };

export default async function PaginaComunicaciones() {
  const [lineas, medios, comunicadores] = await Promise.all([listarPublico("lineas"), listarPublico("medios"), listarPublico("comunicadores")]);
  return (
    <div className="mx-auto max-w-7xl">
      <header className="animar-entrada mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Operación · Comunicaciones</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
          Centro de <span className="texto-gradiente">comunicaciones</span>
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Defina la línea comunicacional, planifique la presencia en medios y organice la red nacional de comunicadores en
          las 32 demarcaciones provinciales.
        </p>
      </header>
      <ComunicacionesPanel inicial={{ lineas, medios, comunicadores }} />
    </div>
  );
}
