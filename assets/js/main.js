/* =========================================================================
   Sítio Rosengarten — comportamento do site. Sem dependências.
   ========================================================================= */

(() => {
  'use strict';

  const $ = (sel, raiz = document) => raiz.querySelector(sel);
  const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

  /* --- Cabeçalho: transparente sobre o hero, sólido ao rolar ------------ */

  const header = $('[data-header]');
  if (header) {
    const marcarHeader = () => header.classList.toggle('is-solido', window.scrollY > 24);
    marcarHeader();
    addEventListener('scroll', marcarHeader, { passive: true });
  }

  /* --- Menu no celular -------------------------------------------------- */

  const gatilho = $('[data-gatilho]');
  const menu = $('[data-menu]');

  if (gatilho && menu) {
    const abrirMenu = (abrir) => {
      gatilho.setAttribute('aria-expanded', String(abrir));
      menu.dataset.aberto = String(abrir);
      document.body.style.overflow = abrir ? 'hidden' : '';
      $('.visualmente-oculto', gatilho).textContent = abrir ? 'Fechar menu' : 'Abrir menu';
    };

    gatilho.addEventListener('click', () => {
      abrirMenu(gatilho.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', (evento) => {
      if (evento.target.closest('a')) abrirMenu(false);
    });

    addEventListener('keydown', (evento) => {
      if (evento.key === 'Escape' && gatilho.getAttribute('aria-expanded') === 'true') {
        abrirMenu(false);
        gatilho.focus();
      }
    });

    // Ao voltar para a largura de desktop o menu precisa sair do estado aberto.
    matchMedia('(min-width: 62rem)').addEventListener('change', (e) => {
      if (e.matches) abrirMenu(false);
    });
  }

  /* --- Link ativo conforme a seção visível ------------------------------ */

  const linksNav = $$('.nav__link');
  const secoes = linksNav
    .map((link) => $(link.getAttribute('href')))
    .filter(Boolean);

  if (secoes.length && 'IntersectionObserver' in window) {
    const vistas = new Set();
    const observadorSecao = new IntersectionObserver((entradas) => {
      for (const entrada of entradas) {
        if (entrada.isIntersecting) vistas.add(entrada.target.id);
        else vistas.delete(entrada.target.id);
      }
      const atual = secoes.find((secao) => vistas.has(secao.id));
      for (const link of linksNav) {
        const alvo = link.getAttribute('href').slice(1);
        if (atual && alvo === atual.id) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      }
    }, { rootMargin: '-45% 0px -50% 0px' });

    secoes.forEach((secao) => observadorSecao.observe(secao));
  }

  /* --- Lightbox --------------------------------------------------------- */

  const dialogo = $('[data-lightbox-dialog]');

  if (dialogo && typeof dialogo.showModal === 'function') {
    const imagem = $('[data-lightbox-img]', dialogo);
    const contagem = $('[data-lightbox-contagem]', dialogo);
    let grupo = [];
    let indice = 0;
    let origem = null;

    const precarregar = (i) => {
      const botao = grupo[i];
      if (botao) new Image().src = botao.dataset.full;
    };

    const mostrar = (i) => {
      indice = (i + grupo.length) % grupo.length;
      const botao = grupo[indice];
      imagem.src = botao.dataset.full;
      imagem.alt = botao.dataset.legenda || '';
      contagem.textContent = `${indice + 1} / ${grupo.length}`;
      precarregar(indice + 1);
      precarregar(indice - 1 + grupo.length);
    };

    $$('[data-lightbox]').forEach((botao) => {
      botao.addEventListener('click', () => {
        const caixa = botao.closest('.tira, .grade-fotos') || document;
        grupo = $$('[data-lightbox]', caixa);
        origem = botao;
        mostrar(grupo.indexOf(botao));
        dialogo.showModal();
      });
    });

    $('[data-lightbox-proximo]', dialogo).addEventListener('click', () => mostrar(indice + 1));
    $('[data-lightbox-anterior]', dialogo).addEventListener('click', () => mostrar(indice - 1));
    $('[data-lightbox-fechar]', dialogo).addEventListener('click', () => dialogo.close());

    dialogo.addEventListener('keydown', (evento) => {
      if (evento.key === 'ArrowRight') { evento.preventDefault(); mostrar(indice + 1); }
      if (evento.key === 'ArrowLeft') { evento.preventDefault(); mostrar(indice - 1); }
    });

    // Clicar fora da foto fecha.
    dialogo.addEventListener('click', (evento) => {
      if (!evento.target.closest('img, button')) dialogo.close();
    });

    // Devolve o foco para a miniatura de onde a foto foi aberta.
    dialogo.addEventListener('close', () => {
      imagem.removeAttribute('src');
      origem?.focus();
    });
  }

  /* --- Carrossel de depoimentos ----------------------------------------- */

  const carrossel = $('[data-carrossel]');
  if (carrossel) {
    const passo = () => {
      const cartao = carrossel.firstElementChild;
      if (!cartao) return carrossel.clientWidth;
      const espaco = parseFloat(getComputedStyle(carrossel).columnGap) || 16;
      return cartao.getBoundingClientRect().width + espaco;
    };
    const rolar = (direcao) => carrossel.scrollBy({ left: passo() * direcao, behavior: 'smooth' });

    $('[data-carrossel-proximo]')?.addEventListener('click', () => rolar(1));
    $('[data-carrossel-anterior]')?.addEventListener('click', () => rolar(-1));
  }

  /* --- Entrada suave das figuras ---------------------------------------- */

  const aRevelar = $$('.revelar');
  if (aRevelar.length) {
    const semMovimento = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (semMovimento || !('IntersectionObserver' in window)) {
      aRevelar.forEach((el) => el.classList.add('is-visivel'));
    } else {
      // O que já está na primeira tela aparece de imediato: a página nunca
      // fica esperando o scroll para mostrar o conteúdo.
      const alturaTela = innerHeight;
      const pendentes = [];
      for (const el of aRevelar) {
        if (el.getBoundingClientRect().top < alturaTela) el.classList.add('is-visivel');
        else pendentes.push(el);
      }

      const observador = new IntersectionObserver((entradas, obs) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.classList.add('is-visivel');
          obs.unobserve(entrada.target);
        }
      }, { rootMargin: '0px 0px -12% 0px' });

      pendentes.forEach((el) => observador.observe(el));
    }
  }

  /* --- Ano no rodapé ---------------------------------------------------- */

  const ano = $('[data-ano]');
  if (ano) ano.textContent = String(new Date().getFullYear());
})();
