/**
 * Cédula de Identidad y Electoral (JCE) — formato 000-0000000-0.
 *
 * 11 dígitos: 3 de municipio/oficina de expedición, 7 de secuencia y 1
 * dígito verificador calculado con el algoritmo de Luhn (pesos 1,2,1,2…).
 */

export function normalizarCedula(valor: string): string {
  return (valor ?? "").replace(/\D/g, "");
}

export function formatearCedula(valor: string): string {
  const d = normalizarCedula(valor).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 10)}-${d.slice(10)}`;
}

export function digitoVerificadorCedula(primeros10: string): number {
  let suma = 0;
  for (let i = 0; i < 10; i++) {
    let p = Number(primeros10[i]) * (i % 2 === 0 ? 1 : 2);
    if (p > 9) p -= 9;
    suma += p;
  }
  return (10 - (suma % 10)) % 10;
}

export type ResultadoCedula =
  | { valida: true; cedula: string; formateada: string }
  | { valida: false; motivo: "formato" | "verificador" };

export function validarCedula(valor: string): ResultadoCedula {
  const d = normalizarCedula(valor);
  if (d.length !== 11 || /^0{11}$/.test(d)) return { valida: false, motivo: "formato" };
  if (digitoVerificadorCedula(d.slice(0, 10)) !== Number(d[10])) {
    return { valida: false, motivo: "verificador" };
  }
  return { valida: true, cedula: d, formateada: formatearCedula(d) };
}
