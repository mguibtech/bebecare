/**
 * Gerador do icone do app BebeCare (Android adaptive + legacy + Play Store).
 *
 * A partir da marca (dois pezinhos), produz:
 *  - mipmap-<d>/ic_launcher.png          (legacy quadrado: gradiente + pes brancos)
 *  - mipmap-<d>/ic_launcher_round.png    (legacy redondo)
 *  - mipmap-<d>/ic_launcher_foreground.png (adaptive: pes brancos, transparente)
 *  - mipmap-<d>/ic_launcher_background.png (adaptive: gradiente)
 *  - mipmap-anydpi-v26/ic_launcher.xml + ic_launcher_round.xml
 *  - assets/brand/ic_launcher-playstore.png (512x512, ficha da Play Store)
 *
 * No icone, os pes sao BRANCOS sobre o gradiente (legibilidade). A versao
 * duas-cores fica pro logo dentro do app (sobre fundos claros/escuros).
 *
 * Uso:  node scripts/gen-icons.mjs
 * Requer: sharp (devDependency). Roda 1x; os PNGs gerados sao commitados.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RES = join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const BRAND = join(__dirname, '..', 'assets', 'brand');

const BLUE = '#5B9BD5';
const PINK = '#F4A6B8';

// Tamanho do icone legacy (px) por densidade.
const LEGACY = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
// Tamanho do adaptive (108dp) por densidade.
const ADAPTIVE = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };

/** Bounding box dos pes no viewBox 0..100 (medido da marca). */
const FEET = { cx: 50, cy: 47.2, w: 70.4 };

/** Grupo SVG dos dois pezinhos numa unica cor. */
function feetPaths(color) {
  return `<g fill="${color}">
    <ellipse cx="39" cy="56" rx="15" ry="21" transform="rotate(-24 39 56)"/>
    <circle cx="20" cy="30" r="5.2"/><circle cx="29" cy="24" r="4.3"/><circle cx="38" cy="22" r="3.6"/>
    <ellipse cx="61" cy="56" rx="15" ry="21" transform="rotate(24 61 56)"/>
    <circle cx="80" cy="30" r="5.2"/><circle cx="71" cy="24" r="4.3"/><circle cx="62" cy="22" r="3.6"/>
  </g>`;
}

/** Pes centralizados e escalados pra ocupar `targetW` de um canvas 100x100. */
function feetCentered(color, targetW) {
  const s = targetW / FEET.w;
  const tx = 50 - FEET.cx * s;
  const ty = 50 - FEET.cy * s;
  return `<g transform="translate(${tx} ${ty}) scale(${s})">${feetPaths(color)}</g>`;
}

const gradientDef = `<defs>
  <linearGradient id="g" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${BLUE}"/><stop offset="1" stop-color="${PINK}"/>
  </linearGradient>
</defs>`;

/** Monta um <svg> de tamanho px com viewBox 0..100. */
function svg(px, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 100 100">${inner}</svg>`;
}

// --- Composicoes ---
const legacySquare = (px) =>
  svg(px, `${gradientDef}<rect width="100" height="100" fill="url(#g)"/>${feetCentered('#fff', 60)}`);

const legacyRound = (px) =>
  svg(px, `${gradientDef}<circle cx="50" cy="50" r="50" fill="url(#g)"/>${feetCentered('#fff', 58)}`);

const adaptiveForeground = (px) =>
  svg(px, feetCentered('#fff', 50)); // menor: respeita a "safe zone" do adaptive

const adaptiveBackground = (px) =>
  svg(px, `${gradientDef}<rect width="100" height="100" fill="url(#g)"/>`);

async function png(svgStr, px, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  await sharp(Buffer.from(svgStr)).resize(px, px).png().toFile(outPath);
}

async function main() {
  for (const [d, px] of Object.entries(LEGACY)) {
    const dir = join(RES, `mipmap-${d}`);
    await png(legacySquare(px), px, join(dir, 'ic_launcher.png'));
    await png(legacyRound(px), px, join(dir, 'ic_launcher_round.png'));
  }
  for (const [d, px] of Object.entries(ADAPTIVE)) {
    const dir = join(RES, `mipmap-${d}`);
    await png(adaptiveForeground(px), px, join(dir, 'ic_launcher_foreground.png'));
    await png(adaptiveBackground(px), px, join(dir, 'ic_launcher_background.png'));
  }

  // Adaptive XML (API 26+)
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;
  const anydpi = join(RES, 'mipmap-anydpi-v26');
  mkdirSync(anydpi, { recursive: true });
  writeFileSync(join(anydpi, 'ic_launcher.xml'), xml);
  writeFileSync(join(anydpi, 'ic_launcher_round.xml'), xml);

  // Play Store (512)
  await png(legacySquare(512), 512, join(BRAND, 'ic_launcher-playstore.png'));

  console.log('Icones gerados com sucesso.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
