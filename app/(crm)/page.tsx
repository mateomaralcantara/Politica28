import Link from "next/link";
import Contador from "@/components/Contador";
import Icono from "@/components/Icono";
import { GRUPOS, hrefModulo } from "@/lib/navegacion";
import { obtenerAlmacen } from "@/lib/inscripcion/store";
import { PROVINCIAS } from "@/lib/territorio/provincias";

export const dynamic = "force-dynamic";
export const metadata = { title: "Centro de mando" };

const ZONA = "America/Santo_Domingo";
const nombreProvincia = (c: string) => PROVINCIAS.find((p) => p.codigo === c)?.nombre ?? c;
const fmt = new Intl.NumberFormat("es-DO");

function saludo(ahora: Date) {
  const hora = Number(new Intl.DateTimeFormat("es-DO", { hour: "numeric", hourCycle: "h23", timeZone: ZONA }).format(ahora));
  if (hora < 12) return "Buenos días";
  if (hora < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default async function CentroDeMando() {
  const r = await obtenerAlmacen().resumen();
  const ahora = new Date();
  const fecha = new Intl.DateTimeFormat("es-DO", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: ZONA }).format(ahora);
  const provincias = Object.entries(r.porProvincia).sort((a, b) => b[1] - a[1]);
  const maxProv = Math.max(1, ...provincias.map(([, n]) => n));
  const maxDia = Math.max(1, ...r.porDia.map((d) => d.total));
  const cubiertas = provincias.length;
  const pctCom = r.total ? Math.round((r.aceptanComunicaciones / r.total) * 100) : 0;
  const hoy = r.porDia.at(-1)?.total ?? 0;

  const kpis = [
    { titulo: "Inscripciones", valor: r.total, sufijo: "", nota: hoy ? `+${fmt.format(hoy)} hoy` : "Registros recibidos", icono: "formulario" as const, barra: null },
    { titulo: "Supervisores activos", valor: r.supervisores, sufijo: "", nota: "Con al menos una inscripción", icono: "ojo" as const, barra: null },
    { titulo: "Provincias cubiertas", valor: cubiertas, sufijo: " / 32", nota: "Según domicilio declarado", icono: "mapa" as const, barra: (cubiertas / 32) * 100 },
    { titulo: "Aceptan comunicaciones", valor: pctCom, sufijo: " %", nota: `${fmt.format(r.votanExterior)} votan en el exterior`, icono: "mensaje" as const, barra: pctCom },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Portada viva */}
      <section className="animar-entrada relative overflow-hidden rounded-3xl shadow-2xl shadow-blue-600/25">
        <div className="degradado-vivo relative overflow-hidden bg-gradient-to-br from-blue-800 via-blue-600 to-sky-500 px-6 py-9 text-white sm:px-10">
          <div aria-hidden className="animar-flotar absolute -right-16 -top-24 h-72 w-72 rounded-full bg-sky-300/40 blur-3xl" />
          <div aria-hidden className="animar-flotar-lento absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-blue-300/40 blur-3xl" />
          <div aria-hidden className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:22px_22px]" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-blue-50 backdrop-blur">
                {fecha.charAt(0).toUpperCase() + fecha.slice(1)}
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{saludo(ahora)}</h1>
              <p className="mt-2 max-w-xl text-sm text-blue-50/90">
                Así va la organización hoy. Cifras agregadas: ningún dato personal se muestra en este panel.
              </p>
            </div>
            <Link
              href="/inscripcion"
              className="con-reflejo group inline-flex items-center gap-2 self-start rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-xl shadow-blue-900/20 transition hover:-translate-y-0.5 hover:shadow-2xl sm:self-auto"
            >
              <Icono nombre="mas" className="h-4 w-4" /> Registrar inscripción
              <Icono nombre="flecha" className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Indicadores */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores">
        {kpis.map((k, i) => (
          <article key={k.titulo} className="panel tarjeta-viva animar-entrada group relative overflow-hidden rounded-2xl p-5" style={{ animationDelay: `${i * 80}ms` }}>
            <div aria-hidden className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradiente transition-transform duration-500 group-hover:scale-x-100" />
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{k.titulo}</p>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700 transition duration-300 group-hover:rotate-6 group-hover:scale-110 group-hover:bg-gradiente group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/30">
                <Icono nombre={k.icono} className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-3 text-[34px] leading-none font-extrabold tracking-tight text-slate-900">
              <Contador valor={k.valor} sufijo={k.sufijo} />
            </p>
            {k.barra !== null && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="animar-crecer-x h-full rounded-full bg-gradiente" style={{ width: `${k.barra}%`, animationDelay: `${300 + i * 80}ms` }} />
              </div>
            )}
            <p className={`mt-2 text-xs ${k.nota.startsWith("+") ? "font-semibold text-emerald-600" : "text-slate-500"}`}>{k.nota}</p>
          </article>
        ))}
      </section>

      {/* Gráficos */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <article className="panel animar-entrada rounded-2xl p-6 xl:col-span-3" style={{ animationDelay: "200ms" }}>
          <header className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-slate-900">Inscripciones por día</h2>
            <p className="text-xs text-slate-500">Últimos 14 días</p>
          </header>
          {r.total === 0 ? (
            <Vacio texto="Aún no hay inscripciones. Las barras aparecerán al registrar la primera." />
          ) : (
            <div className="mt-6 flex h-48 items-end gap-1.5" role="img" aria-label="Inscripciones por día, últimos 14 días">
              {r.porDia.map((d, i) => (
                <div key={d.fecha} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="rounded-md bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white tabular-nums opacity-0 transition group-hover:-translate-y-0.5 group-hover:opacity-100">{d.total}</span>
                  <div
                    className="animar-crecer-y w-full rounded-t-lg bg-gradient-to-t from-blue-700 to-sky-400 transition group-hover:from-blue-600 group-hover:to-sky-300 group-hover:shadow-lg group-hover:shadow-blue-500/40"
                    style={{ height: `${Math.max(d.total ? 6 : 2, (d.total / maxDia) * 100)}%`, opacity: d.total ? 1 : 0.2, animationDelay: `${300 + i * 40}ms` }}
                    title={`${d.fecha}: ${d.total}`}
                  />
                  <span className="text-[9px] text-slate-400 tabular-nums">{d.fecha.slice(8)}</span>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel animar-entrada rounded-2xl p-6 xl:col-span-2" style={{ animationDelay: "260ms" }}>
          <header className="flex items-baseline justify-between">
            <h2 className="text-base font-bold text-slate-900">Por provincia</h2>
            <p className="text-xs text-slate-500">Domicilio declarado</p>
          </header>
          {provincias.length === 0 ? (
            <Vacio texto="Sin datos todavía." />
          ) : (
            <ul className="mt-5 space-y-3.5">
              {provincias.slice(0, 8).map(([codigo, n], i) => (
                <li key={codigo} className="group">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700 transition group-hover:text-blue-700">{nombreProvincia(codigo)}</span>
                    <span className="font-semibold text-slate-900 tabular-nums">{fmt.format(n)}</span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="animar-crecer-x h-full rounded-full bg-gradiente" style={{ width: `${(n / maxProv) * 100}%`, animationDelay: `${350 + i * 70}ms` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      {/* Módulos */}
      <section>
        <h2 className="mb-4 text-base font-bold text-slate-900">Módulos de la plataforma</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {GRUPOS.flatMap((g) => g.modulos).map((m, i) => (
            <Link
              key={hrefModulo(m)}
              href={hrefModulo(m)}
              className="panel tarjeta-viva animar-entrada group flex items-start gap-3 rounded-2xl p-4"
              style={{ animationDelay: `${300 + i * 35}ms` }}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 transition duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-gradiente group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/30">
                <Icono nombre={m.icono} className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 transition group-hover:text-blue-700">
                  {m.nombre}
                  {m.listo && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      <span className="punto-vivo h-1.5 w-1.5 rounded-full bg-emerald-500" /> Activo
                    </span>
                  )}
                </span>
                <span className="mt-0.5 line-clamp-2 block text-xs text-slate-500">{m.descripcion}</span>
              </span>
              <Icono nombre="flecha" className="mt-1 h-4 w-4 shrink-0 -translate-x-1 text-blue-500 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div className="mt-6 grid h-40 place-items-center rounded-xl border border-dashed border-blue-200 bg-blue-50/40 px-6 text-center text-sm text-slate-500">
      <span>
        <Icono nombre="barras" className="mx-auto mb-2 h-6 w-6 text-blue-300" />
        {texto}
      </span>
    </div>
  );
}
