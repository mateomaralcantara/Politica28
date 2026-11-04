"use client";

import { useState, type FormEvent } from "react";
import { SECCIONES, type Campo } from "@/lib/inscripcion/campos";
import { formatearCedula } from "@/lib/jce/cedula";

type Valores = Record<string, string | boolean>;

const ETIQUETA_ORIGEN: Record<Campo["origen"], string> = {
  JCE_CEDULA: "JCE · Cédula",
  JCE_PADRON: "JCE · Padrón",
  CONTACTO: "Contacto",
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

const claseInput =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30 aria-[invalid=true]:border-red-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100";

export default function InscripcionForm() {
  const [valores, setValores] = useState<Valores>(valoresIniciales);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok">("idle");
  const [resultado, setResultado] = useState<{ id: string; modo: string } | null>(null);

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
      <div role="status" className="rounded-lg border border-green-300 bg-green-50 p-6 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100">
        <h2 className="text-lg font-semibold">Inscripción recibida</h2>
        <p className="mt-2 text-sm">
          Número de solicitud: <code className="font-mono">{resultado.id}</code>. Gracias por inscribirse.
        </p>
        {resultado.modo === "demo" && (
          <p className="mt-2 text-xs">Modo demostración: el registro se guardó en memoria y no es persistente.</p>
        )}
        <button
          type="button"
          className="mt-4 rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
          onClick={() => {
            setValores(valoresIniciales());
            setResultado(null);
            setEstado("idle");
          }}
        >
          Nueva inscripción
        </button>
      </div>
    );
  }

  const totalErrores = Object.keys(errores).length;

  return (
    <form onSubmit={enviar} noValidate className="space-y-8">
      {totalErrores > 0 && (
        <div role="alert" className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          {errores._formulario ?? `Revise ${totalErrores} campo(s) marcados en rojo.`}
        </div>
      )}

      {SECCIONES.map((seccion) => (
        <fieldset key={seccion.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
          <legend className="px-2 text-base font-semibold text-slate-900 dark:text-slate-100">{seccion.titulo}</legend>
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{seccion.descripcion}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {seccion.campos.filter((c) => esVisible(c, valores)).map((c) => (
              <CampoFormulario key={c.clave} campo={c} valor={valores[c.clave]} error={errores[c.clave]} onChange={cambiar} />
            ))}
          </div>
        </fieldset>
      ))}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">Los campos con * son obligatorios.</p>
        <button
          type="submit"
          disabled={estado === "enviando"}
          className="rounded-md bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-800 disabled:opacity-60"
        >
          {estado === "enviando" ? "Enviando…" : "Enviar inscripción"}
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
  const describedBy = [campo.ayuda ? idAyuda : "", error ? idError : ""].filter(Boolean).join(" ") || undefined;
  const comunes = {
    id: campo.clave,
    name: campo.clave,
    "aria-invalid": Boolean(error),
    "aria-describedby": describedBy,
    required: campo.requerido,
  };
  const ancho = campo.ancho === "completo" || campo.tipo === "textarea" ? "sm:col-span-2" : "";

  if (campo.tipo === "checkbox") {
    return (
      <div className={campo.ancho === "completo" ? "sm:col-span-2" : ""}>
        <label className="flex items-start gap-3 text-sm text-slate-800 dark:text-slate-200">
          <input
            {...comunes}
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 accent-blue-700"
            checked={valor === true}
            onChange={(e) => onChange(campo.clave, e.target.checked)}
          />
          <span>
            {campo.etiqueta}
            {campo.requerido && <span className="text-red-600"> *</span>}
          </span>
        </label>
        {error && <p id={idError} className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  const texto = typeof valor === "string" ? valor : "";
  let control;
  if (campo.tipo === "select") {
    control = (
      <select {...comunes} className={claseInput} value={texto} onChange={(e) => onChange(campo.clave, e.target.value)}>
        <option value="">Seleccione…</option>
        {campo.opciones?.map((o) => <option key={o.valor} value={o.valor}>{o.etiqueta}</option>)}
      </select>
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
        className={claseInput}
        value={texto}
        onChange={(e) => onChange(campo.clave, esCedula ? formatearCedula(e.target.value) : e.target.value)}
      />
    );
  }

  return (
    <div className={ancho}>
      <label htmlFor={campo.clave} className="mb-1 flex items-center justify-between gap-2 text-sm font-medium text-slate-800 dark:text-slate-200">
        <span>
          {campo.etiqueta}
          {campo.requerido && <span className="text-red-600"> *</span>}
        </span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-slate-500 dark:bg-slate-700 dark:text-slate-300">
          {ETIQUETA_ORIGEN[campo.origen]}
        </span>
      </label>
      {control}
      {campo.ayuda && <p id={idAyuda} className="mt-1 text-xs text-slate-500 dark:text-slate-400">{campo.ayuda}</p>}
      {error && <p id={idError} className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
