import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Icono from "@/components/Icono";
import { MODULOS, buscarModulo } from "@/lib/navegacion";

export function generateStaticParams() {
  return MODULOS.filter((m) => !m.href).map((m) => ({ modulo: m.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ modulo: string }> }): Promise<Metadata> {
  const m = buscarModulo((await params).modulo);
  return { title: m?.nombre ?? "Módulo" };
}

export default async function PaginaModulo({ params }: { params: Promise<{ modulo: string }> }) {
  const m = buscarModulo((await params).modulo);
  if (!m) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="panel animar-entrada relative overflow-hidden rounded-3xl p-8">
        <div aria-hidden className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-gradiente opacity-20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradiente text-white shadow-xl shadow-violet-500/30">
            <Icono nombre={m.icono} className="h-8 w-8" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-600">Fase {m.fase} del plan</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{m.nombre}</h1>
            <p className="mt-1 text-sm text-slate-600">{m.descripcion}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {m.alcance.map((a, i) => (
          <article key={a} className="panel animar-entrada rounded-2xl p-5" style={{ animationDelay: `${(i + 1) * 70}ms` }}>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-blue-50 to-violet-100 text-xs font-extrabold text-violet-700">{i + 1}</span>
            <p className="mt-3 text-sm font-semibold text-slate-900">{a}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-dashed border-violet-200 bg-white/60 p-6 text-sm text-slate-600">
        <p className="font-semibold text-slate-800">Módulo pendiente de implementar</p>
        <p className="mt-1">
          Esta área aún no tiene datos ni funciones. Se construirá en la fase {m.fase} con persistencia, permisos y
          pruebas; mientras tanto no se muestran cifras de ejemplo.
        </p>
        <Link href="/" className="mt-4 inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-violet-700">
          Volver al centro de mando <Icono nombre="flecha" className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
