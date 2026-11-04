import type { Metadata } from "next";
import EducacionPanel from "@/components/educacion/EducacionPanel";
import { listarPublico } from "@/lib/educacion/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Educación" };

export default async function PaginaEducacion() {
  const [cursos, participantes] = await Promise.all([listarPublico("cursos"), listarPublico("participantes")]);
  return (
    <div className="mx-auto max-w-7xl">
      <header className="animar-entrada mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Operación · Educación</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
          Escuela de <span className="texto-gradiente">formación</span>
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Programe cursos y talleres para la estructura, inscriba participantes, controle la asistencia y emita certificados.
        </p>
      </header>
      <EducacionPanel inicial={{ cursos, participantes }} />
    </div>
  );
}
