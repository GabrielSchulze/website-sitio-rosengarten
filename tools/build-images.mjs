/**
 * Gera as imagens responsivas de assets/img/ a partir dos originais em img/.
 * Uso: npm run build:img
 *
 * Para cada foto produz WebP em várias larguras + um JPEG de fallback.
 * Os originais em img/ continuam sendo a fonte da verdade e nunca são alterados.
 */
import sharp from 'sharp';
import { readdir, mkdir, stat } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'img';
const OUT = 'assets/img';
const WIDTHS = [480, 960, 1600];
const FALLBACK_WIDTH = 1200;
// Fotos de mata fechada comprimem mal; a qualidade cai conforme a largura sobe
// para que nenhum arquivo de 1600px passe de ~250 KB.
const QUALIDADE = { 480: 78, 960: 73, 1600: 66 };

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (/\.(jpe?g|png)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

const files = (await walk(SRC)).sort();
let written = 0;
let bytesIn = 0;
let bytesOut = 0;

for (const file of files) {
  const rel = path.relative(SRC, file);
  const dir = path.join(OUT, path.dirname(rel));
  const base = path.basename(rel).replace(/\.[^.]+$/, '');
  await mkdir(dir, { recursive: true });

  bytesIn += (await stat(file)).size;
  const image = sharp(file);
  const meta = await image.metadata();
  const isLogo = /logo|fav-icon/i.test(base);

  // Logos e ícones mantêm transparência e saem em PNG + WebP.
  const widths = isLogo
    ? [360, 720].filter((w) => w <= meta.width)
    : WIDTHS.filter((w) => w <= meta.width).concat(meta.width < WIDTHS[0] ? [meta.width] : []);

  // Os arquivos de logo vêm numa tela quadrada com muita margem vazia;
  // sem recortar, a marca fica minúscula dentro do cabeçalho.
  // O favicon fica de fora: precisa continuar quadrado.
  const recortar = isLogo && !/fav-icon/i.test(base);
  const preparar = () => (recortar ? sharp(file).trim({ threshold: 12 }) : sharp(file));

  for (const w of widths) {
    const target = path.join(dir, `${base}-${w}.webp`);
    await preparar().resize({ width: w, withoutEnlargement: true })
      .webp({ quality: isLogo ? 90 : (QUALIDADE[w] ?? 73), effort: 6, smartSubsample: true })
      .toFile(target);
    bytesOut += (await stat(target)).size;
    written++;
  }

  const fallback = path.join(dir, `${base}.${isLogo ? 'png' : 'jpg'}`);
  const pipeline = preparar().resize({
    width: Math.min(isLogo ? 720 : FALLBACK_WIDTH, meta.width),
    withoutEnlargement: true,
  });
  await (isLogo
    ? pipeline.png({ compressionLevel: 9, palette: true })
    : pipeline.jpeg({ quality: 78, mozjpeg: true })
  ).toFile(fallback);
  bytesOut += (await stat(fallback)).size;
  written++;
}

const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';
console.log(`${files.length} originais (${mb(bytesIn)}) -> ${written} arquivos (${mb(bytesOut)})`);
