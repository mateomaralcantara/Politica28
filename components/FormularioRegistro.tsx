"use client";

import { useState, type FormEvent } from "react";
import Icono from "@/components/Icono";
export type Opcion = { valor: string; etiqueta: string };

export type CampoUI = {
  clave: string;
  etiqueta: string;
  tipo: "text" | "textarea" | "select" | "date" | "time" | "tel" | "email" | "number" | "checkbox";
  requerido?: boolean;
  opciones?: readonly Opcion[];
  placeholder?: string;
  ayuda?: string;
  ancho?: "completo";
  maxLength?: number;
  visibleSi?: (v: Record<string, string | boolean>) => boolean;
};

const claseInput =
  "w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15 aria-[invalid=true]:border-rose-400 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-rose-500/10";

function iniciales(campos: readonly CampoUI[], fijos: Record<string, string>) {
  const v: Record<string, string | boolean> = {};
  for (const c of campos) v[c.clave] = c.tipo === "checkbox" ? false : (fijos[c.clave] ?? "");
  return v;
}

export default function FormularioRegistro<T>({
  titulo,
  campos,
  endpoint,
  boton,
  valoresFijos = {},
  extra = {},
  onCreado,
}: {
  titulo: string;
  campos: readonly CampoUI[];
  endpoint: string;
  boton: string;
  valoresFijos?: Record<string, string>;
  /** Datos que se envían siempre pero no se muestran (p. ej. el curso seleccionado). */
  extra?: Record<string, unknown>;
  onCreado: (registro: T) => void;
}) {
  const [valores, setValores] = useState(() => iniciales(campos, valoresFijos));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(false);

  // Si cambian los valores fijos (p. ej. la provincia seleccionada), se aplican al formulario.
  const fijosClave = JSON.stringify(valoresFijos);
  const [fijosPrevios, setFijosPrevios] = useState(fijosClave);
  if (fijosClave !== fijosPrevios) {
    setFijosPrevios(fijosClave);
    setValores((v) => ({ ...v, ...valoresFijos }));
  }

  const visibles = campos.filter((c) => !c.visibleSi || c.visibleSi(valores));

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    const cuerpo = { ...Object.fromEntries(visibles.map((c) => [c.clave, valores[c.clave]])), ...extra };
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) });
      const json = await res.json();
      if (res.ok && json.ok) {
        onCreado(json.registro as T);
        setValores(iniciales(campos, valoresFijos));
        setErrores({});
        setAviso(true);
        setTimeout(() => setAviso(false), 2200);
      } else {
        setErrores(json.errores ?? { _formulario: "No se pudo guardar." });
      }
    } catch {
      setErrores({ _formulario: "Error de conexión." });
    }
    setEnviando(false);
  }

  return (
    <form onSubmit={enviar} noValidate className="panel rounded-3xl p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-slate-900">{titulo}</h3>
        {aviso && (
          <span role="status" className="animar-entrada inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700">
            <Icono nombre="check" className="h-3.5 w-3.5" /> Guardado
          </span>
        )}
      </div>
      {(() => {
        // Errores que no corresponden a un campo visible (p. ej. «cupo completo») se muestran como aviso general.
        const generales = Object.entries(errores)
          .filter(([k]) => !visibles.some((c) => c.clave === k))
          .map(([, m]) => m);
        return generales.length > 0 ? <p role="alert" className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{generales.join(" ")}</p> : null;
      })()}
      <div className="grid grid-cols-1 gap-x-4 gap-y-3.5 sm:grid-cols-2">
        {visibles.map((c) => {
          const err = errores[c.clave];
          const val = valores[c.clave];
          const comunes = { id: `f-${endpoint}-${c.clave}`, "aria-invalid": Boolean(err), required: c.requerido };
          const cambiar = (v: string | boolean) => {
            setValores((x) => ({ ...x, [c.clave]: v }));
            if (err) setErrores(({ [c.clave]: _o, ...r }) => r);
          };
          if (c.tipo === "checkbox") {
            return (
              <div key={c.clave} className="sm:col-span-2">
                <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-3 text-sm transition ${val ? "border-blue-300 bg-blue-50/70" : "border-slate-200 bg-white/70"} ${err ? "border-rose-300" : ""}`}>
                  <input {...comunes} type="checkbox" className="mt-0.5 h-[18px] w-[18px] accent-blue-600" checked={val === true} onChange={(e) => cambiar(e.target.checked)} />
                  <span className="text-slate-700">{c.etiqueta}{c.requerido && <span className="text-rose-500"> *</span>}</span>
                </label>
                {err && <p className="mt-1 text-xs font-medium text-rose-600">{err}</p>}
              </div>
            );
          }
          const texto = typeof val === "string" ? val : "";
          return (
            <div key={c.clave} className={c.ancho === "completo" || c.tipo === "textarea" ? "sm:col-span-2" : ""}>
              <label htmlFor={comunes.id} className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                {c.etiqueta}
                {c.requerido && <span className="text-rose-500"> *</span>}
              </label>
              {c.tipo === "select" ? (
                <div className="relative">
                  <select {...comunes} className={`${claseInput} cursor-pointer appearance-none pr-10`} value={texto} onChange={(e) => cambiar(e.target.value)}>
                    <option value="">Seleccione…</option>
                    {c.opciones?.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
                  </select>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500"><path d="m6 9 6 6 6-6" /></svg>
                </div>
              ) : c.tipo === "textarea" ? (
                <textarea {...comunes} rows={3} maxLength={c.maxLength} placeholder={c.placeholder} className={claseInput} value={texto} onChange={(e) => cambiar(e.target.value)} />
              ) : (
                <input
                  {...comunes}
                  type={c.tipo}
                  inputMode={c.tipo === "number" ? "decimal" : undefined}
                  min={c.tipo === "number" ? 0 : undefined}
                  maxLength={c.maxLength}
                  placeholder={c.placeholder}
                  className={claseInput}
                  value={texto}
                  onChange={(e) => cambiar(e.target.value)}
                />
              )}
              {c.ayuda && !err && <p className="mt-1 text-xs text-slate-500">{c.ayuda}</p>}
              {err && <p className="mt-1 text-xs font-medium text-rose-600">{err}</p>}
            </div>
          );
        })}
      </div>
      <button type="submit" disabled={enviando} className="btn-primario mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold">
        <Icono nombre="mas" className="h-4 w-4" /> {enviando ? "Guardando…" : boton}
      </button>
    </form>
  );
}
