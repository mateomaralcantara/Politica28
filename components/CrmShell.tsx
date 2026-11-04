"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Icono from "@/components/Icono";
import { GRUPOS, MODULOS, hrefModulo } from "@/lib/navegacion";

function activo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export default function CrmShell({ children, modoDemo }: { children: React.ReactNode; modoDemo: boolean }) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState("");

  useEffect(() => setAbierto(false), [pathname]);

  const actual = MODULOS.find((m) => activo(pathname, hrefModulo(m)));
  const q = filtro.trim().toLowerCase();

  return (
    <div className="min-h-screen">
      {/* Fondo decorativo */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-blue-400/25 blur-3xl" />
        <div className="absolute top-1/3 -left-40 h-[420px] w-[420px] rounded-full bg-blue-400/20 blur-3xl" />
        <div className="absolute bottom-[-10%] right-1/4 h-[360px] w-[360px] rounded-full bg-sky-300/25 blur-3xl" />
      </div>

      {abierto && (
        <button aria-label="Cerrar menú" className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm lg:hidden" onClick={() => setAbierto(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/60 bg-white/80 shadow-[8px_0_40px_-20px_rgba(76,29,149,0.35)] backdrop-blur-xl transition-transform duration-300 lg:translate-x-0 ${abierto ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center gap-3 px-5 pt-6 pb-4">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradiente text-lg font-black text-white shadow-lg shadow-blue-500/30">
            28
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-extrabold tracking-tight text-slate-900">POLÍTICA 28</p>
            <p className="text-[11px] font-medium text-slate-500">Gestión territorial · RD</p>
          </div>
          <button className="ml-auto rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" aria-label="Cerrar menú" onClick={() => setAbierto(false)}>
            <Icono nombre="cerrar" />
          </button>
        </div>

        <div className="px-4 pb-3">
          <label className="relative block">
            <span className="sr-only">Buscar módulo</span>
            <Icono nombre="buscar" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar módulo…"
              className="w-full rounded-xl border border-slate-200 bg-white/70 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
            />
          </label>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-6" aria-label="Módulos">
          {GRUPOS.map((g) => {
            const modulos = g.modulos.filter((m) => !q || m.nombre.toLowerCase().includes(q));
            if (!modulos.length) return null;
            return (
              <div key={g.titulo} className="mt-4 first:mt-1">
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{g.titulo}</p>
                <ul className="space-y-0.5">
                  {modulos.map((m) => {
                    const href = hrefModulo(m);
                    const on = activo(pathname, href);
                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          aria-current={on ? "page" : undefined}
                          className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition ${
                            on ? "bg-gradient-to-r from-blue-600/10 via-blue-600/10 to-sky-400/10 text-slate-900" : "text-slate-600 hover:bg-slate-100/80 hover:text-slate-900"
                          }`}
                        >
                          {on && <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradiente-vertical" />}
                          <span className={`grid h-8 w-8 place-items-center rounded-lg transition ${on ? "bg-gradiente text-white shadow-md shadow-blue-500/30" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-blue-600"}`}>
                            <Icono nombre={m.icono} className="h-4 w-4" />
                          </span>
                          <span className="truncate">{m.nombre}</span>
                          {m.listo ? (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500" title="Disponible" />
                          ) : (
                            <span className="ml-auto text-[10px] font-semibold text-slate-400">F{m.fase}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        <div className="m-3 rounded-2xl bg-gradiente p-[1px]">
          <div className="rounded-[15px] bg-white/95 p-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <Icono nombre="escudo" className="h-4 w-4 text-blue-600" /> Datos protegidos
            </div>
            <p className="mt-1 text-[11px] leading-snug text-slate-500">Ley 172-13 · Aislamiento por organización y auditoría.</p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-xl">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-8">
            <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Abrir menú" onClick={() => setAbierto(true)}>
              <Icono nombre="menu" />
            </button>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">POLÍTICA 28</p>
              <p className="truncate text-sm font-bold text-slate-900">{actual?.nombre ?? "Módulo"}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {modoDemo && (
                <span className="hidden rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-800 sm:inline" title="Sin base de datos configurada: los registros se guardan en memoria.">
                  Modo demostración
                </span>
              )}
              {pathname !== "/inscripcion" && (
                <Link href="/inscripcion" className="btn-primario inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold">
                  <Icono nombre="mas" className="h-4 w-4" /> <span className="hidden sm:inline">Nueva inscripción</span>
                </Link>
              )}
            </div>
          </div>
          <div className="h-[2px] bg-gradiente" />
        </header>

        <main className="px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
