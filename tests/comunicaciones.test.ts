import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { COLECCIONES, enmascararComunicador, erroresPorCampo, esquemaComunicador, esquemaLinea, esquemaMedio } from "@/lib/comunicaciones/schema";
import { MemoriaComunicaciones } from "@/lib/comunicaciones/store";
import { AlmacenSupabase } from "@/lib/datos/almacen";

describe("línea comunicacional", () => {
  it("acepta un mensaje válido y valida la vigencia", () => {
    const base = { titulo: "Empleo", mensaje: "Más empleo para la juventud", publico: "JUVENTUD", tono: "CERCANO", estado: "APROBADO" };
    expect(esquemaLinea.safeParse(base).success).toBe(true);
    const r = esquemaLinea.safeParse({ ...base, vigencia_desde: "2026-12-01", vigencia_hasta: "2026-11-01" });
    expect(r.success).toBe(false);
    if (!r.success) expect(erroresPorCampo(r.error).vigencia_hasta).toBeDefined();
  });
});

describe("plan de medios", () => {
  const base = { accion: "Entrevista", tipo_medio: "RADIO", medio: "Emisora X", fecha_inicio: "2026-11-10", estado: "PLANIFICADO" };
  it("exige provincia cuando el alcance es provincial", () => {
    const r = esquemaMedio.safeParse({ ...base, alcance: "PROVINCIAL" });
    expect(r.success).toBe(false);
    if (!r.success) expect(erroresPorCampo(r.error).provincia).toMatch(/provincia/);
    expect(esquemaMedio.safeParse({ ...base, alcance: "PROVINCIAL", provincia: "25" }).success).toBe(true);
  });
  it("descarta la provincia en acciones nacionales y normaliza el presupuesto", () => {
    const r = esquemaMedio.safeParse({ ...base, alcance: "NACIONAL", provincia: "25", presupuesto: "15,000.50" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.provincia).toBeUndefined();
      expect(r.data.presupuesto).toBe(15000.5);
    }
    expect(esquemaMedio.safeParse({ ...base, alcance: "NACIONAL", presupuesto: "-5" }).success).toBe(false);
  });
});

describe("red de comunicadores", () => {
  const base = { nombre: "Rosa Díaz", provincia: "18", rol: "VOCERO", telefono: "829-555-1234", consentimiento: true };
  it("exige provincia válida, teléfono y consentimiento", () => {
    expect(esquemaComunicador.safeParse(base).success).toBe(true);
    const r = esquemaComunicador.safeParse({ ...base, provincia: "99", telefono: "123", consentimiento: false });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(erroresPorCampo(r.error))).toEqual(expect.arrayContaining(["provincia", "telefono", "consentimiento"]));
  });
  it("enmascara el contacto en los listados", () => {
    const m = enmascararComunicador({ id: "1", creado_en: "", telefono: "8295551234", email: "rosa@correo.do" });
    expect(m.telefono).toBe("•••-•••-1234");
    expect(m.email).toBe("r•••@correo.do");
  });
});

describe("almacenes y base de datos", () => {
  it("memoria crea, lista y elimina", async () => {
    const a = new MemoriaComunicaciones<"lineas">();
    const r = await a.crear("lineas", { titulo: "A", extra: undefined });
    expect(Object.keys(r)).not.toContain("extra");
    expect(await a.listar("lineas")).toHaveLength(1);
    expect(await a.eliminar("lineas", r.id)).toBe(true);
    expect(await a.listar("lineas")).toHaveLength(0);
  });

  it("supabase usa el esquema crm y filtra por organización", async () => {
    const llamadas: string[] = [];
    const fetcher = (async (url: string) => {
      llamadas.push(url);
      return new Response("[]", { status: 200 });
    }) as unknown as typeof fetch;
    const tablas = Object.fromEntries(Object.entries(COLECCIONES).map(([k, v]) => [k, v.tabla])) as Record<keyof typeof COLECCIONES, string>;
    await new AlmacenSupabase(tablas, "https://x.supabase.co", "k", "org-1", fetcher).listar("comunicadores");
    expect(llamadas[0]).toBe("https://x.supabase.co/rest/v1/comunicadores?organization_id=eq.org-1&order=creado_en.desc");
  });

  it("cada campo validado tiene su columna en la migración", () => {
    const sql = readFileSync(path.join(__dirname, "../supabase/migrations/0002_comunicaciones.sql"), "utf8");
    for (const { esquema, tabla } of Object.values(COLECCIONES)) {
      const bloque = sql.slice(sql.indexOf(`crm.${tabla} (`));
      const definicion = bloque.slice(0, bloque.indexOf(");"));
      // Recorre la forma base (dentro de efectos/refinamientos de zod).
      let s: unknown = esquema;
      while (s && typeof s === "object" && "_def" in s && !("shape" in (s as object))) {
        const def = (s as { _def: { schema?: unknown; innerType?: unknown } })._def;
        s = def.schema ?? def.innerType;
      }
      for (const k of Object.keys((s as { shape: object }).shape)) expect(definicion, `${tabla}.${k}`).toMatch(new RegExp(`^\\s+${k}\\s`, "m"));
    }
  });
});
