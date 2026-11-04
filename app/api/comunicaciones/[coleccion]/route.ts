import { NextResponse } from "next/server";
import { COLECCIONES, enmascararComunicador, erroresPorCampo, esColeccion } from "@/lib/comunicaciones/schema";
import { listarPublico, obtenerAlmacenComunicaciones } from "@/lib/comunicaciones/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ coleccion: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { coleccion } = await params;
  if (!esColeccion(coleccion)) return NextResponse.json({ ok: false }, { status: 404 });
  return NextResponse.json({ ok: true, registros: await listarPublico(coleccion) });
}

export async function POST(req: Request, { params }: Ctx) {
  const { coleccion } = await params;
  if (!esColeccion(coleccion)) return NextResponse.json({ ok: false }, { status: 404 });
  const texto = await req.text();
  if (texto.length > 16 * 1024) return NextResponse.json({ ok: false, errores: { _formulario: "Solicitud demasiado grande." } }, { status: 413 });
  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(texto);
  } catch {
    return NextResponse.json({ ok: false, errores: { _formulario: "JSON inválido." } }, { status: 400 });
  }
  const r = COLECCIONES[coleccion].esquema.safeParse(cuerpo);
  if (!r.success) return NextResponse.json({ ok: false, errores: erroresPorCampo(r.error) }, { status: 422 });
  try {
    const creado = await obtenerAlmacenComunicaciones().crear(coleccion, r.data as Record<string, unknown>);
    return NextResponse.json({ ok: true, registro: coleccion === "comunicadores" ? enmascararComunicador(creado) : creado }, { status: 201 });
  } catch (e) {
    console.error("[comunicaciones] error al guardar", e);
    return NextResponse.json({ ok: false, errores: { _formulario: "No se pudo guardar. Intente de nuevo." } }, { status: 502 });
  }
}
