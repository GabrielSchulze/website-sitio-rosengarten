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
tools/build-images.mjs  gera assets/img/ a partir de img/
tools/serve.mjs         servidor estático para desenvolvimento
```

## Desenvolvimento

```bash
npm install     # só para as ferramentas; o site em si não tem dependências
npm run serve   # http://localhost:4173
```

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

## O que ainda precisa da sua mão

- **A história da casa.** A seção "A casa de 1929" está escrita a partir do que
  se vê nas fotos e no brasão: a técnica do enxaimel, a data de 1929, o nome em
  alemão. Falta a história de verdade — quem construiu, quem morou, como o sítio
  chegou até aqui. Há um `<!-- TODO -->` no ponto exato do `index.html`.
- **Endereço final.** O `<link rel="canonical">`, as tags Open Graph e o
  `application/ld+json` no `<head>` apontam para `https://sitiorosengarten.com.br/`.
  Se o site for para outro domínio, é só trocar nesses três lugares.
- **Avaliações.** Os 12 depoimentos foram transcritos das avaliações do Airbnb
  (2021–2023). Para atualizar, edite a lista na seção `#avaliacoes`.

## Acessibilidade e desempenho

- Tema claro e escuro, seguindo a preferência do sistema.
- Navegação por teclado em todo o site; o lightbox usa `<dialog>` nativo, com
  setas, `Esc` e foco devolvido à miniatura de origem.
- Animações desligadas para quem tem `prefers-reduced-motion` ativo.
- Nenhuma requisição a terceiros além do Google Fonts.
