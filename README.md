# Sítio Rosengarten

Site do Sítio Rosengarten — chalé de hospedagem em Aurora, Santa Catarina.

Site estático, sem framework e sem etapa de build: é HTML, uma folha de estilo e
um arquivo de JavaScript. Dá para abrir o `index.html` direto no navegador ou
publicar a pasta inteira em qualquer hospedagem de arquivos estáticos
(GitHub Pages, Netlify, Cloudflare Pages).

## Estrutura

```
index.html              a página inteira
assets/css/styles.css   estilos (tokens de cor e tipografia no topo do arquivo)
assets/js/main.js       menu, lightbox, carrossel de depoimentos
assets/img/             imagens otimizadas que o site serve (geradas — veja abaixo)
img/                    fotos originais, fonte da verdade para gerar assets/img/
img/marca/              o brasão com fundo transparente (gerado — veja abaixo)
assets/fonts/           Fraunces e Archivo servidas deste domínio (geradas)
robots.txt              libera tudo e aponta o sitemap
sitemap.xml             a única página do site
tools/build-images.mjs  gera assets/img/ a partir de img/
tools/logo-alpha.mjs    gera img/marca/ a partir dos arquivos de logo
tools/set-domain.mjs    troca o endereço do site em todos os arquivos
tools/build-dist.mjs    monta dist/ com só o que vai para o servidor
tools/serve.mjs         servidor estático para desenvolvimento
```

## Desenvolvimento

```bash
npm install     # só para as ferramentas; o site em si não tem dependências
npm run serve   # http://localhost:4173
```

## Fontes

Fraunces e Archivo são servidas do próprio domínio em vez do Google Fonts.
Isso tira uma folha de estilo externa do caminho crítico e dois handshakes
(`fonts.googleapis.com` e `fonts.gstatic.com`) — o site passa a não fazer
nenhuma requisição a terceiros. O navegador baixa só o subset de que precisa;
em português, cerca de 180 KB.

```bash
npm run build:fonts
```

O script baixa os arquivos, escreve as regras `@font-face` dentro do
`assets/css/styles.css` entre marcadores e traz junto os `OFL-*.txt`. As duas
fontes são licenciadas sob a SIL Open Font License 1.1, que permite
redistribuir desde que a licença acompanhe — por isso os arquivos de licença
ficam em `assets/fonts/` e não devem ser removidos.

## A marca

Os arquivos originais do logo (`img/rosengarten_logo.png`, `img/fav-icon.png`)
têm fundo branco chapado, o que obrigaria a colocar o brasão dentro de uma caixa
branca sobre qualquer fundo colorido. O `tools/logo-alpha.mjs` remove o branco
**externo** por preenchimento a partir das bordas — preservando os brancos
internos, como o céu atrás da árvore e o texto "1929" — e gera:

| arquivo | onde é usado |
| --- | --- |
| `brasao-cor.png` | seção "A casa de 1929", tema claro |
| `brasao-claro.png` | a mesma seção no tema escuro, onde o letreiro preto sumiria |
| `brasao-preto.png` | cabeçalho e rodapé, invertido para branco quando o fundo é escuro |
| `icone.png` | favicon — só a arcada com a árvore, porque o letreiro inteiro fica ilegível abaixo de 64 px |
| `icone-toque.png` | ícone da tela inicial do iOS, achatado sobre a cor de fundo |

```bash
npm run build:marca   # regenera img/marca/
npm run build:img     # e depois assets/img/
```

Rode os dois na ordem ao trocar os arquivos de logo.

## Imagens

As fotos originais ficam em `img/` e nunca são alteradas. O script de build gera
`assets/img/` com cada foto em WebP nas larguras 480, 960 e 1600 px, mais um JPEG
de fallback, e o `index.html` usa `srcset` para o navegador baixar só o tamanho
que couber na tela.

```bash
npm run build:img
```

Ao trocar ou acrescentar uma foto: coloque o arquivo em `img/`, rode o comando
acima e aponte o `<picture>` correspondente no `index.html` para o novo nome.

## Pacote para a hospedagem

Para entregar o site a quem vai hospedá-lo, sem os originais de `img/` nem as
ferramentas:

```bash
npm run build:dist
```

Monta `dist/` com apenas o que a página referencia — HTML, CSS, JS, fontes e as
imagens realmente usadas — mais `robots.txt`, `sitemap.xml` e os arquivos de
licença das fontes. Cerca de 20 MB contra os 60 MB do repositório. O script
avisa se alguma referência ficar sem arquivo. `dist/` é ignorado pelo git.

## Publicar

O site está configurado para `https://sitiorosengarten.com.br`. **Enquanto esse
domínio não estiver registrado e apontando para a hospedagem, o Google não
indexa o site**: o `<link rel="canonical">` diz a ele que o endereço verdadeiro
é esse, e ele não existe ainda.

Para publicar no GitHub Pages com domínio próprio, nesta ordem:

1. Registre o domínio.
2. Aponte o DNS para o GitHub Pages — quatro registros `A` para `185.199.108.153`,
   `185.199.109.153`, `185.199.110.153` e `185.199.111.153`, e um `CNAME` de
   `www` para `gabrielschulze.github.io`.
3. Só então crie na raiz do repositório um arquivo `CNAME` contendo apenas
   `sitiorosengarten.com.br`, sem `https://`. Feito antes do DNS, o Pages passa
   a redirecionar para um domínio morto e o site fica fora do ar.
4. Ligue o Pages em Settings → Pages, apontando para esta branch.
5. Cadastre o site no [Google Search Console](https://search.google.com/search-console)
   e envie o `sitemap.xml`. Sem isso, a indexação pode levar semanas.

Se o domínio escolhido for outro, um comando troca o endereço em todos os
lugares (canonical, Open Graph, JSON-LD, `robots.txt` e `sitemap.xml`):

```bash
node tools/set-domain.mjs https://outro-dominio.com.br
```

## SEO

O que está no `index.html`:

- `<title>` de 50 caracteres e `<meta name="description">` de 147 — ambos abaixo
  do ponto em que o Google corta.
- O `<h1>` carrega o slogan **e** uma segunda linha dizendo o que é e onde fica
  ("Chalé para duas pessoas em Aurora, no Alto Vale do Itajaí"), que é mais
  perto do que as pessoas realmente digitam.
- Um só `<h1>`, um `<h2>` por seção e `<h3>` nos blocos internos.
- JSON-LD `LodgingBusiness` com endereço, telefone, redes, mapa, ano de
  fundação, as sete comodidades e a ocupação máxima de duas pessoas.
- Open Graph completo, com imagem de compartilhamento em 1200×630
  (`assets/img/compartilhar.jpg`, gerada pelo `build:img`).
- `max-image-preview:large`, que autoriza o Google a usar a foto grande nos
  resultados e no Discover — relevante num site que vive de fotografia.
- `<link rel="preload">` da foto do hero, que encurta o Largest Contentful
  Paint. Velocidade conta no ranking.
- `robots.txt` e `sitemap.xml`.

Duas ausências deliberadas:

- **Nenhuma marcação de avaliação ou nota.** As diretrizes do Google proíbem
  marcar com `Review`/`aggregateRating` avaliações que a própria empresa
  publica sobre si, e avaliações vindas de terceiros (o Airbnb) não são
  elegíveis. Marcar isso não renderia as estrelinhas na busca e exporia o site
  a uma penalidade manual. As avaliações continuam na página como texto, o que
  ajuda de verdade: é conteúdo original e específico.
- **Nenhuma `<meta name="keywords">`.** O Google ignora desde 2009.

## O que ainda precisa da sua mão

- **Registrar o domínio** e seguir os passos de *Publicar*, acima.
- **Uma seção de perguntas frequentes** puxaria buscas de cauda longa
  ("chalé que aceita pet em Rio do Sul", "chalé com wi-fi no Alto Vale").
  Não escrevi porque não sei as respostas: aceita animais? tem wi-fi? qual a
  diária? qual o horário de check-in? há mínimo de noites? Com essas respostas
  eu monto a seção.
- **Avaliações.** Os 12 depoimentos foram transcritos das avaliações do Airbnb
  (2021–2023). Para atualizar, edite a lista na seção `#avaliacoes`.

## Acessibilidade e desempenho

- Tema claro e escuro, seguindo a preferência do sistema.
- Navegação por teclado em todo o site; o lightbox usa `<dialog>` nativo, com
  setas, `Esc` e foco devolvido à miniatura de origem.
- Animações desligadas para quem tem `prefers-reduced-motion` ativo.
- Nenhuma requisição a terceiros além do Google Fonts.
