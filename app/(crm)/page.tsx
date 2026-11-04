import Link from "next/link";
import Icono from "@/components/Icono";
import { GRUPOS, hrefModulo } from "@/lib/navegacion";
import { obtenerAlmacen } from "@/lib/inscripcion/store";
import { PROVINCIAS } from "@/lib/territorio/provincias";

export const dynamic = "force-dynamic";
export const metadata = { title: "Centro de mando" };

const nombreProvincia = (c: string) => PROVINCIAS.find((p) => p.codigo === c)?.nombre ?? c;
const fmt = new Intl.NumberFormat("es-DO");

export default async function CentroDeMando() {
  const r = await obtenerAlmacen().resumen();
  const provincias = Object.entries(r.porProvincia).sort((a, b) => b[1] - a[1]);
  const maxProv = Math.max(1, ...provincias.map(([, n]) => n));
  const maxDia = Math.max(1, ...r.porDia.map((d) => d.total));
  const cubiertas = provincias.length;
  const pct = (n: number) => (r.total ? `${Math.round((n / r.total) * 100)} %` : "—");

  const kpis = [
    { titulo: "Inscripciones", valor: fmt.format(r.total), nota: "Registros recibidos", icono: "formulario" as const },
    { titulo: "Supervisores activos", valor: fmt.format(r.supervisores), nota: "Con al menos una inscripción", icono: "ojo" as const },
    { titulo: "Provincias cubiertas", valor: `${cubiertas} / 32`, nota: "Según domicilio declarado", icono: "mapa" as const },
    { titulo: "Aceptan comunicaciones", valor: pct(r.aceptanComunicaciones), nota: `${fmt.format(r.votanExterior)} votan en el exterior`, icono: "mensaje" as const },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="animar-entrada relative overflow-hidden rounded-3xl bg-gradiente p-[1px] shadow-2xl shadow-violet-500/20">
        <div className="relative overflow-hidden rounded-[23px] bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 px-6 py-8 text-white sm:px-10">
          <div aria-hidden className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-amber-300/40 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-blue-400/40 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">Centro de mando</p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Organización en tiempo real</h1>
              <p className="mt-2 max-w-xl text-sm text-indigo-100">
                Cifras agregadas de las inscripciones. Ningún dato personal se muestra en este panel.
              </p>
            </div>
            <Link href="/inscripcion" className="inline-flex items-center gap-2 self-start rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-amber-300/50 sm:self-auto">
              Registrar inscripción <Icono nombre="flecha" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores">
        {kpis.map((k, i) => (
          <article key={k.titulo} className="panel animar-entrada rounded-2xl p-5" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{k.titulo}</p>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-blue-50 to-violet-100 text-violet-700">
                <Icono nombre={k.icono} className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums">{k.valor}</p>
            <p className="mt-1 text-xs text-slate-500">{k.nota}</p>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <article className="panel rounded-2xl p-6 xl:col-span-3">
          <header className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-slate-900">Inscripciones por día</h2>
            <p className="text-xs text-slate-500">Últimos 14 días</p>
          </header>
          {r.total === 0 ? (
            <Vacio texto="Aún no hay inscripciones. Las barras aparecerán al registrar la primera." />
          ) : (
            <div className="mt-6 flex h-48 items-end gap-1.5" role="img" aria-label="Inscripciones por día, últimos 14 días">
              {r.porDia.map((d) => (
                <div key={d.fecha} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-[10px] font-semibold text-slate-600 tabular-nums opacity-0 transition group-hover:opacity-100">{d.total}</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-blue-600 to-violet-500 transition group-hover:to-amber-400"
                    style={{ height: `${Math.max(d.total ? 6 : 2, (d.total / maxDia) * 100)}%`, opacity: d.total ? 1 : 0.25 }}
                    title={`${d.fecha}: ${d.total}`}
                  />
                  <span className="text-[9px] text-slate-400 tabular-nums">{d.fecha.slice(8)}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel rounded-2xl p-6 xl:col-span-2">
          <header className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-slate-900">Por provincia</h2>
            <p className="text-xs text-slate-500">Domicilio declarado</p>
          </header>
          {provincias.length === 0 ? (
            <Vacio texto="Sin datos todavía." />
          ) : (
            <ul className="mt-5 space-y-3">
              {provincias.slice(0, 8).map(([codigo, n]) => (
                <li key={codigo}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{nombreProvincia(codigo)}</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{fmt.format(n)}</span>
                  </div>
                  <div className="mt-1.5 h-2 rounded-full bg-slate-100">
                    <div className="h-2 rounded-full bg-gradiente" style={{ width: `${(n / maxProv) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-base font-bold text-slate-900">Módulos de la plataforma</h2>
          <p className="text-xs text-slate-500">
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500" /> disponible · F = fase del plan
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {GRUPOS.flatMap((g) => g.modulos).map((m) => (
            <Link key={hrefModulo(m)} href={hrefModulo(m)} className="panel group flex items-start gap-3 rounded-2xl p-4 transition hover:-translate-y-0.5 hover:shadow-violet-300/40">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-gradiente group-hover:text-white">
                <Icono nombre={m.icono} className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  {m.nombre}
                  {m.listo ? (
                    <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">Activo</span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">F{m.fase}</span>
                  )}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{m.descripcion}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div className="mt-6 grid h-40 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-6 text-center text-sm text-slate-500">
      {texto}
    </div>
  );
}
