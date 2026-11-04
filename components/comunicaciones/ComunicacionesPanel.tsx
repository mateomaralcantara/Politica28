"use client";

import { useMemo, useState } from "react";
import Icono from "@/components/Icono";
import FormularioRegistro, { type CampoUI } from "@/components/FormularioRegistro";
import { OPC, etiqueta, type Registro } from "@/lib/comunicaciones/schema";
import { PROVINCIAS } from "@/lib/territorio/provincias";

type Datos = { lineas: Registro[]; medios: Registro[]; comunicadores: Registro[] };
type Pestana = "lineas" | "medios" | "comunicadores";

const dop = new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 });
const fechaCorta = (f: unknown) =>
  typeof f === "string" && f ? new Intl.DateTimeFormat("es-DO", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${f}T00:00:00Z`)) : "";
const nombreProvincia = (c: unknown) => PROVINCIAS.find((p) => p.codigo === c)?.nombre ?? "";

const CAMPOS_LINEA: CampoUI[] = [
  { clave: "titulo", etiqueta: "Eje o tema", tipo: "text", requerido: true, maxLength: 120, placeholder: "Ej.: Empleo para la juventud", ancho: "completo" },
  { clave: "mensaje", etiqueta: "Mensaje central", tipo: "textarea", requerido: true, maxLength: 600, placeholder: "La idea que todos los voceros deben transmitir…" },
  { clave: "publico", etiqueta: "Público", tipo: "select", requerido: true, opciones: OPC.publico },
  { clave: "tono", etiqueta: "Tono", tipo: "select", requerido: true, opciones: OPC.tono },
  { clave: "palabras_clave", etiqueta: "Palabras clave / etiquetas", tipo: "text", maxLength: 200, placeholder: "#Juventud, empleo, futuro", ancho: "completo" },
  { clave: "vigencia_desde", etiqueta: "Vigente desde", tipo: "date" },
  { clave: "vigencia_hasta", etiqueta: "Vigente hasta", tipo: "date" },
  { clave: "estado", etiqueta: "Estado", tipo: "select", requerido: true, opciones: OPC.estadoLinea },
];

const camposMedio = (lineas: Registro[]): CampoUI[] => [
  { clave: "accion", etiqueta: "Acción", tipo: "text", requerido: true, maxLength: 140, placeholder: "Ej.: Entrevista matutina", ancho: "completo" },
  { clave: "tipo_medio", etiqueta: "Tipo de medio", tipo: "select", requerido: true, opciones: OPC.tipoMedio },
  { clave: "medio", etiqueta: "Medio o plataforma", tipo: "text", requerido: true, maxLength: 120, placeholder: "Nombre del programa, emisora o red" },
  { clave: "alcance", etiqueta: "Alcance", tipo: "select", requerido: true, opciones: OPC.alcance },
  { clave: "provincia", etiqueta: "Provincia", tipo: "select", requerido: true, opciones: OPC.provincia, visibleSi: (v) => v.alcance === "PROVINCIAL" },
  { clave: "fecha_inicio", etiqueta: "Fecha de inicio", tipo: "date", requerido: true },
  { clave: "fecha_fin", etiqueta: "Fecha de fin", tipo: "date" },
  {
    clave: "linea_id",
    etiqueta: "Línea comunicacional",
    tipo: "select",
    opciones: lineas.map((l) => ({ valor: l.id, etiqueta: String(l.titulo) })),
    ayuda: lineas.length ? undefined : "Cree primero una línea para vincularla.",
  },
  { clave: "responsable", etiqueta: "Responsable", tipo: "text", maxLength: 120 },
  { clave: "presupuesto", etiqueta: "Presupuesto (RD$)", tipo: "number", placeholder: "0" },
  { clave: "estado", etiqueta: "Estado", tipo: "select", requerido: true, opciones: OPC.estadoMedio },
];

const CAMPOS_COMUNICADOR: CampoUI[] = [
  { clave: "nombre", etiqueta: "Nombre completo", tipo: "text", requerido: true, maxLength: 120, ancho: "completo" },
  { clave: "provincia", etiqueta: "Provincia", tipo: "select", requerido: true, opciones: OPC.provincia },
  { clave: "municipio", etiqueta: "Municipio", tipo: "text", maxLength: 80 },
  { clave: "rol", etiqueta: "Rol en la red", tipo: "select", requerido: true, opciones: OPC.rolComunicador, ancho: "completo" },
  { clave: "medio_plataforma", etiqueta: "Medio o plataforma", tipo: "text", maxLength: 120, placeholder: "Emisora, canal, periódico o red" },
  { clave: "redes", etiqueta: "Usuario en redes", tipo: "text", maxLength: 160, placeholder: "@usuario" },
  { clave: "telefono", etiqueta: "Teléfono", tipo: "tel", requerido: true, placeholder: "809-000-0000" },
  { clave: "email", etiqueta: "Correo", tipo: "email", maxLength: 160 },
  { clave: "consentimiento", etiqueta: "La persona autorizó el registro de sus datos de contacto para coordinar la red (Ley 172-13).", tipo: "checkbox", requerido: true },
];

export default function ComunicacionesPanel({ inicial }: { inicial: Datos }) {
  const [datos, setDatos] = useState<Datos>(inicial);
  const [pestana, setPestana] = useState<Pestana>("lineas");
  const [provincia, setProvincia] = useState<string | null>(null);

  const agregar = (c: Pestana) => (r: Registro) => setDatos((d) => ({ ...d, [c]: [r, ...d[c]] }));
  async function eliminar(c: Pestana, id: string) {
    if (!confirm("¿Eliminar este registro?")) return;
    const res = await fetch(`/api/comunicaciones/${c}/${id}`, { method: "DELETE" });
    if (res.ok) setDatos((d) => ({ ...d, [c]: d[c].filter((r) => r.id !== id) }));
  }

  const aprobadas = datos.lineas.filter((l) => l.estado === "APROBADO").length;
  const presupuesto = datos.medios.filter((m) => m.estado !== "CANCELADO").reduce((s, m) => s + (Number(m.presupuesto) || 0), 0);
  const porProvincia = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of datos.comunicadores) m[String(c.provincia)] = (m[String(c.provincia)] ?? 0) + 1;
    return m;
  }, [datos.comunicadores]);
  const cubiertas = Object.keys(porProvincia).length;

  const resumen = [
    { titulo: "Mensajes aprobados", valor: `${aprobadas}`, nota: `${datos.lineas.length} en la línea comunicacional`, icono: "mensaje" as const },
    { titulo: "Acciones en el plan", valor: `${datos.medios.length}`, nota: `${dop.format(presupuesto)} presupuestados`, icono: "calendario" as const },
    { titulo: "Comunicadores", valor: `${datos.comunicadores.length}`, nota: `${cubiertas} de 32 provincias cubiertas`, icono: "red" as const },
  ];

  const pestanas: Array<{ id: Pestana; nombre: string; icono: "mensaje" | "calendario" | "red"; total: number }> = [
    { id: "lineas", nombre: "Línea comunicacional", icono: "mensaje", total: datos.lineas.length },
    { id: "medios", nombre: "Plan de medios", icono: "calendario", total: datos.medios.length },
    { id: "comunicadores", nombre: "Red nacional de comunicadores", icono: "red", total: datos.comunicadores.length },
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

      <div role="tablist" aria-label="Áreas de comunicación" className="panel flex gap-1 overflow-x-auto rounded-2xl p-1.5">
        {pestanas.map((p) => {
          const on = pestana === p.id;
          return (
            <button
              key={p.id}
              role="tab"
              aria-selected={on}
              onClick={() => setPestana(p.id)}
              className={`flex shrink-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                on ? "btn-primario" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              <Icono nombre={p.icono} className="h-4 w-4" />
              {p.nombre}
              <span className={`rounded-full px-1.5 text-[11px] tabular-nums ${on ? "bg-white/25" : "bg-slate-100"}`}>{p.total}</span>
            </button>
          );
        })}
      </div>

      {pestana === "lineas" && (
        <div key="lineas" className="animar-entrada grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <FormularioRegistro titulo="Nuevo mensaje" campos={CAMPOS_LINEA} endpoint="/api/comunicaciones/lineas" boton="Agregar a la línea" valoresFijos={{ estado: "BORRADOR" }} onCreado={agregar("lineas")} />
          </div>
          <div className="space-y-3 xl:col-span-3">
            {datos.lineas.length === 0 ? (
              <Vacio icono="mensaje" texto="Defina los ejes y mensajes centrales que deben repetir todos los voceros." />
            ) : (
              datos.lineas.map((l) => (
                <article key={l.id} className="panel tarjeta-viva animar-entrada rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Estado valor={String(l.estado)} texto={etiqueta(OPC.estadoLinea, l.estado)} />
                        <Chip>{etiqueta(OPC.publico, l.publico)}</Chip>
                        <Chip>Tono {etiqueta(OPC.tono, l.tono).toLowerCase()}</Chip>
                      </div>
                      <h4 className="mt-2 text-base font-bold text-slate-900">{String(l.titulo)}</h4>
                    </div>
                    <BotonEliminar onClick={() => eliminar("lineas", l.id)} />
                  </div>
                  <blockquote className="mt-2 border-l-4 border-blue-500 pl-3 text-sm leading-relaxed text-slate-700">{String(l.mensaje)}</blockquote>
                  {(l.palabras_clave || l.vigencia_desde) ? (
                    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {l.palabras_clave ? <span>{String(l.palabras_clave)}</span> : null}
                      {l.vigencia_desde ? <span>Vigente {fechaCorta(l.vigencia_desde)}{l.vigencia_hasta ? ` – ${fechaCorta(l.vigencia_hasta)}` : ""}</span> : null}
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </div>
      )}

      {pestana === "medios" && (
        <div key="medios" className="animar-entrada grid grid-cols-1 gap-6 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <FormularioRegistro titulo="Nueva acción en medios" campos={camposMedio(datos.lineas)} endpoint="/api/comunicaciones/medios" boton="Agregar al plan" valoresFijos={{ estado: "PLANIFICADO", alcance: "NACIONAL" }} onCreado={agregar("medios")} />
          </div>
          <div className="xl:col-span-3">
            {datos.medios.length === 0 ? (
              <Vacio icono="calendario" texto="Programe entrevistas, pautas, publicaciones y ruedas de prensa por medio y provincia." />
            ) : (
              <div className="panel overflow-hidden rounded-2xl">
                <ul className="divide-y divide-slate-100">
                  {[...datos.medios]
                    .sort((a, b) => String(a.fecha_inicio).localeCompare(String(b.fecha_inicio)))
                    .map((m) => {
                      const linea = datos.lineas.find((l) => l.id === m.linea_id);
                      return (
                        <li key={m.id} className="group flex items-start gap-4 p-4 transition hover:bg-blue-50/40">
                          <div className="w-14 shrink-0 rounded-xl bg-gradiente px-1 py-2 text-center text-white shadow-md shadow-blue-500/25">
                            <p className="text-lg font-extrabold leading-none">{String(m.fecha_inicio).slice(8)}</p>
                            <p className="mt-0.5 text-[10px] font-semibold uppercase">{fechaCorta(m.fecha_inicio).split(" ")[1]}</p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Estado valor={String(m.estado)} texto={etiqueta(OPC.estadoMedio, m.estado)} />
                              <Chip>{etiqueta(OPC.tipoMedio, m.tipo_medio)}</Chip>
                              <Chip>{m.alcance === "NACIONAL" ? "Nacional" : nombreProvincia(m.provincia)}</Chip>
                            </div>
                            <p className="mt-1.5 font-semibold text-slate-900">{String(m.accion)}</p>
                            <p className="text-sm text-slate-600">
                              {String(m.medio)}
                              {m.fecha_fin ? ` · hasta ${fechaCorta(m.fecha_fin)}` : ""}
                              {m.responsable ? ` · ${String(m.responsable)}` : ""}
                            </p>
                            {linea && <p className="mt-1 text-xs font-medium text-blue-700">Línea: {String(linea.titulo)}</p>}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {m.presupuesto !== undefined && m.presupuesto !== null && <p className="text-sm font-bold text-slate-900 tabular-nums">{dop.format(Number(m.presupuesto))}</p>}
                            <BotonEliminar onClick={() => eliminar("medios", m.id)} />
                          </div>
                        </li>
                      );
                    })}
                </ul>
                <div className="flex items-center justify-between border-t border-slate-100 bg-blue-50/50 px-4 py-3 text-sm">
                  <span className="font-semibold text-slate-600">Presupuesto total (sin canceladas)</span>
                  <span className="font-extrabold text-blue-800 tabular-nums">{dop.format(presupuesto)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {pestana === "comunicadores" && (
        <div key="comunicadores" className="animar-entrada space-y-6">
          <section className="panel rounded-3xl p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900">Cobertura por provincia</h3>
              <p className="text-xs text-slate-500">Toque una provincia para ver y registrar sus comunicadores</p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
              <BotonProvincia nombre="Todas" total={datos.comunicadores.length} activo={provincia === null} onClick={() => setProvincia(null)} />
              {PROVINCIAS.map((p) => (
                <BotonProvincia key={p.codigo} nombre={p.nombre} total={porProvincia[p.codigo] ?? 0} activo={provincia === p.codigo} onClick={() => setProvincia(p.codigo)} />
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <FormularioRegistro
                titulo={provincia ? `Nuevo comunicador en ${nombreProvincia(provincia)}` : "Nuevo comunicador"}
                campos={CAMPOS_COMUNICADOR}
                endpoint="/api/comunicaciones/comunicadores"
                boton="Agregar a la red"
                valoresFijos={provincia ? { provincia } : {}}
                onCreado={agregar("comunicadores")}
              />
            </div>
            <div className="xl:col-span-3">
              <ListaComunicadores
                filas={datos.comunicadores.filter((c) => !provincia || c.provincia === provincia)}
                titulo={provincia ? nombreProvincia(provincia) : "Toda la red nacional"}
                onEliminar={(id) => eliminar("comunicadores", id)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ListaComunicadores({ filas, titulo, onEliminar }: { filas: Registro[]; titulo: string; onEliminar: (id: string) => void }) {
  if (filas.length === 0) return <Vacio icono="red" texto={`Aún no hay comunicadores registrados en ${titulo === "Toda la red nacional" ? "la red" : titulo}.`} />;
  return (
    <div className="panel rounded-2xl p-5">
      <h3 className="mb-3 text-base font-bold text-slate-900">
        {titulo} <span className="text-sm font-semibold text-slate-400">· {filas.length}</span>
      </h3>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {filas.map((c) => {
          const iniciales = String(c.nombre).split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
          return (
            <li key={c.id} className="tarjeta-viva group rounded-2xl border border-slate-100 bg-white/80 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradiente text-sm font-extrabold text-white shadow-md shadow-blue-500/25">{iniciales}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{String(c.nombre)}</p>
                  <p className="text-xs font-medium text-blue-700">{etiqueta(OPC.rolComunicador, c.rol)}</p>
                </div>
                <BotonEliminar onClick={() => onEliminar(c.id)} />
              </div>
              <dl className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex gap-1.5"><Icono nombre="mapa" className="h-3.5 w-3.5 text-slate-400" />{[c.municipio, nombreProvincia(c.provincia)].filter(Boolean).join(", ")}</div>
                {c.medio_plataforma ? <div className="flex gap-1.5"><Icono nombre="megafono" className="h-3.5 w-3.5 text-slate-400" />{String(c.medio_plataforma)}</div> : null}
                {c.redes ? <div className="flex gap-1.5"><Icono nombre="red" className="h-3.5 w-3.5 text-slate-400" />{String(c.redes)}</div> : null}
                <div className="flex gap-1.5"><Icono nombre="mensaje" className="h-3.5 w-3.5 text-slate-400" />{[c.telefono, c.email].filter(Boolean).join(" · ")}</div>
              </dl>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] text-slate-400">Los datos de contacto se muestran parcialmente ocultos para proteger la privacidad.</p>
    </div>
  );
}

function BotonProvincia({ nombre, total, activo, onClick }: { nombre: string; total: number; activo: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={activo}
      className={`group flex min-h-10 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition duration-200 hover:-translate-y-0.5 ${
        activo
          ? "border-blue-600 bg-gradiente text-white shadow-lg shadow-blue-500/30"
          : total > 0
            ? "border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-400"
            : "border-slate-200 bg-white/70 text-slate-500 hover:border-blue-300 hover:text-blue-700"
      }`}
    >
      <span className="leading-tight">{nombre}</span>
      <span className={`grid h-5 min-w-5 shrink-0 place-items-center rounded-full px-1 text-[10px] tabular-nums ${activo ? "bg-white/25" : total > 0 ? "bg-blue-600 text-white" : "bg-slate-100"}`}>{total}</span>
    </button>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{children}</span>;
}

function Estado({ valor, texto }: { valor: string; texto: string }) {
  const estilo =
    valor === "APROBADO" || valor === "EJECUTADO"
      ? "bg-blue-600 text-white"
      : valor === "EN_CURSO"
        ? "bg-sky-100 text-sky-800"
        : valor === "ARCHIVADO" || valor === "CANCELADO"
          ? "bg-slate-200 text-slate-500 line-through"
          : "bg-blue-50 text-blue-700";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${estilo}`}>{texto}</span>;
}

function BotonEliminar({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} aria-label="Eliminar" title="Eliminar" className="shrink-0 rounded-lg p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600">
      <Icono nombre="cerrar" className="h-4 w-4" />
    </button>
  );
}

function Vacio({ icono, texto }: { icono: "mensaje" | "calendario" | "red"; texto: string }) {
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
