import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Marca from "@/components/Marca";
import { OPC, etiqueta, tieneCertificado } from "@/lib/educacion/schema";
import { obtenerAlmacenEducacion } from "@/lib/educacion/store";
import { PROVINCIAS } from "@/lib/territorio/provincias";
import BotonImprimir from "./BotonImprimir";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Certificado", robots: { index: false, follow: false } };

export default async function Certificado({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const almacen = obtenerAlmacenEducacion();
  const participante = await almacen.obtener("participantes", id);
  const curso = participante ? await almacen.obtener("cursos", String(participante.curso_id)) : null;
  if (!participante || !curso || !tieneCertificado(participante, curso)) notFound();

  const fecha = new Intl.DateTimeFormat("es-DO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${curso.fecha}T00:00:00Z`));
  const lugar = curso.alcance === "NACIONAL" ? "República Dominicana" : `${PROVINCIAS.find((p) => p.codigo === curso.provincia)?.nombre ?? ""}, República Dominicana`;
  const codigo = id.replace(/-/g, "").slice(0, 10).toUpperCase();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 print:bg-white print:p-0">
      <style>{`@page { size: A4 landscape; margin: 0 } @media print { .no-imprimir { display: none !important } }`}</style>
      <div className="no-imprimir mx-auto mb-5 flex max-w-[1060px] flex-wrap items-center justify-between gap-3">
        <Link href="/educacion" className="text-sm font-semibold text-blue-700 hover:underline">← Volver a Educación</Link>
        <BotonImprimir />
      </div>

      <article className="relative mx-auto aspect-[297/210] w-full max-w-[1060px] overflow-hidden bg-white shadow-2xl print:max-w-none print:shadow-none">
        <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_100%_0%,rgba(59,130,246,0.14),transparent_60%),radial-gradient(700px_400px_at_0%_100%,rgba(14,165,233,0.12),transparent_60%)]" />
        <div className="absolute inset-[2.2%] rounded-[6px] border-[3px] border-blue-700" />
        <div className="absolute inset-[3.2%] rounded-[4px] border border-blue-300" />
        <div className="absolute inset-x-0 top-0 h-[1.6%] bg-gradiente" />

        <div className="relative flex h-full flex-col items-center px-[9%] pt-[6.5%] pb-[5.5%] text-center">
          <Marca tamano="lg" />
          <p className="mt-[1.2%] text-[clamp(8px,1.1vw,12px)] font-bold uppercase tracking-[0.3em] text-slate-400">Escuela de formación</p>

          <h1 className="font-marca mt-[4%] text-[clamp(20px,3.6vw,40px)] font-black tracking-[-0.03em] text-blue-800">Certificado de participación</h1>
          <p className="mt-[2.5%] text-[clamp(10px,1.4vw,16px)] text-slate-600">Se otorga el presente certificado a</p>
          <p className="mt-[1.5%] border-b-2 border-blue-200 px-[4%] pb-[1%] text-[clamp(20px,3.8vw,44px)] font-extrabold tracking-tight text-slate-900">{String(participante.nombre)}</p>
          <p className="mt-[1.2%] text-[clamp(9px,1.2vw,14px)] font-semibold text-blue-700">{etiqueta(OPC.cargo, participante.cargo)}</p>

          <p className="mx-auto mt-[3%] max-w-[78%] text-[clamp(10px,1.45vw,17px)] leading-relaxed text-slate-700">
            por haber participado y asistido al curso <strong className="text-slate-900">«{String(curso.titulo)}»</strong>
            {` (${etiqueta(OPC.tema, curso.tema)}`}
            {curso.duracion_horas ? `, ${String(curso.duracion_horas)} horas` : ""}
            {`, modalidad ${etiqueta(OPC.modalidad, curso.modalidad).toLowerCase()})`}, realizado el {fecha} en {lugar}.
          </p>

          <div className="mt-auto grid w-full grid-cols-2 gap-[12%] px-[6%]">
            {[curso.facilitador ? String(curso.facilitador) : "Facilitador(a)", "Coordinación de formación"].map((firma, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto h-[1px] w-full bg-slate-400" />
                <p className="mt-2 text-[clamp(9px,1.15vw,13px)] font-semibold text-slate-800">{firma}</p>
                <p className="text-[clamp(8px,0.95vw,11px)] text-slate-500">{i === 0 ? "Facilitación" : "POLÍTICA 28"}</p>
              </div>
            ))}
          </div>
          <p className="mt-[3%] text-[clamp(7px,0.85vw,10px)] font-medium tracking-wider text-slate-400">Código de verificación: {codigo}</p>
        </div>
      </article>
    </main>
  );
}
