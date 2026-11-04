import { almacenDeModulo, type Almacen } from "@/lib/datos/almacen";
import { COLECCIONES, enmascararComunicador, type Coleccion } from "@/lib/comunicaciones/schema";

export { AlmacenMemoria as MemoriaComunicaciones } from "@/lib/datos/almacen";

const TABLAS = Object.fromEntries(Object.entries(COLECCIONES).map(([k, v]) => [k, v.tabla])) as Record<Coleccion, string>;

export function obtenerAlmacenComunicaciones(): Almacen<Coleccion> {
  return almacenDeModulo<Coleccion>("comunicaciones", TABLAS);
}

/** Listado listo para mostrar: los comunicadores salen con el contacto enmascarado. */
export async function listarPublico(c: Coleccion) {
  const filas = await obtenerAlmacenComunicaciones().listar(c);
  return c === "comunicadores" ? filas.map(enmascararComunicador) : filas;
}
