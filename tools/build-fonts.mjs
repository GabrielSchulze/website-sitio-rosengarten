/**
 * Baixa as fontes do Google Fonts para assets/fonts/ e escreve as regras
 * @font-face dentro do assets/css/styles.css, entre marcadores.
 *
 *   npm run build:fonts
 *
 * Servir a fonte do próprio domínio tira uma folha de estilo externa do
 * caminho crítico e dois handshakes (fonts.googleapis.com e fonts.gstatic.com).
 * O site passa a não fazer nenhuma requisição a terceiros.
 *
 * Fraunces e Archivo são licenciadas sob a SIL Open Font License 1.1, que
 * permite redistribuir desde que a licença acompanhe — daí os OFL.txt.
 */
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const CSS_URL = 'https://fonts.googleapis.com/css2?family=Archivo:wght@400..700'
  + '&family=Fraunces:ital,opsz,wght@0,9..144,500..700;1,9..144,400..500&display=swap';

// Um navegador moderno recebe woff2 com subsets; um antigo receberia ttf.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  + ' (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// Português cabe em "latin"; "latin-ext" entra como rede de segurança.
// "vietnamese" não tem uso aqui.
const SUBSETS = ['latin', 'latin-ext'];

const LICENCAS = {
  fraunces: 'https://raw.githubusercontent.com/google/fonts/main/ofl/fraunces/OFL.txt',
  archivo: 'https://raw.githubusercontent.com/google/fonts/main/ofl/archivo/OFL.txt',
};

const DIR = 'assets/fonts';
const MARCA_INICIO = '/* === FONTES: bloco gerado por tools/build-fonts.mjs — não editar === */';
const MARCA_FIM = '/* === fim do bloco de fontes === */';

async function baixar(url, extra = {}) {
  const r = await fetch(url, { headers: { 'user-agent': UA, ...extra } });
  if (!r.ok) throw new Error(`${r.status} em ${url}`);
  return r;
}

await mkdir(DIR, { recursive: true });

const css = await (await baixar(CSS_URL)).text();

// Cada face vem como um comentário com o subset seguido de um @font-face.
const blocos = [...css.matchAll(/\/\*\s*([a-z-]+)\s*\*\/\s*(@font-face\s*\{[^}]*\})/g)];
const faces = [];

for (const [, subset, bloco] of blocos) {
  if (!SUBSETS.includes(subset)) continue;
  const campo = (nome) => bloco.match(new RegExp(`${nome}:\\s*([^;]+);`))?.[1].trim();
  const familia = campo('font-family').replace(/['"]/g, '');
  const estilo = campo('font-style');
  const url = bloco.match(/url\(([^)]+)\)/)[1];
  const arquivo = `${familia.toLowerCase()}${estilo === 'italic' ? '-italic' : ''}-${subset}.woff2`;

  const bytes = Buffer.from(await (await baixar(url)).arrayBuffer());
  await writeFile(path.join(DIR, arquivo), bytes);

  faces.push({
    familia, estilo, arquivo, subset, bytes: bytes.length,
    peso: campo('font-weight'),
    largura: campo('font-stretch'),
    faixa: campo('unicode-range'),
  });
  console.log(`${arquivo.padEnd(34)} ${(bytes.length / 1024).toFixed(1)} KB`);
}

for (const [nome, url] of Object.entries(LICENCAS)) {
  await writeFile(path.join(DIR, `OFL-${nome}.txt`), await (await baixar(url)).text());
}

const regras = faces.map((f) => `@font-face {
  font-family: "${f.familia}";
  font-style: ${f.estilo};
  font-weight: ${f.peso};${f.largura ? `\n  font-stretch: ${f.largura};` : ''}
  font-display: swap;
  src: url("../fonts/${f.arquivo}") format("woff2");
  unicode-range: ${f.faixa};
}`).join('\n\n');

const cabecalho = `${MARCA_INICIO}
/* Fraunces (Undercase Type) e Archivo (Omnibus-Type), ambas sob a SIL Open
   Font License 1.1 — o texto da licença está em assets/fonts/OFL-*.txt.
   Regenerar com: npm run build:fonts */

${regras}

${MARCA_FIM}`;

const folha = await readFile('assets/css/styles.css', 'utf8');
const i = folha.indexOf(MARCA_INICIO);
const j = folha.indexOf(MARCA_FIM);
const novo = i >= 0 && j > i
  ? folha.slice(0, i) + cabecalho + folha.slice(j + MARCA_FIM.length)
  : cabecalho + '\n\n' + folha;
await writeFile('assets/css/styles.css', novo);

const total = faces.reduce((s, f) => s + f.bytes, 0);
console.log(`\n${faces.length} faces, ${(total / 1024).toFixed(0)} KB, escritas no styles.css`);
