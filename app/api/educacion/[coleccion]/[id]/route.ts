import { NextResponse } from "next/server";
import { COLECCIONES, enmascararParticipante, erroresPorCampo, esColeccion } from "@/lib/educacion/schema";
import { obtenerAlmacenEducacion } from "@/lib/educacion/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ coleccion: string; id: string }> };
const valido = (c: string, id: string) => esColeccion(c) && /^[0-9a-f-]{36}$/i.test(id);

export async function PATCH(req: Request, { params }: Ctx) {
  const { coleccion, id } = await params;
  if (!valido(coleccion, id) || !esColeccion(coleccion)) return NextResponse.json({ ok: false }, { status: 404 });
  let cuerpo: unknown;
  try {
    cuerpo = await req.json();
  } catch {
    return NextResponse.json({ ok: false, errores: { _formulario: "JSON inválido." } }, { status: 400 });
  }
  const r = COLECCIONES[coleccion].cambio.safeParse(cuerpo);
  if (!r.success) return NextResponse.json({ ok: false, errores: erroresPorCampo(r.error) }, { status: 422 });
  const almacen = obtenerAlmacenEducacion();
  if (coleccion === "participantes") {
    const p = await almacen.obtener("participantes", id);
    const curso = p ? await almacen.obtener("cursos", String(p.curso_id)) : null;
    if (curso?.estado === "CANCELADO") return NextResponse.json({ ok: false, errores: { _formulario: "El curso está cancelado." } }, { status: 409 });
  }
  const act = await almacen.actualizar(coleccion, id, r.data);
  if (!act) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, registro: coleccion === "participantes" ? enmascararParticipante(act) : act });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { coleccion, id } = await params;
  if (!valido(coleccion, id) || !esColeccion(coleccion)) return NextResponse.json({ ok: false }, { status: 404 });
  const almacen = obtenerAlmacenEducacion();
  if (coleccion === "cursos") {
    // En Supabase la clave foránea borra en cascada; en memoria se hace aquí.
    for (const p of await almacen.listar("participantes")) if (p.curso_id === id) await almacen.eliminar("participantes", p.id);
  }
  const ok = await almacen.eliminar(coleccion, id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
