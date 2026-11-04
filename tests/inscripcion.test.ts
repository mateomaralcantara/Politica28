import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { CAMPOS, CLAVES_CAMPOS, SECCIONES } from "@/lib/inscripcion/campos";
import { crearEsquemaInscripcion, erroresPorCampo } from "@/lib/inscripcion/schema";
import { digitoVerificadorCedula } from "@/lib/jce/cedula";
import { AlmacenMemoria, AlmacenSupabase } from "@/lib/inscripcion/store";

const HOY = new Date("2026-11-04T12:00:00Z");
const esquema = crearEsquemaInscripcion(() => HOY);
const ced = (b: string) => b + digitoVerificadorCedula(b);

const valido = () => ({
  cedula: ced("0011234567"),
  fecha_expiracion: "2030-01-01",
  nombres: "Ana María",
  primer_apellido: "Pérez",
  sexo: "F",
  fecha_nacimiento: "1990-05-10",
  lugar_nacimiento: "Santiago de los Caballeros, Santiago",
  nacionalidad: "Dominicana",
  estado_civil: "SOLTERO",
  ocupacion: "Contadora",
  domicilio_provincia: "25",
  domicilio_municipio: "Santiago de los Caballeros",
  domicilio_sector: "Los Jardines",
  domicilio_calle: "Calle 1",
  telefono_movil: "809-555-1234",
  cargo_solicitado: "PROMOTOR",
  jurisdiccion_nivel: "MUNICIPIO",
  jurisdiccion_provincia: "25",
  jurisdiccion_municipio: "Santiago de los Caballeros",
  consentimiento_tratamiento: true,
  declaracion_veracidad: true,
});

describe("catálogo de campos JCE", () => {
  it("incluye todos los campos de la cédula, registro civil y padrón", () => {
    const jce = [
      "cedula", "fecha_expedicion", "fecha_expiracion", "cedula_anterior",
      "nombres", "primer_apellido", "segundo_apellido", "sexo", "fecha_nacimiento", "lugar_nacimiento",
      "nacionalidad", "estado_civil", "tipo_sangre", "ocupacion",
      "acta_oficialia", "acta_libro", "acta_folio", "acta_numero", "acta_anio", "nombre_padre", "nombre_madre",
      "domicilio_provincia", "domicilio_municipio", "domicilio_distrito_municipal", "domicilio_seccion",
      "domicilio_paraje", "domicilio_sector", "domicilio_calle", "domicilio_numero",
      "vota_en_exterior", "exterior_circunscripcion", "exterior_pais", "votacion_provincia", "votacion_municipio",
      "votacion_distrito_municipal", "circunscripcion", "recinto_codigo", "recinto_nombre", "recinto_direccion",
      "colegio_electoral", "posicion_padron",
    ];
    for (const k of jce) expect(CLAVES_CAMPOS, k).toContain(k);
    for (const k of jce) expect(CAMPOS.find((c) => c.clave === k)!.origen).toMatch(/^JCE_/);
  });

  it("no repite claves y cada select tiene opciones", () => {
    expect(new Set(CLAVES_CAMPOS).size).toBe(CLAVES_CAMPOS.length);
    for (const c of CAMPOS) if (c.tipo === "select") expect(c.opciones?.length, c.clave).toBeGreaterThan(0);
    expect(SECCIONES).toHaveLength(8);
  });

  it("cada campo del formulario tiene su columna en la migración SQL", () => {
    const sql = readFileSync(path.join(__dirname, "../supabase/migrations/0001_inscripciones.sql"), "utf8");
    const tabla = sql.slice(sql.indexOf("create table if not exists crm.inscripciones"));
    for (const k of CLAVES_CAMPOS) expect(tabla, k).toMatch(new RegExp(`^\\s+${k}\\s`, "m"));
  });

  it("ofrece las 32 demarcaciones provinciales y los 5 cargos", () => {
    expect(CAMPOS.find((c) => c.clave === "domicilio_provincia")!.opciones).toHaveLength(32);
    expect(CAMPOS.find((c) => c.clave === "cargo_solicitado")!.opciones).toHaveLength(5);
  });
});

describe("esquema de inscripción", () => {
  it("acepta un formulario mínimo válido y normaliza", () => {
    const r = esquema.safeParse({ ...valido(), cedula: "001-1234567-" + valido().cedula[10], segundo_apellido: "  " });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.cedula).toBe(valido().cedula);
    expect(r.data.telefono_movil).toBe("8095551234");
    expect(r.data.segundo_apellido).toBeUndefined();
    expect(r.data.vota_en_exterior).toBe(false);
  });

  it("exige campos obligatorios con mensajes por campo", () => {
    const r = esquema.safeParse({});
    expect(r.success).toBe(false);
    if (r.success) return;
    const e = erroresPorCampo(r.error);
    for (const c of CAMPOS.filter((c) => c.requerido)) expect(e[c.clave], c.clave).toBeDefined();
  });

  it("rechaza cédula con dígito verificador inválido", () => {
    const c = valido().cedula;
    const r = esquema.safeParse({ ...valido(), cedula: c.slice(0, 10) + ((Number(c[10]) + 1) % 10) });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(erroresPorCampo(r.error).cedula).toMatch(/verificador/);
  });

  it("valida reglas cruzadas de edad y vencimiento", () => {
    const r = esquema.safeParse({ ...valido(), fecha_nacimiento: "2010-01-01", fecha_expiracion: "2020-01-01" });
    expect(r.success).toBe(false);
    if (r.success) return;
    const e = erroresPorCampo(r.error);
    expect(e.fecha_nacimiento).toMatch(/18/);
    expect(e.fecha_expiracion).toMatch(/vencida/);
  });

  it("valida formato de colegio electoral y código postal", () => {
    const ok = esquema.safeParse({ ...valido(), colegio_electoral: "0045A", domicilio_codigo_postal: "51000" });
    expect(ok.success).toBe(true);
    const mal = esquema.safeParse({ ...valido(), colegio_electoral: "45", domicilio_codigo_postal: "51" });
    expect(mal.success).toBe(false);
    if (mal.success) return;
    expect(Object.keys(erroresPorCampo(mal.error))).toEqual(expect.arrayContaining(["colegio_electoral", "domicilio_codigo_postal"]));
  });

  it("exige datos del exterior y descarta los nacionales cuando vota fuera", () => {
    const falta = esquema.safeParse({ ...valido(), vota_en_exterior: true });
    expect(falta.success).toBe(false);
    const r = esquema.safeParse({
      ...valido(), vota_en_exterior: true, exterior_circunscripcion: "E1", exterior_pais: "Estados Unidos",
      votacion_provincia: "25", circunscripcion: "1",
    });
    expect(r.success).toBe(true);
    if (!r.success) return;
    expect(r.data.votacion_provincia).toBeUndefined();
    expect(r.data.circunscripcion).toBeUndefined();
  });

  it("exige distrito municipal cuando la jurisdicción es distrital", () => {
    const r = esquema.safeParse({ ...valido(), jurisdiccion_nivel: "DISTRITO_MUNICIPAL" });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(erroresPorCampo(r.error).jurisdiccion_distrito_municipal).toBeDefined();
  });

  it("rechaza campos desconocidos y consentimientos no aceptados", () => {
    const r = esquema.safeParse({ ...valido(), preferencia_politica: "X", consentimiento_tratamiento: false });
    expect(r.success).toBe(false);
    if (r.success) return;
    const e = erroresPorCampo(r.error);
    expect(e._formulario).toMatch(/preferencia_politica/);
    expect(e.consentimiento_tratamiento).toBeDefined();
  });
});

describe("almacenes", () => {
  it("memoria evita cédulas duplicadas", async () => {
    const a = new AlmacenMemoria();
    expect(await a.guardar({ cedula: "1" }, {})).toMatchObject({ ok: true, modo: "demo" });
    expect(await a.guardar({ cedula: "1" }, {})).toEqual({ ok: false, motivo: "duplicada" });
  });

  it("supabase envía al esquema crm con organización y origen autodeclarado", async () => {
    let llamada: { url: string; init: RequestInit } | undefined;
    const fetcher = (async (url: string, init: RequestInit) => {
      llamada = { url, init };
      return new Response(JSON.stringify([{ id: "abc" }]), { status: 201 });
    }) as unknown as typeof fetch;
    const a = new AlmacenSupabase("https://x.supabase.co/", "key", "org-1", fetcher);
    expect(await a.guardar({ cedula: "1" }, { ip: "1.2.3.4" })).toEqual({ ok: true, id: "abc", modo: "supabase" });
    expect(llamada!.url).toBe("https://x.supabase.co/rest/v1/inscripciones");
    expect((llamada!.init.headers as Record<string, string>)["Content-Profile"]).toBe("crm");
    expect(JSON.parse(String(llamada!.init.body))).toMatchObject({ organization_id: "org-1", origen_datos: "AUTODECLARADO", consentimiento_ip: "1.2.3.4" });
  });
});
