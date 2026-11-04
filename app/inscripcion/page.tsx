import type { Metadata } from "next";
import InscripcionForm from "./InscripcionForm";

export const metadata: Metadata = { title: "Inscripción · POLÍTICA 28" };

export default function PaginaInscripcion() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-blue-700 dark:text-blue-400">POLÍTICA 28</p>
        <h1 className="mt-1 text-2xl font-bold">Formulario de inscripción</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Complete sus datos tal como figuran en su Cédula de Identidad y Electoral y en el padrón de la Junta Central
          Electoral. La información es suministrada por usted de forma voluntaria y se protege conforme a la Ley 172-13.
        </p>
      </header>
      <InscripcionForm />
    </main>
  );
}
