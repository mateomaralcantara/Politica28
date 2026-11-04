/**
 * Genera la identidad visual que ven navegadores y redes sociales:
 *   app/icon.png              favicon (96×96)
 *   app/apple-icon.png        ícono de inicio en iPhone (180×180)
 *   public/icon-192.png       ícono PWA (192×192)
 *   public/icon-512.png       ícono PWA (512×512)
 *   public/icon-maskable.png  ícono PWA adaptable para Android (512×512, con margen)
 *   app/opengraph-image.png   vista previa al compartir en WhatsApp, Facebook, LinkedIn… (1200×630)
 *   app/twitter-image.png     vista previa en X/Twitter (1200×630)
 *
 * Uso (requiere Playwright con Chromium):  node scripts/generar-iconos.mjs
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const FUENTES = `<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700&display=block" rel="stylesheet">`;
const DEGRADADO = "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 45%, #2563eb 70%, #0ea5e9 100%)";

const base = (cuerpo, ancho, alto) => `<!doctype html><html><head><meta charset="utf-8">${FUENTES}
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${ancho}px;height:${alto}px;overflow:hidden;background:transparent}
  .marca{font-family:'Unbounded',sans-serif}
  .texto{font-family:'Plus Jakarta Sans',sans-serif}
</style></head><body>${cuerpo}</body></html>`;

/** Ícono cuadrado: «28» blanco sobre degradado azul, con «POLÍTICA» si hay espacio. */
function icono(lado, { radio = 0.22, margen = 0, conNombre = true } = {}) {
  const interior = lado * (1 - margen * 2);
  const nombre = conNombre && lado >= 160;
  return base(
    `<div style="width:${lado}px;height:${lado}px;display:grid;place-items:center;background:${margen ? DEGRADADO : "transparent"}">
      <div style="position:relative;width:${interior}px;height:${interior}px;border-radius:${margen ? 0 : interior * radio}px;background:${DEGRADADO};overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center">
        <div style="position:absolute;right:-18%;top:-22%;width:70%;height:70%;border-radius:50%;background:rgba(125,211,252,.45);filter:blur(${interior * 0.08}px)"></div>
        <div style="position:absolute;left:-20%;bottom:-25%;width:65%;height:65%;border-radius:50%;background:rgba(30,58,138,.55);filter:blur(${interior * 0.08}px)"></div>
        <div style="position:absolute;inset:0;background:linear-gradient(160deg,rgba(255,255,255,.22),transparent 45%)"></div>
        ${nombre ? `<div class="marca" style="position:relative;color:rgba(255,255,255,.92);font-weight:800;font-size:${interior * 0.105}px;letter-spacing:.04em;margin-bottom:${interior * 0.01}px">POLÍTICA</div>` : ""}
        <div class="marca" style="position:relative;color:#fff;font-weight:900;font-size:${interior * (nombre ? 0.46 : 0.56)}px;line-height:.95;letter-spacing:-.06em;text-shadow:0 ${interior * 0.02}px ${interior * 0.05}px rgba(15,23,42,.35)">28</div>
      </div>
    </div>`,
    lado,
    lado,
  );
}

/** Imagen para compartir en redes (1200×630). */
function portada() {
  const barras = [38, 52, 44, 68, 60, 82, 74, 96];
  return base(
    `<div style="position:relative;width:1200px;height:630px;background:#fff;overflow:hidden">
      <div style="position:absolute;right:-160px;top:-200px;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(59,130,246,.30),transparent 65%)"></div>
      <div style="position:absolute;left:-200px;bottom:-260px;width:640px;height:640px;border-radius:50%;background:radial-gradient(circle,rgba(14,165,233,.22),transparent 65%)"></div>
      <div style="position:absolute;inset:0;opacity:.35;background-image:radial-gradient(#bfdbfe 1.5px,transparent 1.5px);background-size:28px 28px"></div>
      <div style="position:absolute;left:0;right:0;top:0;height:12px;background:${DEGRADADO}"></div>

      <div style="position:absolute;left:80px;top:96px;width:620px">
        <div style="display:flex;align-items:center;gap:22px">
          <div style="width:104px;height:104px;border-radius:28px;background:${DEGRADADO};display:grid;place-items:center;box-shadow:0 24px 50px -18px rgba(29,78,216,.7);position:relative;overflow:hidden">
            <div style="position:absolute;inset:0;background:linear-gradient(160deg,rgba(255,255,255,.25),transparent 50%)"></div>
            <span class="marca" style="position:relative;color:#fff;font-weight:900;font-size:50px;letter-spacing:-.06em">28</span>
          </div>
          <span class="texto" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#eff6ff;border:2px solid #bfdbfe;color:#1d4ed8;font-weight:700;font-size:20px;letter-spacing:.14em">VERSIÓN BETA</span>
        </div>

        <div class="marca" style="margin-top:44px;font-weight:900;font-size:92px;line-height:.95;letter-spacing:-.04em;color:#0f172a">
          POLÍTICA <span style="background:${DEGRADADO};-webkit-background-clip:text;background-clip:text;color:transparent">28</span>
        </div>
        <div class="texto" style="margin-top:26px;font-weight:600;font-size:31px;line-height:1.3;color:#334155">
          Gestión política, inteligencia electoral y organización territorial
        </div>
        <div class="texto" style="margin-top:30px;display:flex;align-items:center;gap:12px;font-weight:700;font-size:22px;color:#1d4ed8;letter-spacing:.12em">
          <span style="width:40px;height:4px;border-radius:4px;background:${DEGRADADO}"></span> REPÚBLICA DOMINICANA
        </div>
      </div>

      <div style="position:absolute;right:80px;top:120px;width:350px;height:390px;border-radius:32px;background:rgba(255,255,255,.85);border:2px solid #dbeafe;box-shadow:0 40px 80px -40px rgba(30,58,138,.45);padding:34px">
        <div class="texto" style="font-weight:700;font-size:17px;color:#64748b;letter-spacing:.12em">CENTRO DE MANDO</div>
        <div class="marca" style="margin-top:12px;font-weight:900;font-size:52px;color:#0f172a;letter-spacing:-.04em">32<span style="font-size:26px;color:#94a3b8"> prov.</span></div>
        <div style="margin-top:28px;height:190px;display:flex;align-items:flex-end;gap:12px">
          ${barras.map((h) => `<div style="flex:1;height:${h}%;border-radius:10px 10px 4px 4px;background:linear-gradient(0deg,#1d4ed8,#38bdf8)"></div>`).join("")}
        </div>
      </div>
    </div>`,
    1200,
    630,
  );
}

const salidas = [
  { archivo: "app/icon.png", html: icono(96), lado: 96 },
  { archivo: "app/apple-icon.png", html: icono(180, { radio: 0 }), lado: 180 },
  { archivo: "public/icon-192.png", html: icono(192), lado: 192 },
  { archivo: "public/icon-512.png", html: icono(512), lado: 512 },
  { archivo: "public/icon-maskable.png", html: icono(512, { margen: 0.1 }), lado: 512 },
  { archivo: "app/opengraph-image.png", html: portada(), ancho: 1200, alto: 630 },
  { archivo: "app/twitter-image.png", html: portada(), ancho: 1200, alto: 630 },
];

const navegador = await chromium.launch();
for (const s of salidas) {
  const ancho = s.ancho ?? s.lado;
  const alto = s.alto ?? s.lado;
  const pagina = await navegador.newPage({ viewport: { width: ancho, height: alto }, deviceScaleFactor: 1 });
  await pagina.setContent(s.html, { waitUntil: "networkidle" });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.screenshot({ path: path.join(raiz, s.archivo), omitBackground: !s.ancho, clip: { x: 0, y: 0, width: ancho, height: alto } });
  await pagina.close();
  console.log("✓", s.archivo);
}
await navegador.close();
