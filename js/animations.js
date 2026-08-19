"use strict";

/* =========================================================
   PEDRA, PAPEL E TESOURA
   ANIMAÇÕES DA PARTIDA
========================================================= */

import { ASSETS, TEMPOS, esperar, proximoFrame } from "./game.js";

import {
  campoVisual,
  duelo,
  elementoAnimado,
  imagemAnimada,
  slotJogador,
} from "./ui.js";

/* ==========================
   CACHE DAS IMAGENS
========================== */

/*
  Mantemos as três imagens carregadas e
  decodificadas durante toda a sessão.

  Isso evita criar uma nova superfície gráfica
  no momento exato em que a animação começa.
*/

const cacheImagens = new Map();

/* ==========================
   MOVIMENTO REDUZIDO
========================== */

function prefereMovimentoReduzido() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function obterDuracao(duracaoNormal) {
  return prefereMovimentoReduzido() ? 1 : duracaoNormal;
}

/* ==========================
   PRÉ-CARREGAMENTO
========================== */

export async function preloadAssetsAnimacao() {
  const carregamentos = Object.entries(ASSETS).map(async ([jogada, src]) => {
    const imagem = new Image();

    imagem.src = src;

    cacheImagens.set(jogada, imagem);

    if (typeof imagem.decode === "function") {
      try {
        await imagem.decode();
      } catch {
        /*
              Se decode() falhar, o navegador
              ainda poderá usar o carregamento
              tradicional da imagem.
            */
      }

      return;
    }

    await new Promise((resolve) => {
      if (imagem.complete) {
        resolve();

        return;
      }

      imagem.addEventListener("load", resolve, {
        once: true,
      });

      imagem.addEventListener("error", resolve, {
        once: true,
      });
    });
  });

  await Promise.all(carregamentos);
}

/* ==========================
   PREPARAR CAMADA
========================== */

async function prepararCamada(elementoOrigem) {
  const imagemOrigem = elementoOrigem.querySelector(".imagem-elemento");

  const src = imagemOrigem.getAttribute("src");

  imagemAnimada.src = src;
  imagemAnimada.alt = "";

  /*
    Mesmo com o preload, esperamos decode()
    da própria imagem permanente caso o
    navegador considere necessário.
  */

  if (typeof imagemAnimada.decode === "function") {
    try {
      await imagemAnimada.decode();
    } catch {
      /* Sem ação necessária. */
    }
  }

  const origem = elementoOrigem.getBoundingClientRect();

  elementoAnimado.getAnimations().forEach((animacao) => {
    animacao.cancel();
  });

  elementoAnimado.classList.remove(
    "elemento-animado--visivel",
    "elemento-animado--celebrando",
  );

  elementoAnimado.style.left = `${origem.left}px`;

  elementoAnimado.style.top = `${origem.top}px`;

  elementoAnimado.style.width = `${origem.width}px`;

  elementoAnimado.style.height = `${origem.height}px`;

  elementoAnimado.style.transform = "translate3d(0, 0, 0)";

  return origem;
}

/* ==========================
   MOSTRAR CAMADA
========================== */

function mostrarCamada() {
  elementoAnimado.classList.add("elemento-animado--visivel");
}

/* ==========================
   ESCONDER CAMADA
========================== */

function esconderCamada() {
  elementoAnimado.classList.remove(
    "elemento-animado--visivel",
    "elemento-animado--celebrando",
  );
}

/* ==========================
   MOVIMENTO PARA O DUELO
========================== */

export async function moverJogadorParaDuelo(botaoSelecionado) {
  /*
    A imagem da camada é preparada enquanto
    o card real continua normalmente visível.
  */

  const origem = await prepararCamada(botaoSelecionado);

  duelo.hidden = false;

  /*
    O real é escondido e a camada é mostrada
    no mesmo ciclo de JavaScript.

    Não existe clone, append ou criação de uma
    nova imagem neste momento.
  */

  botaoSelecionado.style.visibility = "hidden";

  botaoSelecionado.style.pointerEvents = "none";

  slotJogador.append(botaoSelecionado);

  botaoSelecionado.classList.add("elemento--selecionado");

  mostrarCamada();

  await proximoFrame();

  const destino = botaoSelecionado.getBoundingClientRect();

  const deslocamentoX = destino.left - origem.left;

  const deslocamentoY = destino.top - origem.top;

  const animacao = elementoAnimado.animate(
    [
      {
        transform: "translate3d(0, 0, 0)",
      },
      {
        transform: `translate3d(${deslocamentoX}px, ${deslocamentoY}px, 0)`,
      },
    ],
    {
      duration: obterDuracao(TEMPOS.MOVIMENTO_JOGADOR),

      easing: "cubic-bezier(0.22, 1, 0.36, 1)",

      fill: "forwards",
    },
  );

  await animacao.finished;

  /*
    Camada some e o card real reaparece
    já em sua posição definitiva.
  */

  esconderCamada();

  animacao.cancel();

  elementoAnimado.style.transform = "translate3d(0, 0, 0)";

  botaoSelecionado.style.visibility = "visible";

  botaoSelecionado.style.pointerEvents = "";
}

/* ==========================
   PULO NORMAL
========================== */

export async function animarPuloDuelo() {
  duelo.classList.add("duelo--pulo");

  await esperar(obterDuracao(TEMPOS.PULO_NORMAL));

  duelo.classList.remove("duelo--pulo");
}

/* ==========================
   PULO DE EMPATE
========================== */

export async function animarPuloEmpate() {
  duelo.classList.add("duelo--empate");

  await esperar(obterDuracao(TEMPOS.PULO_EMPATE));

  duelo.classList.remove("duelo--empate");
}

/* ==========================
   CENTRALIZAR VENCEDOR
========================== */

export async function moverVencedorParaCentro(slotVencedor, slotPerdedor) {
  const elementoVencedor = slotVencedor.querySelector(
    ".elemento, .elemento-cpu",
  );

  /*
    A mesma camada permanente é reutilizada.
  */

  const origem = await prepararCamada(elementoVencedor);

  const campo = campoVisual.getBoundingClientRect();

  /*
    Troca visual atômica:

    real some;
    camada aparece exatamente sobre ele.
  */

  slotVencedor.classList.add("slot-duelo--oculto", "slot-duelo--vencedor");

  slotPerdedor.classList.add("slot-duelo--oculto", "slot-duelo--perdedor");

  mostrarCamada();

  /* ==========================
     CENTRO
  ========================== */

  const destinoLeft = campo.left + campo.width / 2 - origem.width / 2;

  const deslocamentoX = destinoLeft - origem.left;

  const animacaoMovimento = elementoAnimado.animate(
    [
      {
        transform: "translate3d(0, 0, 0)",
      },
      {
        transform: `translate3d(${deslocamentoX}px, 0, 0)`,
      },
    ],
    {
      duration: obterDuracao(TEMPOS.MOVIMENTO_VENCEDOR),

      easing: "cubic-bezier(0.22, 1, 0.36, 1)",

      fill: "forwards",
    },
  );

  await animacaoMovimento.finished;

  /*
    A posição final passa a ser a posição
    física do elemento permanente.
  */

  animacaoMovimento.cancel();

  elementoAnimado.style.left = `${destinoLeft}px`;

  elementoAnimado.style.transform = "translate3d(0, 0, 0)";

  /* ==========================
     CRESCIMENTO
  ========================== */

  const animacaoCrescimento = elementoAnimado.animate(
    [
      {
        transform: "scale(1)",
      },
      {
        transform: "scale(1.2)",
      },
    ],
    {
      duration: obterDuracao(400),

      easing: "cubic-bezier(0.22, 1, 0.36, 1)",

      fill: "forwards",
    },
  );

  await animacaoCrescimento.finished;

  animacaoCrescimento.cancel();

  elementoAnimado.style.transform = "scale(1.2)";
}

/* ==========================
   CELEBRAÇÃO DO VENCEDOR
========================== */

export async function celebrarVencedor() {
  elementoAnimado.classList.add("elemento-animado--celebrando");

  await esperar(obterDuracao(TEMPOS.CELEBRACAO_VENCEDOR));

  elementoAnimado.classList.remove("elemento-animado--celebrando");
}