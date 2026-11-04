import type { Inscripcion } from "@/lib/inscripcion/schema";

export type ResultadoGuardado =
  | { ok: true; id: string; modo: "supabase" | "demo" }
  | { ok: false; motivo: "duplicada" | "error"; detalle?: string };

export interface AlmacenInscripciones {
  guardar(datos: Inscripcion, meta: { ip?: string; userAgent?: string }): Promise<ResultadoGuardado>;
}

/** Almacén en memoria para desarrollo. Los registros se marcan como DEMO. */
export class AlmacenMemoria implements AlmacenInscripciones {
  readonly registros = new Map<string, Inscripcion & { id: string; creado_en: string }>();

  async guardar(datos: Inscripcion, _meta: { ip?: string; userAgent?: string } = {}): Promise<ResultadoGuardado> {
    const cedula = String(datos.cedula);
    for (const r of this.registros.values()) if (r.cedula === cedula) return { ok: false, motivo: "duplicada" };
    const id = crypto.randomUUID();
    this.registros.set(id, { ...datos, id, creado_en: new Date().toISOString() });
    return { ok: true, id, modo: "demo" };
  }
}

/** Inserta en la tabla crm.inscripciones mediante la API REST de Supabase. */
export class AlmacenSupabase implements AlmacenInscripciones {
  constructor(
    private readonly url: string,
    private readonly serviceKey: string,
    private readonly organizationId: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  async guardar(datos: Inscripcion, meta: { ip?: string; userAgent?: string }): Promise<ResultadoGuardado> {
    const res = await this.fetcher(`${this.url.replace(/\/$/, "")}/rest/v1/inscripciones`, {
      method: "POST",
      headers: {
        apikey: this.serviceKey,
        Authorization: `Bearer ${this.serviceKey}`,
        "Content-Type": "application/json",
        "Content-Profile": "crm",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        ...datos,
        organization_id: this.organizationId,
        origen_datos: "AUTODECLARADO",
        consentimiento_ip: meta.ip ?? null,
        consentimiento_user_agent: meta.userAgent?.slice(0, 300) ?? null,
      }),
    });
    if (res.status === 409) return { ok: false, motivo: "duplicada" };
    if (!res.ok) return { ok: false, motivo: "error", detalle: `HTTP ${res.status}` };
    const [fila] = (await res.json()) as Array<{ id: string }>;
    return { ok: true, id: fila.id, modo: "supabase" };
  }
}

let almacen: AlmacenInscripciones | undefined;

export function obtenerAlmacen(): AlmacenInscripciones {
  if (almacen) return almacen;
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, POLITICA28_ORGANIZATION_ID } = process.env;
  almacen =
    SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && POLITICA28_ORGANIZATION_ID
      ? new AlmacenSupabase(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, POLITICA28_ORGANIZATION_ID)
      : new AlmacenMemoria();
  return almacen;
}
