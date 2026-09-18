/**
 * Monta em dist/ exatamente os arquivos que vão para o servidor.
 * Uso: npm run build:dist
 *
 * Copia só o que a página realmente referencia — o index.html, o CSS, o JS,
 * as fontes e as imagens usadas — mais robots.txt e sitemap.xml. Os originais
 * de img/ e as ferramentas de tools/ ficam de fora: são a fonte para gerar o
 * site, não fazem parte dele.
 */
import { readFile, writeFile, mkdir, rm, cp, stat } from 'node:fs/promises';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const OUT = 'dist';
const RAIZ = ['index.html', 'robots.txt', 'sitemap.xml'];

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const html = await readFile('index.html', 'utf8');
const css = await readFile('assets/css/styles.css', 'utf8');

const usados = new Set(['assets/css/styles.css']);

// src, href, data-full e cada candidato de srcset.
for (const m of html.matchAll(/(?:src|href|data-full)="(assets\/[^"]+)"/g)) usados.add(m[1]);
for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
  for (const parte of m[1].split(',')) {
    const url = parte.trim().split(/\s+/)[0];
    if (url.startsWith('assets/')) usados.add(url);
  }
}
// As fontes são referenciadas de dentro do CSS, com caminho relativo a ele.
for (const m of css.matchAll(/url\("\.\.\/([^"]+)"\)/g)) usados.add(`assets/${m[1]}`);

// A SIL OFL exige que a licença acompanhe a fonte redistribuída.
for (const f of await readdir('assets/fonts')) {
  if (f.startsWith('OFL')) usados.add(`assets/fonts/${f}`);
}

let bytes = 0;
for (const rel of [...usados].sort()) {
  const destino = path.join(OUT, rel);
  await mkdir(path.dirname(destino), { recursive: true });
  await cp(rel, destino);
  bytes += (await stat(rel)).size;
}

for (const rel of RAIZ) {
  await cp(rel, path.join(OUT, rel));
  bytes += (await stat(rel)).size;
}

const mb = (n) => (n / 1024 / 1024).toFixed(1) + ' MB';
console.log(`${usados.size + RAIZ.length} arquivos, ${mb(bytes)} em ${OUT}/`);

// Confere que nada referenciado ficou para trás.
const faltando = [];
for (const rel of usados) {
  try { await stat(path.join(OUT, rel)); } catch { faltando.push(rel); }
}
console.log(faltando.length ? `FALTANDO: ${faltando.join(', ')}` : 'nada faltando');
