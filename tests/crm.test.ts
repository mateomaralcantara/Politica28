import { describe, expect, it } from "vitest";
import { MODULOS, MODULOS_OCULTOS, buscarModulo, hrefModulo } from "@/lib/navegacion";
import { agregar } from "@/lib/inscripcion/store";

describe("menú del CRM", () => {
  it("muestra los módulos de la interfaz principal más Inscripción, sin los de IA", () => {
    const esperados = [
      "Centro de mando", "Territorio nacional", "Estructura organizativa", "Coordinadores", "Supervisores",
      "Promotores", "Multiplicadores", "Actividades", "CRM", "Datos electorales", "Estadísticas",
      "Análisis predictivo", "Mapas", "Encuestas", "Comunicaciones", "Finanzas", "Informes", "Administración",
    ];
    const nombres = MODULOS.map((m) => m.nombre);
    expect(nombres).toEqual(expect.arrayContaining([...esperados, "Inscripción"]));
    expect(MODULOS).toHaveLength(19);
    expect(new Set(MODULOS.map(hrefModulo)).size).toBe(19);
    expect(nombres).not.toContain("Agentes IA");
    expect(nombres).not.toContain("Harness Agéntico");
    expect(MODULOS_OCULTOS.map((m) => m.slug).sort()).toEqual(["agentes-ia", "harness"]);
    expect(buscarModulo("agentes-ia")).toBeUndefined();
    expect(buscarModulo("harness")).toBeUndefined();
  });

  it("solo marca como disponibles los módulos que funcionan", () => {
    expect(MODULOS.filter((m) => m.listo).map(hrefModulo).sort()).toEqual(["/", "/inscripcion"]);
    expect(buscarModulo("mapas")?.fase).toBe(5);
    expect(buscarModulo("inscripcion")).toBeUndefined();
  });
});

describe("resumen agregado", () => {
  const hoy = new Date("2026-11-04T15:00:00Z");
  it("cuenta por provincia, supervisores distintos y por día sin exponer datos personales", () => {
    const r = agregar(
      [
        { domicilio_provincia: "25", supervisor_cedula: "A", creado_en: "2026-11-04T10:00:00Z", consentimiento_comunicaciones: true },
        { domicilio_provincia: "25", supervisor_cedula: "A", creado_en: "2026-11-03T10:00:00Z", vota_en_exterior: true },
        { domicilio_provincia: "01", supervisor_cedula: "B", creado_en: "2026-01-01T10:00:00Z" },
      ],
      hoy,
    );
    expect(r).toMatchObject({ total: 3, supervisores: 2, votanExterior: 1, aceptanComunicaciones: 1, porProvincia: { "25": 2, "01": 1 } });
    expect(r.porDia).toHaveLength(14);
    expect(r.porDia.at(-1)).toEqual({ fecha: "2026-11-04", total: 1 });
    expect(r.porDia.at(-2)).toEqual({ fecha: "2026-11-03", total: 1 });
    expect(JSON.stringify(r)).not.toMatch(/"A"|"B"/);
  });

  it("devuelve ceros sin inscripciones", () => {
    expect(agregar([], hoy)).toMatchObject({ total: 0, supervisores: 0, porProvincia: {} });
  });
});
