import { COLECCIONES, enmascararComunicador, type Coleccion, type Registro } from "@/lib/comunicaciones/schema";

export interface AlmacenComunicaciones {
  listar(c: Coleccion): Promise<Registro[]>;
  crear(c: Coleccion, datos: Record<string, unknown>): Promise<Registro>;
  eliminar(c: Coleccion, id: string): Promise<boolean>;
}

const sinIndefinidos = (d: Record<string, unknown>) => Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined));

/** Almacén en memoria (modo demostración). */
export class MemoriaComunicaciones implements AlmacenComunicaciones {
  private readonly datos: Record<Coleccion, Registro[]> = { lineas: [], medios: [], comunicadores: [] };

  async listar(c: Coleccion) {
    return [...this.datos[c]].sort((a, b) => b.creado_en.localeCompare(a.creado_en));
  }
  async crear(c: Coleccion, datos: Record<string, unknown>) {
    const r: Registro = { ...sinIndefinidos(datos), id: crypto.randomUUID(), creado_en: new Date().toISOString() };
    this.datos[c].push(r);
    return r;
  }
  async eliminar(c: Coleccion, id: string) {
    const antes = this.datos[c].length;
    this.datos[c] = this.datos[c].filter((r) => r.id !== id);
    return this.datos[c].length < antes;
  }
}

/** Tablas del esquema `crm` en Supabase (ver supabase/migrations/0002_comunicaciones.sql). */
export class SupabaseComunicaciones implements AlmacenComunicaciones {
  constructor(
    private readonly url: string,
    private readonly key: string,
    private readonly org: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  private endpoint(c: Coleccion, query = "") {
    return `${this.url.replace(/\/$/, "")}/rest/v1/${COLECCIONES[c].tabla}${query}`;
  }
  private headers(extra: Record<string, string> = {}) {
    return { apikey: this.key, Authorization: `Bearer ${this.key}`, "Accept-Profile": "crm", "Content-Profile": "crm", ...extra };
  }

  async listar(c: Coleccion) {
    const res = await this.fetcher(this.endpoint(c, `?organization_id=eq.${encodeURIComponent(this.org)}&order=creado_en.desc`), {
      headers: this.headers(),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as Registro[];
  }
  async crear(c: Coleccion, datos: Record<string, unknown>) {
    const res = await this.fetcher(this.endpoint(c), {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify({ ...sinIndefinidos(datos), organization_id: this.org }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const [fila] = (await res.json()) as Registro[];
    return fila;
  }
  async eliminar(c: Coleccion, id: string) {
    const res = await this.fetcher(
      this.endpoint(c, `?id=eq.${encodeURIComponent(id)}&organization_id=eq.${encodeURIComponent(this.org)}`),
      { method: "DELETE", headers: this.headers({ Prefer: "return=representation" }) },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return ((await res.json()) as unknown[]).length > 0;
  }
}

const global = globalThis as typeof globalThis & { __politica28Comunicaciones?: AlmacenComunicaciones };

export function obtenerAlmacenComunicaciones(): AlmacenComunicaciones {
  if (global.__politica28Comunicaciones) return global.__politica28Comunicaciones;
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, POLITICA28_ORGANIZATION_ID } = process.env;
  global.__politica28Comunicaciones =
    SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && POLITICA28_ORGANIZATION_ID
      ? new SupabaseComunicaciones(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, POLITICA28_ORGANIZATION_ID)
      : new MemoriaComunicaciones();
  return global.__politica28Comunicaciones;
}

/** Listado listo para mostrar: los comunicadores salen con el contacto enmascarado. */
export async function listarPublico(c: Coleccion) {
  const filas = await obtenerAlmacenComunicaciones().listar(c);
  return c === "comunicadores" ? filas.map(enmascararComunicador) : filas;
}
