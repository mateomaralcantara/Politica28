import { almacenDeModulo, type Almacen, type Registro } from "@/lib/datos/almacen";
import { COLECCIONES, enmascararParticipante, type Coleccion } from "@/lib/educacion/schema";

const TABLAS = Object.fromEntries(Object.entries(COLECCIONES).map(([k, v]) => [k, v.tabla])) as Record<Coleccion, string>;

export function obtenerAlmacenEducacion(): Almacen<Coleccion> {
  return almacenDeModulo<Coleccion>("educacion", TABLAS);
}

export async function listarPublico(c: Coleccion): Promise<Registro[]> {
  const filas = await obtenerAlmacenEducacion().listar(c);
  return c === "participantes" ? filas.map(enmascararParticipante) : filas;
}

export type ResultadoInscripcionCurso =
  | { ok: true; registro: Registro }
  | { ok: false; status: number; errores: Record<string, string> };

/** Inscribe a un participante comprobando el curso y el cupo disponible. */
export async function inscribirParticipante(datos: Record<string, unknown>, almacen = obtenerAlmacenEducacion()): Promise<ResultadoInscripcionCurso> {
  const curso = await almacen.obtener("cursos", String(datos.curso_id));
  if (!curso) return { ok: false, status: 422, errores: { curso_id: "El curso no existe." } };
  if (curso.estado === "CANCELADO" || curso.estado === "FINALIZADO") {
    return { ok: false, status: 409, errores: { curso_id: "Este curso ya no admite inscripciones." } };
  }
  const inscritos = (await almacen.listar("participantes")).filter((p) => p.curso_id === curso.id);
  if (inscritos.length >= Number(curso.cupo)) return { ok: false, status: 409, errores: { curso_id: "El cupo de este curso está completo." } };
  const tel = String(datos.telefono);
  if (inscritos.some((p) => p.telefono === tel)) return { ok: false, status: 409, errores: { telefono: "Esta persona ya está inscrita en el curso." } };
  return { ok: true, registro: await almacen.crear("participantes", { ...datos, asistio: false }) };
}
