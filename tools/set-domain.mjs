/**
 * Troca o endereço do site em todos os lugares de uma vez.
 *
 *   node tools/set-domain.mjs https://sitiorosengarten.com.br
 *
 * O domínio aparece no canonical, nas tags Open Graph, no JSON-LD, no
 * robots.txt e no sitemap.xml. Esquecer um deles é o jeito mais fácil de o
 * site não ser indexado, então o script lê o valor atual do canonical e
 * substitui em todos os arquivos.
 */
import { readFile, writeFile } from 'node:fs/promises';

const ARQUIVOS = ['index.html', 'robots.txt', 'sitemap.xml'];

const novo = process.argv[2]?.replace(/\/+$/, '');
if (!novo || !/^https?:\/\/[a-z0-9][a-z0-9.-]*[a-z0-9](\/[a-z0-9./-]*)?$/i.test(novo)) {
  console.error('Uso: node tools/set-domain.mjs https://dominio.com.br');
  process.exit(1);
}

const html = await readFile('index.html', 'utf8');
const atual = html.match(/<link rel="canonical" href="(https?:\/\/[^"]+?)\/?"/)?.[1];
if (!atual) {
  console.error('Não encontrei o <link rel="canonical"> no index.html.');
  process.exit(1);
}
if (atual === novo) {
  console.log(`O site já está configurado para ${novo}.`);
  process.exit(0);
}

let total = 0;
for (const arquivo of ARQUIVOS) {
  const antes = await readFile(arquivo, 'utf8');
  const depois = antes.replaceAll(atual, novo);
  const trocas = antes.split(atual).length - 1;
  if (trocas) await writeFile(arquivo, depois);
  console.log(`${arquivo.padEnd(14)} ${trocas} ocorrência(s)`);
  total += trocas;
}

console.log(`\n${atual} -> ${novo} (${total} no total)`);
console.log('No GitHub Pages, crie também um arquivo CNAME na raiz com apenas o');
console.log('domínio, sem https:// — e só depois de o DNS já estar apontando.');
