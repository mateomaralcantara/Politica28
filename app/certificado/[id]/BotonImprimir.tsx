"use client";

export default function BotonImprimir() {
  return (
    <button onClick={() => window.print()} className="btn-primario rounded-xl px-5 py-2.5 text-sm font-bold">
      Imprimir o guardar como PDF
    </button>
  );
}
