import { z } from "zod";
import { enmascararContacto, type Registro } from "@/lib/datos/almacen";
import { PROVINCIAS } from "@/lib/territorio/provincias";

/**
 * Módulo de Educación: formación y capacitación de la estructura.
 *  - cursos        → programa de formación (talleres, cursos, charlas).
 *  - participantes → inscritos en cada curso, con asistencia; quien asistió a un
 *                    curso finalizado obtiene su certificado.
 */

export type Opcion = { valor: string; etiqueta: string };
const op = (...v: Array<[string, string]>): Opcion[] => v.map(([valor, etiqueta]) => ({ valor, etiqueta }));

export const OPC = {
  provincia: PROVINCIAS.map((p) => ({ valor: p.codigo, etiqueta: p.nombre })),
  tema: op(
    ["LIDERAZGO", "Liderazgo"],
    ["ORGANIZACION_TERRITORIAL", "Organización territorial"],
    ["COMUNICACION", "Comunicación y vocería"],
    ["LEGISLACION_ELECTORAL", "Legislación electoral"],
    ["PROTECCION_DATOS", "Protección de datos (Ley 172-13)"],
    ["PLATAFORMA", "Uso de la plataforma POLÍTICA 28"],
    ["TRABAJO_COMUNITARIO", "Trabajo comunitario"],
    ["OTRO", "Otro"],
  ),
  modalidad: op(["PRESENCIAL", "Presencial"], ["VIRTUAL", "Virtual"], ["HIBRIDA", "Híbrida"]),
  dirigidoA: op(
    ["TODA_LA_ESTRUCTURA", "Toda la estructura"],
    ["COORDINADOR_GENERAL", "Coordinadores generales"],
    ["COORDINADOR_OPERATIVO", "Coordinadores operativos"],
    ["SUPERVISOR", "Supervisores"],
    ["PROMOTOR", "Promotores"],
    ["MULTIPLICADOR", "Multiplicadores"],
  ),
  alcance: op(["NACIONAL", "Nacional"], ["PROVINCIAL", "Provincial"]),
  estadoCurso: op(["PROGRAMADO", "Programado"], ["EN_CURSO", "En curso"], ["FINALIZADO", "Finalizado"], ["CANCELADO", "Cancelado"]),
  cargo: op(
    ["COORDINADOR_GENERAL", "Coordinador General"],
    ["COORDINADOR_OPERATIVO", "Coordinador Operativo"],
    ["SUPERVISOR", "Supervisor"],
    ["PROMOTOR", "Promotor"],
    ["MULTIPLICADOR", "Multiplicador"],
    ["VOLUNTARIO", "Voluntario(a)"],
  ),
} as const;

export const etiqueta = (o: readonly Opcion[], v: unknown) => o.find((x) => x.valor === v)?.etiqueta ?? String(v ?? "");

const limpiar = (v: unknown) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.trim().replace(/[ \t]+/g, " ")) : v);
const enumDe = (o: readonly Opcion[]) => z.enum(o.map((x) => x.valor) as [string, ...string[]], { errorMap: () => ({ message: "Seleccione una opción válida." }) });
const req = <T extends z.ZodTypeAny>(t: T) => z.preprocess(limpiar, z.any().refine((v) => v !== undefined && v !== null, "Campo obligatorio.").pipe(t));
const opt = <T extends z.ZodTypeAny>(t: T) => z.preprocess(limpiar, t.optional());
const texto = (max: number) => z.string().max(max, `Máximo ${max} caracteres.`);
const entero = (min: number, max: number, msg: string) =>
  z.union([z.number(), z.string()]).transform((v, ctx) => {
    const n = typeof v === "number" ? v : Number(String(v).replace(/[,\s]/g, ""));
    if (!Number.isFinite(n) || n < min || n > max) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg });
      return z.NEVER;
    }
    return n;
  });

export const esquemaCurso = z
  .object({
    titulo: req(texto(140)),
    tema: req(enumDe(OPC.tema)),
    descripcion: opt(texto(600)),
    modalidad: req(enumDe(OPC.modalidad)),
    dirigido_a: req(enumDe(OPC.dirigidoA)),
    alcance: req(enumDe(OPC.alcance)),
    provincia: opt(enumDe(OPC.provincia)),
    sede: opt(texto(200)),
    fecha: req(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida.")),
    hora: opt(z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Hora inválida.")),
    duracion_horas: opt(entero(0.5, 200, "Entre 0.5 y 200 horas.")),
    cupo: req(entero(1, 5000, "Entre 1 y 5,000 plazas.").refine(Number.isInteger, "Debe ser un número entero.")),
    facilitador: opt(texto(120)),
    estado: req(enumDe(OPC.estadoCurso)),
  })
  .strict()
  .superRefine((d, ctx) => {
    if (d.alcance === "PROVINCIAL" && !d.provincia) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["provincia"], message: "Indique la provincia." });
    if (d.modalidad !== "VIRTUAL" && !d.sede) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["sede"], message: "Indique el lugar." });
  })
  .transform((d) => (d.alcance === "NACIONAL" ? { ...d, provincia: undefined } : d));

/** Cambios permitidos sobre un curso existente. */
export const esquemaCambioCurso = z.object({ estado: enumDe(OPC.estadoCurso) }).strict();

export const esquemaParticipante = z
  .object({
    curso_id: req(z.string().uuid("Seleccione un curso.")),
    nombre: req(texto(120)),
    cargo: req(enumDe(OPC.cargo)),
    provincia: req(enumDe(OPC.provincia)),
    telefono: req(
      z
        .string()
        .transform((t) => t.replace(/[\s().-]/g, ""))
        .refine((t) => /^(809|829|849)\d{7}$/.test(t) || /^\+\d{8,15}$/.test(t), "Teléfono inválido."),
    ),
    consentimiento: z.literal(true, { errorMap: () => ({ message: "Se requiere el consentimiento de la persona." }) }),
  })
  .strict();

/** Cambios permitidos sobre un participante: solo la asistencia. */
export const esquemaCambioParticipante = z.object({ asistio: z.boolean() }).strict();

export const COLECCIONES = {
  cursos: { esquema: esquemaCurso, cambio: esquemaCambioCurso, tabla: "cursos" },
  participantes: { esquema: esquemaParticipante, cambio: esquemaCambioParticipante, tabla: "curso_participantes" },
} as const;

export type Coleccion = keyof typeof COLECCIONES;
export const esColeccion = (v: string): v is Coleccion => v in COLECCIONES;

/** Un participante obtiene certificado si asistió y el curso está finalizado. */
export const tieneCertificado = (p: Registro, curso: Registro | undefined | null) => p.asistio === true && curso?.estado === "FINALIZADO";

export const enmascararParticipante = (r: Registro) => enmascararContacto(r, { telefono: "telefono" });

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
