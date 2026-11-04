import { NextResponse } from "next/server";
import { esColeccion } from "@/lib/comunicaciones/schema";
import { obtenerAlmacenComunicaciones } from "@/lib/comunicaciones/store";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ coleccion: string; id: string }> }) {
  const { coleccion, id } = await params;
  if (!esColeccion(coleccion) || !/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ ok: false }, { status: 404 });
  const ok = await obtenerAlmacenComunicaciones().eliminar(coleccion, id);
  return NextResponse.json({ ok }, { status: ok ? 200 : 404 });
}
