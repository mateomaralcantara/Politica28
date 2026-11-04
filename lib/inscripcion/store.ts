import type { Inscripcion } from "@/lib/inscripcion/schema";

export type ResultadoGuardado =
  | { ok: true; id: string; modo: "supabase" | "demo" }
  | { ok: false; motivo: "duplicada" | "error"; detalle?: string };

/** Solo cifras agregadas: el centro de mando nunca recibe datos personales. */
export type Resumen = {
  total: number;
  supervisores: number;
  votanExterior: number;
  aceptanComunicaciones: number;
  porProvincia: Record<string, number>;
  /** Inscripciones de los últimos 14 días, del más antiguo al más reciente. */
  porDia: Array<{ fecha: string; total: number }>;
};

type FilaResumen = {
  domicilio_provincia?: unknown;
  supervisor_cedula?: unknown;
  vota_en_exterior?: unknown;
  consentimiento_comunicaciones?: unknown;
  creado_en?: unknown;
};

export function agregar(filas: readonly FilaResumen[], hoy: Date = new Date()): Resumen {
  const porProvincia: Record<string, number> = {};
  const supervisores = new Set<string>();
  const dias = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate() - i));
    dias.set(d.toISOString().slice(0, 10), 0);
  }
  let votanExterior = 0;
  let aceptanComunicaciones = 0;
  for (const f of filas) {
    const prov = String(f.domicilio_provincia ?? "");
    if (prov) porProvincia[prov] = (porProvincia[prov] ?? 0) + 1;
    if (f.supervisor_cedula) supervisores.add(String(f.supervisor_cedula));
    if (f.vota_en_exterior === true) votanExterior++;
    if (f.consentimiento_comunicaciones === true) aceptanComunicaciones++;
    const dia = String(f.creado_en ?? "").slice(0, 10);
    if (dias.has(dia)) dias.set(dia, dias.get(dia)! + 1);
  }
  return {
    total: filas.length,
    supervisores: supervisores.size,
    votanExterior,
    aceptanComunicaciones,
    porProvincia,
    porDia: [...dias].map(([fecha, total]) => ({ fecha, total })),
  };
}

export interface AlmacenInscripciones {
  guardar(datos: Inscripcion, meta: { ip?: string; userAgent?: string }): Promise<ResultadoGuardado>;
  resumen(): Promise<Resumen>;
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

  async resumen(): Promise<Resumen> {
    return agregar([...this.registros.values()]);
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

  async resumen(): Promise<Resumen> {
    const columnas = "domicilio_provincia,supervisor_cedula,vota_en_exterior,consentimiento_comunicaciones,creado_en";
    const url = `${this.url.replace(/\/$/, "")}/rest/v1/inscripciones?select=${columnas}&organization_id=eq.${encodeURIComponent(this.organizationId)}`;
    const res = await this.fetcher(url, {
      headers: { apikey: this.serviceKey, Authorization: `Bearer ${this.serviceKey}`, "Accept-Profile": "crm" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`No se pudo leer el resumen: HTTP ${res.status}`);
    return agregar((await res.json()) as FilaResumen[]);
  }
}

// Se guarda en globalThis para que la API y las páginas compartan el mismo almacén.
const global = globalThis as typeof globalThis & { __politica28Almacen?: AlmacenInscripciones };

function configSupabase() {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, POLITICA28_ORGANIZATION_ID } = process.env;
  return SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && POLITICA28_ORGANIZATION_ID
    ? { url: SUPABASE_URL, key: SUPABASE_SERVICE_ROLE_KEY, org: POLITICA28_ORGANIZATION_ID }
    : null;
}

export function esModoDemo(): boolean {
  return configSupabase() === null;
}

export function obtenerAlmacen(): AlmacenInscripciones {
  if (global.__politica28Almacen) return global.__politica28Almacen;
  const cfg = configSupabase();
  global.__politica28Almacen = cfg ? new AlmacenSupabase(cfg.url, cfg.key, cfg.org) : new AlmacenMemoria();
  return global.__politica28Almacen;
}
