/** Logotipo tipográfico «POLÍTICA 28». */
export default function Marca({ tamano = "md" }: { tamano?: "sm" | "md" | "lg" }) {
  const texto = { sm: "text-[11px]", md: "text-[17px]", lg: "text-3xl" }[tamano];
  return (
    <span className={`font-marca inline-flex items-baseline gap-[0.28em] leading-none font-extrabold tracking-[-0.03em] text-slate-900 ${texto}`}>
      <span>POLÍTICA</span>
      <span className="texto-gradiente degradado-vivo font-black">28</span>
    </span>
  );
}
