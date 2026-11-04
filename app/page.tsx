import Link from "next/link";

export default function Inicio() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">POLÍTICA 28</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">
        Plataforma de gestión política, inteligencia electoral y organización territorial.
      </p>
      <Link href="/inscripcion" className="mt-8 inline-block rounded-md bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">
        Formulario de inscripción
      </Link>
    </main>
  );
}
