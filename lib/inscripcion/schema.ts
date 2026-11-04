import { z } from "zod";
import { CAMPOS, type Campo } from "@/lib/inscripcion/campos";
import { validarCedula } from "@/lib/jce/cedula";

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const TELEFONO_RD = /^(809|829|849)\d{7}$/;
const TELEFONO_INTL = /^\+\d{8,15}$/;

const vacioAUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const recortar = (v: unknown) => (typeof v === "string" ? v.trim().replace(/\s+/g, " ") : v);

export function normalizarTelefono(valor: string): string {
  const limpio = valor.replace(/[\s().-]/g, "");
  return limpio.startsWith("+1") && limpio.length === 12 ? limpio.slice(2) : limpio;
}

function esFechaReal(valor: string): boolean {
  if (!FECHA.test(valor)) return false;
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}

export function edadEn(fechaNacimiento: string, hoy: Date): number {
  const [a, m, d] = fechaNacimiento.split("-").map(Number);
  let edad = hoy.getUTCFullYear() - a;
  const mes = hoy.getUTCMonth() + 1;
  if (mes < m || (mes === m && hoy.getUTCDate() < d)) edad--;
  return edad;
}

function esquemaCampo(campo: Campo): z.ZodTypeAny {
  let base: z.ZodTypeAny;
  switch (campo.tipo) {
    case "checkbox":
      return campo.requerido
        ? z.literal(true, { errorMap: () => ({ message: "Debe aceptar para continuar." }) })
        : z.boolean().default(false);
    case "select": {
      const valores = (campo.opciones ?? []).map((o) => o.valor) as [string, ...string[]];
      base = z.enum(valores, { errorMap: () => ({ message: "Seleccione una opción válida." }) });
      break;
    }
    case "date":
      base = z.string().refine(esFechaReal, "Fecha inválida (AAAA-MM-DD).");
      break;
    case "email":
      base = z.string().email("Correo electrónico inválido.").toLowerCase();
      break;
    case "tel":
      base = z
        .string()
        .transform(normalizarTelefono)
        .refine((t) => TELEFONO_RD.test(t) || TELEFONO_INTL.test(t), "Teléfono inválido.");
      break;
    case "cedula":
      base = z.string().transform((valor, ctx) => {
        const r = validarCedula(valor);
        if (!r.valida) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: r.motivo === "formato" ? "La cédula debe tener 11 dígitos." : "Dígito verificador de la cédula inválido.",
          });
          return z.NEVER;
        }
        return r.cedula;
      });
      break;
    default:
      base = z.string().max(campo.maxLength ?? 255, `Máximo ${campo.maxLength ?? 255} caracteres.`);
  }
  if (!campo.requerido) return z.preprocess((v) => vacioAUndefined(recortar(v)), base.optional());
  return z.preprocess(
    (v) => vacioAUndefined(recortar(v)),
    z.any().refine((v) => v !== undefined && v !== null, "Campo obligatorio.").pipe(base),
  );
}

const forma = Object.fromEntries(CAMPOS.map((c) => [c.clave, esquemaCampo(c)])) as Record<string, z.ZodTypeAny>;

export function crearEsquemaInscripcion(hoy: () => Date = () => new Date()) {
  return z
    .object(forma)
    .strict()
    .superRefine((d, ctx) => {
      const err = (path: string, message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
      const hoyDate = hoy();
      const hoyISO = hoyDate.toISOString().slice(0, 10);

      if (typeof d.fecha_nacimiento === "string") {
        if (d.fecha_nacimiento > hoyISO) err("fecha_nacimiento", "La fecha de nacimiento no puede ser futura.");
        else if (edadEn(d.fecha_nacimiento, hoyDate) < 18) err("fecha_nacimiento", "Debe ser mayor de 18 años.");
        else if (edadEn(d.fecha_nacimiento, hoyDate) > 120) err("fecha_nacimiento", "Fecha de nacimiento inválida.");
      }
      if (typeof d.fecha_expiracion === "string" && d.fecha_expiracion < hoyISO) {
        err("fecha_expiracion", "La cédula está vencida; renuévela en la JCE antes de inscribirse.");
      }
      if (typeof d.domicilio_codigo_postal === "string" && !/^\d{5}$/.test(d.domicilio_codigo_postal)) {
        err("domicilio_codigo_postal", "El código postal tiene 5 dígitos.");
      }
      if (typeof d.colegio_electoral === "string" && !/^\d{4}[A-Za-z]?$/.test(d.colegio_electoral)) {
        err("colegio_electoral", "Formato esperado: 4 dígitos y una letra opcional (ej.: 0045A).");
      }
      if (typeof d.posicion_padron === "string" && !/^\d{1,5}$/.test(d.posicion_padron)) {
        err("posicion_padron", "Debe ser un número.");
      }
      if (typeof d.recinto_codigo === "string" && !/^[0-9A-Za-z-]{1,10}$/.test(d.recinto_codigo)) {
        err("recinto_codigo", "Código de recinto inválido.");
      }

      if (d.vota_en_exterior) {
        if (!d.exterior_circunscripcion) err("exterior_circunscripcion", "Indique la circunscripción del exterior.");
        if (!d.exterior_pais) err("exterior_pais", "Indique el país.");
      }

      if (d.consentimiento_comunicaciones && !d.telefono_movil && !d.email) {
        err("consentimiento_comunicaciones", "Indique al menos un medio de contacto.");
      }
    })
    .transform((d) => {
      // Datos de votación nacionales y del exterior son excluyentes.
      const limpio = { ...d };
      const nacionales = ["votacion_provincia", "votacion_municipio", "votacion_distrito_municipal", "circunscripcion"];
      const exterior = ["exterior_circunscripcion", "exterior_pais", "exterior_ciudad"];
      for (const k of d.vota_en_exterior ? nacionales : exterior) delete limpio[k];
      return limpio;
    });
}

export type Inscripcion = Record<string, string | boolean | undefined>;

export type ErroresCampo = Record<string, string>;

export function erroresPorCampo(error: z.ZodError): ErroresCampo {
  const out: ErroresCampo = {};
  for (const issue of error.issues) {
    const clave = String(issue.path[0] ?? "_formulario");
    if (issue.code === "unrecognized_keys") {
      out._formulario = `Campos no permitidos: ${issue.keys.join(", ")}`;
      continue;
    }
    out[clave] ??= issue.message;
  }
  return out;
}
