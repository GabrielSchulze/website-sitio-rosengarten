/**
 * Gera as marcas de img/marca/ a partir dos arquivos originais do logo.
 * Uso: npm run build:marca
 *
 * Os originais (img/rosengarten_logo.png e img/fav-icon.png) têm fundo branco
 * chapado, o que obrigaria a pôr a marca dentro de uma caixa branca sobre
 * qualquer fundo colorido. Aqui o branco EXTERNO é removido por preenchimento
 * a partir das bordas, preservando os brancos internos — o céu atrás da
 * árvore, o texto "1929" e os filetes ao lado de "SÍTIO".
 *
 * Saídas:
 *   brasao-cor.png     letreiro completo, colorido, com alfa (só em fundo claro:
 *                      o letreiro é preto e desaparece sobre fundo escuro)
 *   brasao-preto.png   letreiro monocromático preto, com alfa — é o que se usa
 *                      no cabeçalho, onde a versão colorida viraria borrão
 *   brasao-claro.png   o mesmo letreiro em branco, para fundo escuro
 *   icone.png          recorte quadrado da arcada com a árvore, para o favicon,
 *                      onde o letreiro inteiro viraria borrão
 *   icone-toque.png    o mesmo ícone achatado sobre a cor de fundo do site,
 *                      para a tela inicial do iOS (o Safari não respeita alfa)
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const LARGURA = 1600;
const LIMITE_FUNDO = 232;
const LIMITE_BORDA = 250;

/** Remove o fundo branco externo por preenchimento a partir das bordas. */
async function recortarFundo(entrada) {
  const { data, info } = await sharp(entrada)
    .resize({ width: LARGURA, withoutEnlargement: true })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  const { width: w, height: h, channels: c } = info;
  const fundo = new Uint8Array(w * h);
  const fila = new Int32Array(w * h);
  let cabeca = 0, cauda = 0;

  const claro = (i) => {
    const p = i * c;
    return data[p] >= LIMITE_FUNDO && data[p + 1] >= LIMITE_FUNDO && data[p + 2] >= LIMITE_FUNDO;
  };
  const semear = (i) => { if (!fundo[i] && claro(i)) { fundo[i] = 1; fila[cauda++] = i; } };

  for (let x = 0; x < w; x++) { semear(x); semear((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { semear(y * w); semear(y * w + w - 1); }

  while (cabeca < cauda) {
    const i = fila[cabeca++];
    const x = i % w, y = (i / w) | 0;
    if (x > 0) semear(i - 1);
    if (x < w - 1) semear(i + 1);
    if (y > 0) semear(i - w);
    if (y < h - 1) semear(i + w);
  }

  // Franja: pixel que sobrou encostado no fundo e quase branco ganha alfa
  // proporcional ao quanto é escuro, para não deixar contorno branco.
  const vizinhoFundo = (i, x, y) =>
    (x > 0 && fundo[i - 1]) || (x < w - 1 && fundo[i + 1]) ||
    (y > 0 && fundo[i - w]) || (y < h - 1 && fundo[i + w]);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x, p = i * c;
      if (fundo[i]) { data[p + 3] = 0; continue; }
      if (!vizinhoFundo(i, x, y)) continue;
      const luz = Math.max(data[p], data[p + 1], data[p + 2]);
      if (luz > LIMITE_BORDA) data[p + 3] = 0;
      else if (luz >= LIMITE_FUNDO) data[p + 3] = Math.round(255 * (255 - luz) / (255 - LIMITE_FUNDO));
    }
  }

  return sharp(data, { raw: { width: w, height: h, channels: c } })
    .trim({ threshold: 2 })
    .png()
    .toBuffer();
}

const png = (p, f) => p.png({ compressionLevel: 9 }).toFile(f);

await mkdir('img/marca', { recursive: true });

const cor = await recortarFundo('img/rosengarten_logo.png');
await png(sharp(cor), 'img/marca/brasao-cor.png');

// O arquivo monocromático já é preto sobre transparente; basta recortar a
// moldura vazia. Inverter o RGB preserva o alfa e dá a versão branca.
const preto = await recortarFundo('img/rosengarten_logo_bw.png');
await png(sharp(preto), 'img/marca/brasao-preto.png');
await png(sharp(preto).negate({ alpha: false }), 'img/marca/brasao-claro.png');

// Recorte do ícone: quadrado centrado na árvore, cortando a arcada nas
// laterais. O letreiro completo fica ilegível abaixo de uns 64 px.
const { width: lw } = await sharp(cor).metadata();
const lado = 362;
const alturaArcada = 285;   // a arcada acaba aqui; abaixo vem "SÍTIO", que
                            // em 16 ou 32 px é só ruído
await png(
  sharp(
    await sharp(cor)
      .extract({ left: Math.round(lw / 2 - lado / 2), top: 0, width: lado, height: alturaArcada })
      .png().toBuffer(),
  ).extend({
    top: Math.round((lado - alturaArcada) / 2),
    bottom: lado - alturaArcada - Math.round((lado - alturaArcada) / 2),
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  }),
  'img/marca/icone.png',
);

await png(
  sharp('img/marca/icone.png')
    .resize(180, 180)
    .flatten({ background: '#eef0e8' }),
  'img/marca/icone-toque.png',
);

for (const f of ['brasao-cor', 'brasao-preto', 'brasao-claro', 'icone', 'icone-toque']) {
  const m = await sharp(`img/marca/${f}.png`).metadata();
  console.log(`img/marca/${f}.png`.padEnd(30), m.width + 'x' + m.height);
}
