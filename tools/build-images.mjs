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

  // As marcas de img/marca/ têm transparência: saem em PNG e WebP, nunca em
  // JPEG. Os arquivos de logo originais são a fonte delas (veja
  // tools/logo-alpha.mjs) e não precisam de versão web própria.
  const isLogo = /^marca[/\\]/.test(rel);
  if (/rosengarten_logo|fav-icon/i.test(base)) continue;

  // Logos e ícones mantêm transparência e saem em PNG + WebP.
  const widths = isLogo
    ? [180, 360, 720].filter((w) => w <= meta.width)
    : WIDTHS.filter((w) => w <= meta.width).concat(meta.width < WIDTHS[0] ? [meta.width] : []);

  // As marcas já saem recortadas do logo-alpha.mjs.
  const preparar = () => sharp(file);

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
    ? pipeline.png({ compressionLevel: 9 })
    : pipeline.jpeg({ quality: 78, mozjpeg: true })
  ).toFile(fallback);
  bytesOut += (await stat(fallback)).size;
  written++;
}

const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';
console.log(`${files.length} originais (${mb(bytesIn)}) -> ${written} arquivos (${mb(bytesOut)})`);

/* --- Imagem de compartilhamento ----------------------------------------
   O que o WhatsApp, o Facebook e o Google mostram na prévia de link. Precisa
   ser 1200x630: qualquer outra proporção é recortada por eles, geralmente
   cortando fora o assunto. A marca em branco no canto faz o cartão ser
   reconhecido quando alguém repassa o link. */

const CARTAO = { w: 1200, h: 630 };

const foto = await sharp('img/casa_centenaria_jardim.jpg')
  .resize({ width: CARTAO.w, height: CARTAO.h, fit: 'cover', position: 'attention' })
  .toBuffer();

const escurecer = Buffer.from(
  `<svg width="${CARTAO.w}" height="${CARTAO.h}" xmlns="http://www.w3.org/2000/svg">
     <defs>
       <linearGradient id="s" x1="0" y1="1" x2="0.55" y2="0">
         <stop offset="0" stop-color="#0a0e09" stop-opacity="0.88"/>
         <stop offset="0.45" stop-color="#0a0e09" stop-opacity="0.35"/>
         <stop offset="1" stop-color="#0a0e09" stop-opacity="0"/>
       </linearGradient>
     </defs>
     <rect width="${CARTAO.w}" height="${CARTAO.h}" fill="url(#s)"/>
   </svg>`,
);

const marcaCartao = await sharp('img/marca/brasao-claro.png').resize({ width: 380 }).toBuffer();
const { height: mh } = await sharp(marcaCartao).metadata();

await sharp(foto)
  .composite([
    { input: escurecer, top: 0, left: 0 },
    { input: marcaCartao, left: 56, top: CARTAO.h - mh - 48 },
  ])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(path.join(OUT, 'compartilhar.jpg'));

console.log(`${OUT}/compartilhar.jpg  ${CARTAO.w}x${CARTAO.h}`);
