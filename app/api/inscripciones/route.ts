import { NextResponse } from "next/server";
import { crearEsquemaInscripcion, erroresPorCampo } from "@/lib/inscripcion/schema";
import { obtenerAlmacen } from "@/lib/inscripcion/store";

export const dynamic = "force-dynamic";

const MAX_BYTES = 32 * 1024;

export async function POST(req: Request) {
  const texto = await req.text();
  if (texto.length > MAX_BYTES) {
    return NextResponse.json({ ok: false, errores: { _formulario: "Solicitud demasiado grande." } }, { status: 413 });
  }
  let cuerpo: unknown;
  try {
    cuerpo = JSON.parse(texto);
  } catch {
    return NextResponse.json({ ok: false, errores: { _formulario: "JSON inválido." } }, { status: 400 });
  }

  const resultado = crearEsquemaInscripcion().safeParse(cuerpo);
  if (!resultado.success) {
    return NextResponse.json({ ok: false, errores: erroresPorCampo(resultado.error) }, { status: 422 });
  }

  const guardado = await obtenerAlmacen().guardar(resultado.data, {
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    userAgent: req.headers.get("user-agent") ?? undefined,
  });

  if (!guardado.ok) {
    if (guardado.motivo === "duplicada") {
      return NextResponse.json(
        { ok: false, errores: { cedula: "Ya existe una inscripción con esta cédula." } },
        { status: 409 },
      );
    }
    console.error("[inscripciones] error al guardar", guardado.detalle);
    return NextResponse.json({ ok: false, errores: { _formulario: "No se pudo guardar. Intente de nuevo." } }, { status: 502 });
  }

  return NextResponse.json({ ok: true, id: guardado.id, modo: guardado.modo }, { status: 201 });
}
