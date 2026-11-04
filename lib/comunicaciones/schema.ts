import { z } from "zod";
import { CODIGOS_PROVINCIA, PROVINCIAS } from "@/lib/territorio/provincias";

/**
 * Módulo de Comunicaciones: tres colecciones.
 *  - lineas      → Línea comunicacional (ejes y mensajes institucionales aprobados).
 *  - medios      → Plan de medios (acciones por medio, alcance, fechas y presupuesto).
 *  - comunicadores → Red nacional de comunicadores, organizada por provincia.
 */

export type Opcion = { valor: string; etiqueta: string };
const op = (...v: Array<[string, string]>): Opcion[] => v.map(([valor, etiqueta]) => ({ valor, etiqueta }));

export const OPC = {
  provincia: PROVINCIAS.map((p) => ({ valor: p.codigo, etiqueta: p.nombre })),
  tono: op(["INSTITUCIONAL", "Institucional"], ["CERCANO", "Cercano"], ["INFORMATIVO", "Informativo"], ["MOVILIZADOR", "Movilizador"]),
  estadoLinea: op(["BORRADOR", "Borrador"], ["APROBADO", "Aprobado"], ["ARCHIVADO", "Archivado"]),
  publico: op(
    ["GENERAL", "Público general"], ["JUVENTUD", "Juventud"], ["MUJERES", "Mujeres"], ["ADULTOS_MAYORES", "Adultos mayores"],
    ["DIASPORA", "Diáspora"], ["RURAL", "Zonas rurales"], ["URBANO", "Zonas urbanas"], ["ESTRUCTURA_INTERNA", "Estructura interna"],
  ),
  tipoMedio: op(
    ["TELEVISION", "Televisión"], ["RADIO", "Radio"], ["PRENSA", "Prensa escrita"], ["DIGITAL", "Medios digitales"],
    ["REDES", "Redes sociales"], ["EXTERIOR", "Vallas y exterior"], ["EVENTO", "Rueda de prensa / evento"],
  ),
  alcance: op(["NACIONAL", "Nacional"], ["PROVINCIAL", "Provincial"]),
  estadoMedio: op(["PLANIFICADO", "Planificado"], ["EN_CURSO", "En curso"], ["EJECUTADO", "Ejecutado"], ["CANCELADO", "Cancelado"]),
  rolComunicador: op(
    ["COORDINADOR_PROVINCIAL", "Coordinador(a) provincial de comunicación"],
    ["VOCERO", "Vocero(a)"],
    ["PERIODISTA", "Periodista aliado(a)"],
    ["LOCUTOR", "Locutor(a) de radio / TV"],
    ["CREADOR_DIGITAL", "Creador(a) de contenido digital"],
    ["COMMUNITY_MANAGER", "Community manager"],
    ["FOTOGRAFO", "Fotógrafo(a) / audiovisual"],
  ),
} as const;

export const etiqueta = (opciones: readonly Opcion[], valor: unknown) => opciones.find((o) => o.valor === valor)?.etiqueta ?? String(valor ?? "");

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const limpiar = (v: unknown) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.trim().replace(/[ \t]+/g, " ")) : v);
const enumDe = (o: readonly Opcion[]) => z.enum(o.map((x) => x.valor) as [string, ...string[]], { errorMap: () => ({ message: "Seleccione una opción válida." }) });

const req = <T extends z.ZodTypeAny>(t: T) =>
  z.preprocess(limpiar, z.any().refine((v) => v !== undefined && v !== null, "Campo obligatorio.").pipe(t));
const opt = <T extends z.ZodTypeAny>(t: T) => z.preprocess(limpiar, t.optional());
const texto = (max: number) => z.string().max(max, `Máximo ${max} caracteres.`);
const fecha = z.string().regex(FECHA, "Fecha inválida.");
const telefono = z
  .string()
  .transform((t) => t.replace(/[\s().-]/g, ""))
  .refine((t) => /^(809|829|849)\d{7}$/.test(t) || /^\+\d{8,15}$/.test(t), "Teléfono inválido.");

export const esquemaLinea = z
  .object({
    titulo: req(texto(120)),
    mensaje: req(texto(600)),
    publico: req(enumDe(OPC.publico)),
    tono: req(enumDe(OPC.tono)),
    palabras_clave: opt(texto(200)),
    vigencia_desde: opt(fecha),
    vigencia_hasta: opt(fecha),
    estado: req(enumDe(OPC.estadoLinea)),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (d.vigencia_desde && d.vigencia_hasta && d.vigencia_hasta < d.vigencia_desde) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["vigencia_hasta"], message: "Debe ser posterior al inicio." });
    }
  });

export const esquemaMedio = z
  .object({
    accion: req(texto(140)),
    tipo_medio: req(enumDe(OPC.tipoMedio)),
    medio: req(texto(120)),
    alcance: req(enumDe(OPC.alcance)),
    provincia: opt(enumDe(OPC.provincia)),
    fecha_inicio: req(fecha),
    fecha_fin: opt(fecha),
    linea_id: opt(z.string().uuid("Seleccione una línea válida.")),
    responsable: opt(texto(120)),
    presupuesto: opt(
      z.union([z.number(), z.string()]).transform((v, ctx) => {
        const n = typeof v === "number" ? v : Number(String(v).replace(/[,\s]/g, ""));
        if (!Number.isFinite(n) || n < 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Monto inválido." });
          return z.NEVER;
        }
        return Math.round(n * 100) / 100;
      }),
    ),
    estado: req(enumDe(OPC.estadoMedio)),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (d.alcance === "PROVINCIAL" && !d.provincia) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["provincia"], message: "Indique la provincia." });
    }
    if (d.fecha_fin && d.fecha_inicio && d.fecha_fin < d.fecha_inicio) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["fecha_fin"], message: "Debe ser posterior al inicio." });
    }
  })
  .transform((d) => (d.alcance === "NACIONAL" ? { ...d, provincia: undefined } : d));

export const esquemaComunicador = z
  .object({
    nombre: req(texto(120)),
    provincia: req(z.string().refine((v) => CODIGOS_PROVINCIA.includes(v), "Seleccione una provincia.")),
    municipio: opt(texto(80)),
    rol: req(enumDe(OPC.rolComunicador)),
    medio_plataforma: opt(texto(120)),
    telefono: req(telefono),
    email: opt(z.string().email("Correo inválido.").toLowerCase()),
    redes: opt(texto(160)),
    consentimiento: z.literal(true, { errorMap: () => ({ message: "Se requiere el consentimiento de la persona." }) }),
  })
  .strict();

export const COLECCIONES = {
  lineas: { esquema: esquemaLinea, tabla: "lineas_comunicacionales" },
  medios: { esquema: esquemaMedio, tabla: "plan_medios" },
  comunicadores: { esquema: esquemaComunicador, tabla: "comunicadores" },
} as const;

export type Coleccion = keyof typeof COLECCIONES;
export const esColeccion = (v: string): v is Coleccion => v in COLECCIONES;

export type Registro = Record<string, unknown> & { id: string; creado_en: string };

/** Datos de contacto enmascarados para listados (hasta que exista control de acceso por rol). */
export function enmascararComunicador(r: Registro): Registro {
  const tel = typeof r.telefono === "string" ? r.telefono : "";
  const email = typeof r.email === "string" ? r.email : "";
  return {
    ...r,
    telefono: tel ? `•••-•••-${tel.slice(-4)}` : undefined,
    email: email ? email.replace(/^(.).*(@.*)$/, "$1•••$2") : undefined,
  };
}

export function erroresPorCampo(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of error.issues) {
    if (i.code === "unrecognized_keys") {
      out._formulario = `Campos no permitidos: ${i.keys.join(", ")}`;
      continue;
    }
    out[String(i.path[0] ?? "_formulario")] ??= i.message;
  }
  return out;
}
