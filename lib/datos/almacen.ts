/**
 * Almacén genérico de colecciones (memoria o Supabase), usado por los módulos
 * Comunicaciones y Educación. Cada registro pertenece a la organización
 * configurada en POLITICA28_ORGANIZATION_ID.
 */
export type Registro = Record<string, unknown> & { id: string; creado_en: string };

export interface Almacen<C extends string> {
  listar(c: C): Promise<Registro[]>;
  obtener(c: C, id: string): Promise<Registro | null>;
  crear(c: C, datos: Record<string, unknown>): Promise<Registro>;
  actualizar(c: C, id: string, cambios: Record<string, unknown>): Promise<Registro | null>;
  eliminar(c: C, id: string): Promise<boolean>;
}

const sinIndefinidos = (d: Record<string, unknown>) => Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined));

export class AlmacenMemoria<C extends string> implements Almacen<C> {
  private readonly datos = new Map<C, Registro[]>();
  private de(c: C) {
    if (!this.datos.has(c)) this.datos.set(c, []);
    return this.datos.get(c)!;
  }
  async listar(c: C) {
    return [...this.de(c)].sort((a, b) => b.creado_en.localeCompare(a.creado_en));
  }
  async obtener(c: C, id: string) {
    return this.de(c).find((r) => r.id === id) ?? null;
  }
  async crear(c: C, datos: Record<string, unknown>) {
    const r: Registro = { ...sinIndefinidos(datos), id: crypto.randomUUID(), creado_en: new Date().toISOString() };
    this.de(c).push(r);
    return r;
  }
  async actualizar(c: C, id: string, cambios: Record<string, unknown>) {
    const r = this.de(c).find((x) => x.id === id);
    if (!r) return null;
    Object.assign(r, sinIndefinidos(cambios));
    return r;
  }
  async eliminar(c: C, id: string) {
    const lista = this.de(c);
    const i = lista.findIndex((r) => r.id === id);
    if (i < 0) return false;
    lista.splice(i, 1);
    return true;
  }
}

export class AlmacenSupabase<C extends string> implements Almacen<C> {
  constructor(
    private readonly tablas: Record<C, string>,
    private readonly url: string,
    private readonly key: string,
    private readonly org: string,
    private readonly fetcher: typeof fetch = fetch,
  ) {}

  private endpoint(c: C, query = "") {
    return `${this.url.replace(/\/$/, "")}/rest/v1/${this.tablas[c]}${query}`;
  }
  private filtroId(id: string) {
    return `?id=eq.${encodeURIComponent(id)}&organization_id=eq.${encodeURIComponent(this.org)}`;
  }
  private headers(extra: Record<string, string> = {}) {
    return { apikey: this.key, Authorization: `Bearer ${this.key}`, "Accept-Profile": "crm", "Content-Profile": "crm", ...extra };
  }
  private async json<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  }

  async listar(c: C) {
    const q = `?organization_id=eq.${encodeURIComponent(this.org)}&order=creado_en.desc`;
    return this.json<Registro[]>(await this.fetcher(this.endpoint(c, q), { headers: this.headers(), cache: "no-store" }));
  }
  async obtener(c: C, id: string) {
    const filas = await this.json<Registro[]>(await this.fetcher(this.endpoint(c, this.filtroId(id)), { headers: this.headers(), cache: "no-store" }));
    return filas[0] ?? null;
  }
  async crear(c: C, datos: Record<string, unknown>) {
    const res = await this.fetcher(this.endpoint(c), {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify({ ...sinIndefinidos(datos), organization_id: this.org }),
    });
    return (await this.json<Registro[]>(res))[0];
  }
  async actualizar(c: C, id: string, cambios: Record<string, unknown>) {
    const res = await this.fetcher(this.endpoint(c, this.filtroId(id)), {
      method: "PATCH",
      headers: this.headers({ "Content-Type": "application/json", Prefer: "return=representation" }),
      body: JSON.stringify(sinIndefinidos(cambios)),
    });
    return (await this.json<Registro[]>(res))[0] ?? null;
  }
  async eliminar(c: C, id: string) {
    const res = await this.fetcher(this.endpoint(c, this.filtroId(id)), { method: "DELETE", headers: this.headers({ Prefer: "return=representation" }) });
    return (await this.json<unknown[]>(res)).length > 0;
  }
}

/** Devuelve (y memoriza en globalThis) el almacén del módulo según la configuración. */
export function almacenDeModulo<C extends string>(clave: string, tablas: Record<C, string>): Almacen<C> {
  const g = globalThis as unknown as Record<string, Almacen<C> | undefined>;
  const k = `__politica28_${clave}`;
  if (g[k]) return g[k]!;
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, POLITICA28_ORGANIZATION_ID } = process.env;
  g[k] =
    SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && POLITICA28_ORGANIZATION_ID
      ? new AlmacenSupabase<C>(tablas, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, POLITICA28_ORGANIZATION_ID)
      : new AlmacenMemoria<C>();
  return g[k]!;
}

/** Enmascara un teléfono y un correo para listados. */
export function enmascararContacto<T extends Record<string, unknown>>(r: T, campos: { telefono?: string; email?: string } = { telefono: "telefono", email: "email" }): T {
  const out: Record<string, unknown> = { ...r };
  const t = campos.telefono && typeof r[campos.telefono] === "string" ? String(r[campos.telefono]) : "";
  const e = campos.email && typeof r[campos.email] === "string" ? String(r[campos.email]) : "";
  if (campos.telefono) out[campos.telefono] = t ? `•••-•••-${t.slice(-4)}` : undefined;
  if (campos.email) out[campos.email] = e ? e.replace(/^(.).*(@.*)$/, "$1•••$2") : undefined;
  return out as T;
}
