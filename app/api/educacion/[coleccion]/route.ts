import { NextResponse } from "next/server";
import { COLECCIONES, enmascararParticipante, erroresPorCampo, esColeccion } from "@/lib/educacion/schema";
import { inscribirParticipante, listarPublico, obtenerAlmacenEducacion } from "@/lib/educacion/store";

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
    if (coleccion === "participantes") {
      const res = await inscribirParticipante(r.data as Record<string, unknown>);
      if (!res.ok) return NextResponse.json({ ok: false, errores: res.errores }, { status: res.status });
      return NextResponse.json({ ok: true, registro: enmascararParticipante(res.registro) }, { status: 201 });
    }
    const creado = await obtenerAlmacenEducacion().crear(coleccion, r.data as Record<string, unknown>);
    return NextResponse.json({ ok: true, registro: creado }, { status: 201 });
  } catch (e) {
    console.error("[educacion] error al guardar", e);
    return NextResponse.json({ ok: false, errores: { _formulario: "No se pudo guardar. Intente de nuevo." } }, { status: 502 });
  }
}
