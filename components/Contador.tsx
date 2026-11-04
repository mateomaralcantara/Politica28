"use client";

import { useEffect, useState } from "react";

/** Número que sube desde 0 hasta su valor al aparecer (respeta «reducir movimiento»). */
export default function Contador({ valor, sufijo = "", duracion = 1100 }: { valor: number; sufijo?: string; duracion?: number }) {
  const [actual, setActual] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || valor === 0) {
      setActual(valor);
      return;
    }
    let raf = 0;
    const inicio = performance.now();
    const paso = (t: number) => {
      const p = Math.min(1, (t - inicio) / duracion);
      const suave = 1 - Math.pow(1 - p, 3);
      setActual(Math.round(valor * suave));
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor, duracion]);

  return (
    <span className="tabular-nums">
      {new Intl.NumberFormat("es-DO").format(actual)}
      {sufijo}
    </span>
  );
}
