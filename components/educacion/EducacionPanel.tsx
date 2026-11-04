"use client";

import { useMemo, useState } from "react";
import Icono from "@/components/Icono";
import FormularioRegistro, { type CampoUI } from "@/components/FormularioRegistro";
import type { Registro } from "@/lib/datos/almacen";
import { OPC, etiqueta, tieneCertificado } from "@/lib/educacion/schema";
import { PROVINCIAS } from "@/lib/territorio/provincias";

type Datos = { cursos: Registro[]; participantes: Registro[] };
type Pestana = "programa" | "participantes" | "certificados";

const nombreProvincia = (c: unknown) => PROVINCIAS.find((p) => p.codigo === c)?.nombre ?? "";
const fecha = (f: unknown, opts: Intl.DateTimeFormatOptions) =>
  typeof f === "string" && f ? new Intl.DateTimeFormat("es-DO", { ...opts, timeZone: "UTC" }).format(new Date(`${f}T00:00:00Z`)) : "";

const CAMPOS_CURSO: CampoUI[] = [
  { clave: "titulo", etiqueta: "Nombre del curso o taller", tipo: "text", requerido: true, maxLength: 140, placeholder: "Ej.: Taller de liderazgo comunitario", ancho: "completo" },
  { clave: "tema", etiqueta: "Tema", tipo: "select", requerido: true, opciones: OPC.tema },
  { clave: "dirigido_a", etiqueta: "Dirigido a", tipo: "select", requerido: true, opciones: OPC.dirigidoA },
  { clave: "descripcion", etiqueta: "Contenido", tipo: "textarea", maxLength: 600, placeholder: "Objetivos y temas que se tratarán" },
  { clave: "modalidad", etiqueta: "Modalidad", tipo: "select", requerido: true, opciones: OPC.modalidad },
  { clave: "alcance", etiqueta: "Alcance", tipo: "select", requerido: true, opciones: OPC.alcance },
  { clave: "provincia", etiqueta: "Provincia", tipo: "select", requerido: true, opciones: OPC.provincia, visibleSi: (v) => v.alcance === "PROVINCIAL" },
  { clave: "sede", etiqueta: "Lugar o enlace", tipo: "text", maxLength: 200, placeholder: "Dirección o enlace de la reunión", ancho: "completo", ayuda: "Obligatorio en cursos presenciales o híbridos." },
  { clave: "fecha", etiqueta: "Fecha", tipo: "date", requerido: true },
  { clave: "hora", etiqueta: "Hora", tipo: "time" },
  { clave: "duracion_horas", etiqueta: "Duración (horas)", tipo: "number", placeholder: "3" },
  { clave: "cupo", etiqueta: "Cupo", tipo: "number", requerido: true, placeholder: "30" },
  { clave: "facilitador", etiqueta: "Facilitador(a)", tipo: "text", maxLength: 120, ancho: "completo" },
];

const CAMPOS_PARTICIPANTE: CampoUI[] = [
  { clave: "nombre", etiqueta: "Nombre completo", tipo: "text", requerido: true, maxLength: 120, ancho: "completo" },
  { clave: "cargo", etiqueta: "Cargo en la estructura", tipo: "select", requerido: true, opciones: OPC.cargo },
  { clave: "provincia", etiqueta: "Provincia", tipo: "select", requerido: true, opciones: OPC.provincia },
  { clave: "telefono", etiqueta: "Teléfono", tipo: "tel", requerido: true, placeholder: "809-000-0000", ancho: "completo" },
  { clave: "consentimiento", etiqueta: "La persona autorizó el registro de sus datos para el curso y su certificado (Ley 172-13).", tipo: "checkbox", requerido: true },
];

export default function EducacionPanel({ inicial }: { inicial: Datos }) {
  const [datos, setDatos] = useState<Datos>(inicial);
  const [pestana, setPestana] = useState<Pestana>("programa");
  const [cursoSel, setCursoSel] = useState<string>(() => inicial.cursos.find((c) => c.estado !== "CANCELADO")?.id ?? "");
  const [error, setError] = useState<string | null>(null);

  const cursoPorId = useMemo(() => new Map(datos.cursos.map((c) => [c.id, c])), [datos.cursos]);
  const inscritosDe = (id: string) => datos.participantes.filter((p) => p.curso_id === id);
  const certificados = datos.participantes.filter((p) => tieneCertificado(p, cursoPorId.get(String(p.curso_id))));

  const activos = datos.cursos.filter((c) => c.estado !== "CANCELADO");
  const conAsistencia = datos.participantes.filter((p) => {
    const e = cursoPorId.get(String(p.curso_id))?.estado;
    return e === "EN_CURSO" || e === "FINALIZADO";
  });
  const pctAsistencia = conAsistencia.length ? Math.round((conAsistencia.filter((p) => p.asistio).length / conAsistencia.length) * 100) : null;

  async function cambiar(c: "cursos" | "participantes", id: string, cambios: Record<string, unknown>) {
    setError(null);
    const res = await fetch(`/api/educacion/${c}/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cambios) });
    const json = await res.json();
    if (res.ok && json.ok) setDatos((d) => ({ ...d, [c]: d[c].map((r) => (r.id === id ? json.registro : r)) }));
    else setError(json.errores?._formulario ?? "No se pudo actualizar.");
  }
  async function eliminar(c: "cursos" | "participantes", id: string) {
    const aviso = c === "cursos" ? "¿Eliminar el curso y todos sus participantes?" : "¿Quitar a esta persona del curso?";
    if (!confirm(aviso)) return;
    const res = await fetch(`/api/educacion/${c}/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setDatos((d) =>
      c === "cursos"
        ? { cursos: d.cursos.filter((x) => x.id !== id), participantes: d.participantes.filter((p) => p.curso_id !== id) }
        : { ...d, participantes: d.participantes.filter((x) => x.id !== id) },
    );
    if (c === "cursos" && cursoSel === id) setCursoSel("");
  }

  const resumen = [
    { titulo: "Cursos programados", valor: `${activos.length}`, nota: `${activos.filter((c) => c.estado === "PROGRAMADO").length} por realizar`, icono: "calendario" as const },
    { titulo: "Participantes", valor: `${datos.participantes.length}`, nota: "Inscritos en total", icono: "contactos" as const },
    { titulo: "Asistencia", valor: pctAsistencia === null ? "—" : `${pctAsistencia} %`, nota: "En cursos realizados o en curso", icono: "check" as const },
    { titulo: "Certificados", valor: `${certificados.length}`, nota: "Listos para imprimir", icono: "documento" as const },
  ];

  const pestanas = [
    { id: "programa" as const, nombre: "Programa de formación", icono: "calendario" as const, total: datos.cursos.length },
    { id: "participantes" as const, nombre: "Participantes y asistencia", icono: "contactos" as const, total: datos.participantes.length },
    { id: "certificados" as const, nombre: "Certificados", icono: "documento" as const, total: certificados.length },
  ];

  const curso = cursoPorId.get(cursoSel);
  const inscritos = curso ? inscritosDe(curso.id) : [];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {resumen.map((k, i) => (
          <article key={k.titulo} className="panel tarjeta-viva animar-entrada group rounded-2xl p-5" style={{ animationDelay: `${i * 70}ms` }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{k.titulo}</p>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:scale-110 group-hover:bg-gradiente group-hover:text-white">
                <Icono nombre={k.icono} className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-2 text-[32px] font-extrabold leading-none tracking-tight text-slate-900 tabular-nums">{k.valor}</p>
            <p className="mt-2 text-xs text-slate-500">{k.nota}</p>
          </article>
        ))}
      </section>

      <div role="tablist" aria-label="Áreas de educación" className="panel flex gap-1 overflow-x-auto rounded-2xl p-1.5">
        {pestanas.map((p) => {
          const on = pestana === p.id;
          return (
            <button
              key={p.id}
              role="tab"
              aria-selected={on}
              onClick={() => setPestana(p.id)}
              className={`flex shrink-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${on ? "btn-primario" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}
            >
              <Icono nombre={p.icono} className="h-4 w-4" />
              {p.nombre}
              <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${on ? "bg-white/25" : "bg-slate-100"}`}>{p.total}</span>
            </button>
          );
        })}
      </div>

      {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">{error}</p>}

      {pestana === "programa" && (
        <div key="programa" className="animar-entrada grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <FormularioRegistro
              titulo="Nuevo curso o taller"
              campos={CAMPOS_CURSO}
              endpoint="/api/educacion/cursos"
              boton="Agregar al programa"
              valoresFijos={{ alcance: "NACIONAL", modalidad: "PRESENCIAL", dirigido_a: "TODA_LA_ESTRUCTURA" }}
              extra={{ estado: "PROGRAMADO" }}
              onCreado={(r: Registro) => {
                setDatos((d) => ({ ...d, cursos: [r, ...d.cursos] }));
                if (!cursoSel) setCursoSel(r.id);
              }}
            />
          </div>
          <div className="space-y-3 xl:col-span-3">
            {datos.cursos.length === 0 ? (
              <Vacio icono="calendario" texto="Programe talleres y cursos para formar a coordinadores, supervisores, promotores y multiplicadores." />
            ) : (
              [...datos.cursos]
                .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
                .map((c) => {
                  const n = inscritosDe(c.id).length;
                  const cupo = Number(c.cupo) || 1;
                  const lleno = n >= cupo;
                  return (
                    <article key={c.id} className={`panel tarjeta-viva animar-entrada rounded-2xl p-5 ${c.estado === "CANCELADO" ? "opacity-60" : ""}`}>
                      <div className="flex items-start gap-4">
                        <div className="w-16 shrink-0 rounded-2xl bg-gradiente px-1 py-2.5 text-center text-white shadow-md shadow-blue-500/25">
                          <p className="text-2xl font-extrabold leading-none">{String(c.fecha).slice(8)}</p>
                          <p className="mt-1 text-[10px] font-bold uppercase">{fecha(c.fecha, { month: "short" })}</p>
                          {c.hora ? <p className="mt-1 text-[10px] opacity-90">{String(c.hora)}</p> : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Chip fuerte>{etiqueta(OPC.tema, c.tema)}</Chip>
                            <Chip>{etiqueta(OPC.modalidad, c.modalidad)}</Chip>
                            <Chip>{c.alcance === "NACIONAL" ? "Nacional" : nombreProvincia(c.provincia)}</Chip>
                          </div>
                          <h4 className="mt-2 text-base font-bold text-slate-900">{String(c.titulo)}</h4>
                          <p className="text-sm text-slate-600">
                            Para {etiqueta(OPC.dirigidoA, c.dirigido_a).toLowerCase()}
                            {c.duracion_horas ? ` · ${String(c.duracion_horas)} h` : ""}
                            {c.facilitador ? ` · ${String(c.facilitador)}` : ""}
                          </p>
                          {c.sede ? <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><Icono nombre="mapa" className="h-3.5 w-3.5" />{String(c.sede)}</p> : null}
                          <div className="mt-3">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium text-slate-600">Inscritos</span>
                              <span className={`font-bold tabular-nums ${lleno ? "text-blue-800" : "text-slate-900"}`}>{n} / {cupo}{lleno ? " · completo" : ""}</span>
                            </div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div className="animar-crecer-x h-full rounded-full bg-gradiente" style={{ width: `${Math.min(100, (n / cupo) * 100)}%` }} />
                            </div>
                          </div>
                        </div>
                        <BotonEliminar onClick={() => eliminar("cursos", c.id)} />
                      </div>
                      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                        <label className="text-xs font-semibold text-slate-500" htmlFor={`estado-${c.id}`}>Estado</label>
                        <select
                          id={`estado-${c.id}`}
                          value={String(c.estado)}
                          onChange={(e) => cambiar("cursos", c.id, { estado: e.target.value })}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
                        >
                          {OPC.estadoCurso.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
                        </select>
                        <button
                          onClick={() => {
                            setCursoSel(c.id);
                            setPestana("participantes");
                          }}
                          className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
                        >
                          Participantes y asistencia <Icono nombre="flecha" className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </article>
                  );
                })
            )}
          </div>
        </div>
      )}

      {pestana === "participantes" && (
        <div key="participantes" className="animar-entrada space-y-6">
          {activos.length === 0 ? (
            <Vacio icono="contactos" texto="Primero programe un curso en «Programa de formación»." />
          ) : (
            <>
              <section className="panel flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center">
                <label htmlFor="curso-sel" className="text-sm font-bold text-slate-900">Curso</label>
                <div className="relative flex-1">
                  <select
                    id="curso-sel"
                    value={cursoSel}
                    onChange={(e) => setCursoSel(e.target.value)}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                  >
                    <option value="">Seleccione un curso…</option>
                    {activos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {fecha(c.fecha, { day: "numeric", month: "short" })} · {String(c.titulo)} ({inscritosDe(c.id).length}/{String(c.cupo)})
                      </option>
                    ))}
                  </select>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500"><path d="m6 9 6 6 6-6" /></svg>
                </div>
                {curso && <Estado valor={String(curso.estado)} />}
              </section>

              {curso ? (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                  <div className="xl:col-span-2">
                    {curso.estado === "FINALIZADO" ? (
                      <Vacio icono="documento" texto="El curso está finalizado: ya no admite inscripciones. Marque la asistencia y emita los certificados." />
                    ) : (
                      <FormularioRegistro
                        titulo="Inscribir participante"
                        campos={CAMPOS_PARTICIPANTE}
                        endpoint="/api/educacion/participantes"
                        boton="Inscribir"
                        valoresFijos={curso.provincia ? { provincia: String(curso.provincia) } : {}}
                        extra={{ curso_id: curso.id }}
                        onCreado={(r: Registro) => setDatos((d) => ({ ...d, participantes: [r, ...d.participantes] }))}
                      />
                    )}
                  </div>
                  <div className="xl:col-span-3">
                    {inscritos.length === 0 ? (
                      <Vacio icono="contactos" texto="Aún no hay inscritos en este curso." />
                    ) : (
                      <div className="panel overflow-hidden rounded-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
                          <h3 className="text-base font-bold text-slate-900">Lista de asistencia</h3>
                          <span className="text-xs font-semibold text-slate-500 tabular-nums">
                            {inscritos.filter((p) => p.asistio).length} de {inscritos.length} asistieron
                          </span>
                        </div>
                        <ul className="divide-y divide-slate-100">
                          {inscritos.map((p) => {
                            const cert = tieneCertificado(p, curso);
                            return (
                              <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3 transition hover:bg-blue-50/40">
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradiente text-xs font-extrabold text-white">
                                  {String(p.nombre).split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase()}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-semibold text-slate-900">{String(p.nombre)}</p>
                                  <p className="text-xs text-slate-500">
                                    {etiqueta(OPC.cargo, p.cargo)} · {nombreProvincia(p.provincia)} · {String(p.telefono ?? "")}
                                  </p>
                                </div>
                                <Interruptor
                                  activo={p.asistio === true}
                                  deshabilitado={curso.estado === "PROGRAMADO"}
                                  onCambio={(v) => cambiar("participantes", p.id, { asistio: v })}
                                />
                                {cert && (
                                  <a href={`/certificado/${p.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100">
                                    <Icono nombre="documento" className="h-3.5 w-3.5" /> Certificado
                                  </a>
                                )}
                                <BotonEliminar onClick={() => eliminar("participantes", p.id)} />
                              </li>
                            );
                          })}
                        </ul>
                        {curso.estado === "PROGRAMADO" && (
                          <p className="border-t border-slate-100 bg-blue-50/50 px-5 py-2.5 text-xs text-slate-600">
                            La asistencia se marca cuando el curso pasa a «En curso» o «Finalizado».
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Vacio icono="contactos" texto="Seleccione un curso para inscribir participantes y marcar su asistencia." />
              )}
            </>
          )}
        </div>
      )}

      {pestana === "certificados" && (
        <div key="certificados" className="animar-entrada">
          {certificados.length === 0 ? (
            <Vacio icono="documento" texto="Los certificados aparecen aquí cuando un curso está finalizado y la persona asistió." />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {certificados.map((p) => {
                const c = cursoPorId.get(String(p.curso_id));
                return (
                  <a key={p.id} href={`/certificado/${p.id}`} target="_blank" rel="noreferrer" className="panel tarjeta-viva group block rounded-2xl p-5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradiente text-white shadow-md shadow-blue-500/25">
                        <Icono nombre="documento" className="h-5 w-5" />
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Certificado</span>
                    </div>
                    <p className="mt-3 font-bold text-slate-900">{String(p.nombre)}</p>
                    <p className="text-sm text-slate-600">{String(c?.titulo ?? "")}</p>
                    <p className="mt-1 text-xs text-slate-500">{fecha(c?.fecha, { day: "numeric", month: "long", year: "numeric" })}</p>
                    <p className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700">
                      Ver e imprimir <Icono nombre="flecha" className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                    </p>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Interruptor({ activo, deshabilitado, onCambio }: { activo: boolean; deshabilitado?: boolean; onCambio: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={activo}
      aria-label="Asistió"
      disabled={deshabilitado}
      onClick={() => onCambio(!activo)}
      className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className={`relative h-6 w-11 rounded-full transition ${activo ? "bg-blue-600" : "bg-slate-200"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${activo ? "left-[22px]" : "left-0.5"}`} />
      </span>
      {activo ? "Asistió" : "No asistió"}
    </button>
  );
}

function Chip({ children, fuerte }: { children: React.ReactNode; fuerte?: boolean }) {
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${fuerte ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>{children}</span>;
}

function Estado({ valor }: { valor: string }) {
  const estilo =
    valor === "FINALIZADO" ? "bg-blue-600 text-white" : valor === "EN_CURSO" ? "bg-sky-100 text-sky-800" : valor === "CANCELADO" ? "bg-slate-200 text-slate-500" : "bg-blue-50 text-blue-700";
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${estilo}`}>{etiqueta(OPC.estadoCurso, valor)}</span>;
}

function BotonEliminar({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Eliminar" title="Eliminar" className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600">
      <Icono nombre="cerrar" className="h-4 w-4" />
    </button>
  );
}

function Vacio({ icono, texto }: { icono: "calendario" | "contactos" | "documento"; texto: string }) {
  return (
    <div className="grid h-full min-h-56 place-items-center rounded-2xl border-2 border-dashed border-blue-200 bg-white/50 p-8 text-center">
      <div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">
          <Icono nombre={icono} className="h-7 w-7" />
        </span>
        <p className="mx-auto mt-3 max-w-sm text-sm text-slate-500">{texto}</p>
      </div>
    </div>
  );
}
