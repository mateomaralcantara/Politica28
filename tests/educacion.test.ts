import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AlmacenMemoria } from "@/lib/datos/almacen";
import { COLECCIONES, erroresPorCampo, esquemaCurso, esquemaParticipante, tieneCertificado, type Coleccion } from "@/lib/educacion/schema";
import { inscribirParticipante } from "@/lib/educacion/store";

const curso = { titulo: "Taller de liderazgo", tema: "LIDERAZGO", modalidad: "PRESENCIAL", dirigido_a: "SUPERVISOR", alcance: "NACIONAL", sede: "Salón A", fecha: "2026-11-20", cupo: "2", estado: "PROGRAMADO" };
const persona = (tel: string) => ({ nombre: "Ana Pérez", cargo: "SUPERVISOR", provincia: "25", telefono: tel, consentimiento: true });

describe("cursos", () => {
  it("acepta un curso válido y convierte el cupo a número", () => {
    const r = esquemaCurso.safeParse(curso);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.cupo).toBe(2);
  });
  it("exige provincia si es provincial, lugar si es presencial, y cupo entero positivo", () => {
    const r = esquemaCurso.safeParse({ ...curso, alcance: "PROVINCIAL", sede: "", cupo: "0" });
    expect(r.success).toBe(false);
    if (!r.success) expect(Object.keys(erroresPorCampo(r.error))).toEqual(expect.arrayContaining(["provincia", "sede", "cupo"]));
    expect(esquemaCurso.safeParse({ ...curso, modalidad: "VIRTUAL", sede: "" }).success).toBe(true);
    expect(esquemaCurso.safeParse({ ...curso, cupo: "2.5" }).success).toBe(false);
  });
});

describe("inscripción a cursos", () => {
  async function preparar(estado = "PROGRAMADO") {
    const a = new AlmacenMemoria<Coleccion>();
    const c = await a.crear("cursos", { ...esquemaCurso.parse(curso), estado });
    return { a, c };
  }
  const datos = (cursoId: string, tel: string) => esquemaParticipante.parse({ ...persona(tel), curso_id: cursoId }) as Record<string, unknown>;

  it("respeta el cupo y evita duplicados", async () => {
    const { a, c } = await preparar();
    expect((await inscribirParticipante(datos(c.id, "8095550001"), a)).ok).toBe(true);
    expect(await inscribirParticipante(datos(c.id, "8095550001"), a)).toMatchObject({ ok: false, errores: { telefono: expect.any(String) } });
    expect((await inscribirParticipante(datos(c.id, "8095550002"), a)).ok).toBe(true);
    expect(await inscribirParticipante(datos(c.id, "8095550003"), a)).toMatchObject({ ok: false, status: 409, errores: { curso_id: expect.stringMatching(/cupo/) } });
  });

  it("no admite inscripciones en cursos finalizados o cancelados", async () => {
    for (const estado of ["FINALIZADO", "CANCELADO"]) {
      const { a, c } = await preparar(estado);
      expect(await inscribirParticipante(datos(c.id, "8095550001"), a)).toMatchObject({ ok: false, status: 409 });
    }
  });

  it("solo hay certificado si asistió a un curso finalizado", () => {
    const p = { id: "1", creado_en: "", asistio: true };
    expect(tieneCertificado(p, { id: "c", creado_en: "", estado: "FINALIZADO" })).toBe(true);
    expect(tieneCertificado(p, { id: "c", creado_en: "", estado: "EN_CURSO" })).toBe(false);
    expect(tieneCertificado({ ...p, asistio: false }, { id: "c", creado_en: "", estado: "FINALIZADO" })).toBe(false);
  });
});

describe("migración", () => {
  it("cada campo validado tiene su columna", () => {
    const sql = readFileSync(path.join(__dirname, "../supabase/migrations/0003_educacion.sql"), "utf8");
    for (const { esquema, tabla } of Object.values(COLECCIONES)) {
      const bloque = sql.slice(sql.indexOf(`crm.${tabla} (`));
      const def = bloque.slice(0, bloque.indexOf(");"));
      let s: unknown = esquema;
      while (s && typeof s === "object" && "_def" in s && !("shape" in (s as object))) {
        const d = (s as { _def: { schema?: unknown; innerType?: unknown } })._def;
        s = d.schema ?? d.innerType;
      }
      for (const k of Object.keys((s as { shape: object }).shape)) expect(def, `${tabla}.${k}`).toMatch(new RegExp(`^\\s+${k}\\s`, "m"));
    }
  });
});
