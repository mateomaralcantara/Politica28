import type { Metadata } from "next";
import InscripcionForm from "@/components/InscripcionForm";

export const metadata: Metadata = { title: "Inscripción" };

export default function PaginaInscripcion() {
  return (
    <div className="mx-auto max-w-5xl">
      <header className="animar-entrada mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Operación · Inscripción</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
          Formulario de <span className="texto-gradiente">inscripción</span>
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Complete los datos tal como figuran en la Cédula de Identidad y Electoral y en el padrón de la Junta Central
          Electoral. La información es voluntaria y se protege conforme a la Ley 172-13.
        </p>
      </header>
      <InscripcionForm />
    </div>
  );
}
