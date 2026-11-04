"use client";

import { useState, type FormEvent } from "react";
import Icono from "@/components/Icono";
import { SECCIONES, type Campo } from "@/lib/inscripcion/campos";
import { formatearCedula } from "@/lib/jce/cedula";

type Valores = Record<string, string | boolean>;

const ETIQUETA_ORIGEN: Record<Campo["origen"], string> = {
  JCE_CEDULA: "JCE · Cédula",
  JCE_PADRON: "JCE · Padrón",
  CONTACTO: "Contacto",
  SUPERVISOR: "Supervisor",
  CONSENTIMIENTO: "Ley 172-13",
};

function valoresIniciales(): Valores {
  const v: Valores = {};
  for (const s of SECCIONES) for (const c of s.campos) v[c.clave] = c.tipo === "checkbox" ? false : "";
  v.nacionalidad = "Dominicana";
  return v;
}

function esVisible(campo: Campo, valores: Valores): boolean {
  if (!campo.visibleSi) return true;
  return valores[campo.visibleSi.clave] === campo.visibleSi.valor;
}

const lleno = (v: string | boolean | undefined) => (typeof v === "boolean" ? v : Boolean(v?.trim()));

function seccionCompleta(campos: readonly Campo[], valores: Valores) {
  const req = campos.filter((c) => c.requerido && esVisible(c, valores));
  return req.length > 0 && req.every((c) => lleno(valores[c.clave]));
}

const COLORES_CONFETI = ["#1d4ed8", "#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#0ea5e9"];

function Confeti() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden">
      {Array.from({ length: 36 }, (_, i) => (
        <span
          key={i}
          className="confeti absolute top-0 block rounded-sm"
          style={{
            left: `${(i * 37) % 100}%`,
            width: i % 3 ? 8 : 6,
            height: i % 3 ? 12 : 6,
            background: COLORES_CONFETI[i % COLORES_CONFETI.length],
            animationDelay: `${(i % 9) * 60}ms`,
            ["--dx" as string]: `${((i * 53) % 120) - 60}px`,
          }}
        />
      ))}
    </div>
  );
}

/** Separa "1. Datos del supervisor" en número y título. */
function partirTitulo(t: string) {
  const m = t.match(/^(\d+)\.\s*(.*)$/);
  return m ? { n: m[1], texto: m[2] } : { n: "", texto: t };
}

const claseInput =
  "peer w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-rose-500/10";

export default function InscripcionForm() {
  const [valores, setValores] = useState<Valores>(valoresIniciales);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok">("idle");
  const [resultado, setResultado] = useState<{ id: string; modo: string } | null>(null);

  const requeridos = SECCIONES.flatMap((s) => s.campos).filter((c) => c.requerido && esVisible(c, valores));
  const completos = requeridos.filter((c) => lleno(valores[c.clave])).length;
  const progreso = requeridos.length ? Math.round((completos / requeridos.length) * 100) : 0;

  const cambiar = (clave: string, valor: string | boolean) => {
    setValores((v) => ({ ...v, [clave]: valor }));
    setErrores((e) => {
      if (!e[clave]) return e;
      const { [clave]: _omit, ...resto } = e;
      return resto;
    });
  };

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    setEstado("enviando");
    const cuerpo: Valores = {};
    for (const s of SECCIONES)
      for (const c of s.campos) if (esVisible(c, valores)) cuerpo[c.clave] = valores[c.clave];
    try {
      const res = await fetch("/api/inscripciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setResultado({ id: json.id, modo: json.modo });
        setEstado("ok");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setErrores(json.errores ?? { _formulario: "No se pudo completar la inscripción." });
      const primero = Object.keys(json.errores ?? {}).find((k) => k !== "_formulario");
      if (primero) document.getElementById(primero)?.focus();
    } catch {
      setErrores({ _formulario: "Error de conexión. Verifique su internet e intente de nuevo." });
    }
    setEstado("idle");
  }

  if (estado === "ok" && resultado) {
    return (
      <div role="status" className="panel animar-entrada relative overflow-hidden rounded-3xl p-8 text-center">
        <div aria-hidden className="absolute inset-x-0 top-0 h-1.5 bg-gradiente" />
        <div aria-hidden className="absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-sky-300/30 blur-3xl" />
        <Confeti />
        <span className="relative mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradiente text-white shadow-xl shadow-blue-500/30">
          <Icono nombre="check" className="h-8 w-8" />
        </span>
        <h2 className="relative mt-5 text-2xl font-extrabold tracking-tight text-slate-900">Inscripción recibida</h2>
        <p className="relative mx-auto mt-2 max-w-md text-sm text-slate-600">
          Gracias por inscribirse. Número de solicitud:
          <code className="mt-2 block rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-xs text-slate-800">{resultado.id}</code>
        </p>
        {resultado.modo === "demo" && (
          <p className="relative mt-3 text-xs font-medium text-sky-700">Modo demostración: el registro se guardó en memoria y no es persistente.</p>
        )}
        <button
          type="button"
          className="btn-primario relative mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
          onClick={() => {
            // El mismo supervisor suele inscribir a varias personas: se conservan sus datos.
            setValores((v) => {
              const nuevos = valoresIniciales();
              for (const k of Object.keys(nuevos)) if (k.startsWith("supervisor_")) nuevos[k] = v[k];
              return nuevos;
            });
            setResultado(null);
            setEstado("idle");
          }}
        >
          <Icono nombre="mas" className="h-4 w-4" /> Nueva inscripción
        </button>
      </div>
    );
  }

  const totalErrores = Object.keys(errores).length;

  return (
    <form onSubmit={enviar} noValidate className="panel animar-entrada relative rounded-3xl">
      {/* Cabecera del área: progreso y accesos a cada sección */}
      <div className="sticky top-16 z-10 rounded-t-3xl border-b border-slate-100 bg-white/90 px-5 pt-5 pb-3 backdrop-blur-xl sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-semibold text-slate-600">
            Obligatorios completados <span className="tabular-nums text-slate-900">{completos}/{requeridos.length}</span>
          </p>
          <p className="text-xs font-extrabold tabular-nums texto-gradiente">{progreso} %</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso del formulario">
          <div className="con-reflejo h-full rounded-full bg-gradiente transition-[width] duration-500" style={{ width: `${progreso}%` }} />
        </div>
        <nav aria-label="Secciones del formulario" className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {SECCIONES.map((s) => {
            const { n, texto } = partirTitulo(s.titulo);
            const conError = s.campos.some((c) => errores[c.clave]);
            const completa = seccionCompleta(s.campos, valores);
            return (
              <a
                key={s.id}
                href={`#sec-${s.id}`}
                className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold transition duration-300 hover:-translate-y-0.5 ${
                  conError
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : completa
                      ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/30"
                      : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
                }`}
              >
                {completa && !conError && <Icono nombre="check" className="h-3 w-3" />}
                {n}. {texto}
              </a>
            );
          })}
        </nav>
      </div>

      <div className="px-5 sm:px-8">
        {totalErrores > 0 && (
          <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-rose-500 text-[11px] font-bold text-white">!</span>
            {errores._formulario ?? `Revise ${totalErrores} campo(s) marcados en rojo.`}
          </div>
        )}

        {SECCIONES.map((seccion) => {
          const { n, texto } = partirTitulo(seccion.titulo);
          const completa = seccionCompleta(seccion.campos, valores);
          return (
            <fieldset key={seccion.id} id={`sec-${seccion.id}`} className="scroll-mt-48 border-b border-slate-100 py-8 last:border-b-0">
              <legend className="contents">
                <span className="flex items-center gap-3">
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white shadow-lg transition duration-500 ${completa ? "scale-110 bg-blue-600 shadow-blue-600/40 ring-4 ring-blue-100" : "bg-gradiente shadow-blue-500/25"}`}>
                    {completa ? <Icono nombre="check" className="h-5 w-5" /> : n}
                  </span>
                  <span className="text-lg font-bold tracking-tight text-slate-900">{texto}</span>
                </span>
              </legend>
              <p className="mt-1.5 mb-5 pl-12 text-sm text-slate-500">{seccion.descripcion}</p>
              <div className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2 sm:pl-12">
                {seccion.campos.filter((c) => esVisible(c, valores)).map((c) => (
                  <CampoFormulario key={c.clave} campo={c} valor={valores[c.clave]} error={errores[c.clave]} onChange={cambiar} />
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="sticky bottom-0 flex flex-col gap-3 rounded-b-3xl border-t border-slate-100 bg-white/90 px-5 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="flex items-center gap-2 text-xs text-slate-500">
          <Icono nombre="escudo" className="h-4 w-4 text-blue-600" /> Los campos con <span className="font-bold text-rose-500">*</span> son obligatorios. Datos protegidos por la Ley 172-13.
        </p>
        <button type="submit" disabled={estado === "enviando"} className="btn-primario inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold">
          {estado === "enviando" ? "Enviando…" : "Enviar inscripción"}
          <Icono nombre="flecha" className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

function CampoFormulario({
  campo,
  valor,
  error,
  onChange,
}: {
  campo: Campo;
  valor: string | boolean;
  error?: string;
  onChange: (clave: string, valor: string | boolean) => void;
}) {
  const idAyuda = `${campo.clave}-ayuda`;
  const idError = `${campo.clave}-error`;
  const describedBy = [campo.ayuda && !error ? idAyuda : "", error ? idError : ""].filter(Boolean).join(" ") || undefined;
  const comunes = {
    id: campo.clave,
    name: campo.clave,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
    required: campo.requerido,
  };
  const ancho = campo.ancho === "completo" || campo.tipo === "textarea" ? "sm:col-span-2" : "";
  const mensajeError = error && (
    <p id={idError} className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-600">
      {error}
    </p>
  );

  if (campo.tipo === "checkbox") {
    const marcado = valor === true;
    return (
      <div className={campo.ancho === "completo" ? "sm:col-span-2" : ""}>
        <label
          className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 text-sm transition ${
            marcado ? "border-blue-300 bg-gradient-to-r from-blue-50 to-sky-50/60" : "border-slate-200 bg-white/70 hover:border-slate-300"
          } ${error ? "border-rose-300" : ""}`}
        >
          <input
            {...comunes}
            type="checkbox"
            className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded accent-blue-600"
            checked={marcado}
            onChange={(e) => onChange(campo.clave, e.target.checked)}
          />
          <span className="text-slate-700">
            {campo.etiqueta}
            {campo.requerido && <span className="font-bold text-rose-500"> *</span>}
          </span>
        </label>
        {mensajeError}
      </div>
    );
  }

  const texto = typeof valor === "string" ? valor : "";
  let control;
  if (campo.tipo === "select") {
    control = (
      <div className="relative">
        <select {...comunes} className={`${claseInput} cursor-pointer appearance-none pr-10`} value={texto} onChange={(e) => onChange(campo.clave, e.target.value)}>
          <option value="">Seleccione…</option>
          {campo.opciones?.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
        </select>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500"><path d="m6 9 6 6 6-6" /></svg>
      </div>
    );
  } else if (campo.tipo === "textarea") {
    control = (
      <textarea {...comunes} rows={3} maxLength={campo.maxLength} className={claseInput} value={texto} onChange={(e) => onChange(campo.clave, e.target.value)} />
    );
  } else {
    const esCedula = campo.tipo === "cedula";
    control = (
      <input
        {...comunes}
        type={esCedula ? "text" : campo.tipo}
        inputMode={esCedula ? "numeric" : campo.tipo === "tel" ? "tel" : undefined}
        autoComplete="off"
        placeholder={campo.placeholder}
        maxLength={esCedula ? 13 : campo.maxLength}
        className={`${claseInput} ${esCedula ? "font-mono tracking-wider" : ""}`}
        value={texto}
        onChange={(e) => onChange(campo.clave, esCedula ? formatearCedula(e.target.value) : e.target.value)}
      />
    );
  }

  return (
    <div className={ancho}>
      <label htmlFor={campo.clave} className="mb-1.5 flex items-center justify-between gap-2 text-[13px] font-semibold text-slate-700">
        <span>
          {campo.etiqueta}
          {campo.requerido && <span className="text-rose-500"> *</span>}
        </span>
        <span className="rounded-md bg-gradient-to-r from-blue-50 to-blue-50 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-blue-600">
          {ETIQUETA_ORIGEN[campo.origen]}
        </span>
      </label>
      {control}
      {campo.ayuda && !error && <p id={idAyuda} className="mt-1.5 text-xs text-slate-500">{campo.ayuda}</p>}
      {mensajeError}
    </div>
  );
}
