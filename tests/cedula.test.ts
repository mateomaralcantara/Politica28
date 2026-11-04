import { describe, expect, it } from "vitest";
import { digitoVerificadorCedula, formatearCedula, validarCedula } from "@/lib/jce/cedula";

// Cédulas sintéticas construidas con el algoritmo (no corresponden a personas reales).
const sintetica = (base10: string) => base10 + digitoVerificadorCedula(base10);

describe("cédula JCE", () => {
  it("calcula el dígito verificador (Luhn, pesos 1-2)", () => {
    // 0010000000 → suma = 0+0+1 = 1 → (10 - 1) % 10 = 9
    expect(digitoVerificadorCedula("0010000000")).toBe(9);
    // 4020000000: 4*1 + 0*2 + 2*1 = 6 → 4
    expect(digitoVerificadorCedula("4020000000")).toBe(4);
    // dígito ≥5 en posición par: 0500000000 → 5*2=10→1 → 9
    expect(digitoVerificadorCedula("0500000000")).toBe(9);
  });

  it("acepta cédula válida con o sin guiones", () => {
    const c = sintetica("0011234567");
    expect(validarCedula(c)).toMatchObject({ valida: true, cedula: c });
    expect(validarCedula(formatearCedula(c))).toMatchObject({ valida: true, formateada: formatearCedula(c) });
  });

  it("rechaza formato y verificador incorrectos", () => {
    expect(validarCedula("123")).toEqual({ valida: false, motivo: "formato" });
    expect(validarCedula("00000000000")).toEqual({ valida: false, motivo: "formato" });
    const c = sintetica("0011234567");
    const mala = c.slice(0, 10) + ((Number(c[10]) + 1) % 10);
    expect(validarCedula(mala)).toEqual({ valida: false, motivo: "verificador" });
  });

  it("formatea progresivamente mientras se escribe", () => {
    expect(formatearCedula("001")).toBe("001");
    expect(formatearCedula("0011234")).toBe("001-1234");
    expect(formatearCedula("00112345678999")).toBe("001-1234567-8");
  });
});
