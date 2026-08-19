"use strict";

/* =========================================================
   PEDRA, PAPEL E TESOURA
   ANIMAÇÕES DA PARTIDA
========================================================= */

import { TEMPOS, esperar, proximoFrame } from "./game.js";

import { campoVisual, duelo, elementoCpu, slotJogador } from "./ui.js";

/* ==========================
   MOVIMENTO PARA O DUELO
========================== */

export async function moverJogadorParaDuelo(botaoSelecionado) {
  const origem = botaoSelecionado.getBoundingClientRect();

  duelo.hidden = false;

  const clone = botaoSelecionado.cloneNode(true);

  clone.classList.add("elemento-clone-movimento");

  clone.style.left = `${origem.left}px`;

  clone.style.top = `${origem.top}px`;

  clone.style.width = `${origem.width}px`;

  clone.style.height = `${origem.height}px`;

  document.body.append(clone);

  slotJogador.append(botaoSelecionado);

  botaoSelecionado.classList.add("elemento--selecionado");

  botaoSelecionado.style.visibility = "hidden";

  botaoSelecionado.style.transform = "none";

  await proximoFrame();

  const destino = botaoSelecionado.getBoundingClientRect();

  const deslocamentoX = destino.left - origem.left;

  const deslocamentoY = destino.top - origem.top;

  const animacao = clone.animate(
    [
      {
        transform: "translate(0, 0)",
      },
      {
        transform: `translate(${deslocamentoX}px, ${deslocamentoY}px)`,
      },
    ],
    {
      duration: TEMPOS.MOVIMENTO_JOGADOR,

      easing: "cubic-bezier(0.22, 1, 0.36, 1)",

      fill: "forwards",
    },
  );

  await animacao.finished;

  clone.remove();

  botaoSelecionado.style.visibility = "visible";

  botaoSelecionado.style.transform = "none";
}

/* ==========================
   PULO NORMAL
========================== */

export async function animarPuloDuelo() {
  duelo.classList.add("duelo--pulo");

  await esperar(TEMPOS.PULO_NORMAL);

  duelo.classList.remove("duelo--pulo");
}

/* ==========================
   PULO DE EMPATE
========================== */

export async function animarPuloEmpate() {
  duelo.classList.add("duelo--empate");

  await esperar(TEMPOS.PULO_EMPATE);

  duelo.classList.remove("duelo--empate");
}

/* ==========================
   CENTRALIZAR VENCEDOR
========================== */

export async function moverVencedorParaCentro(slotVencedor, slotPerdedor) {
  const vencedorRect = slotVencedor.getBoundingClientRect();

  const campoRect = campoVisual.getBoundingClientRect();

  const centroVencedorX = vencedorRect.left + vencedorRect.width / 2;

  const centroCampoX = campoRect.left + campoRect.width / 2;

  const deslocamentoX = centroCampoX - centroVencedorX;

  slotVencedor.classList.add("slot-duelo--vencedor");

  slotPerdedor.classList.add("slot-duelo--perdedor");

  const animacaoPerdedor = slotPerdedor.animate(
    [
      {
        opacity: 1,
        transform: "translateY(0)",
      },
      {
        opacity: 0,
        transform: "translateY(14px)",
      },
    ],
    {
      duration: TEMPOS.SAIDA_PERDEDOR,

      easing: "ease",

      fill: "forwards",
    },
  );

  const animacaoVencedor = slotVencedor.animate(
    [
      {
        transform: "translateX(0) scale(1)",
      },
      {
        transform: `translateX(${deslocamentoX}px) scale(1.2)`,
      },
    ],
    {
      duration: TEMPOS.MOVIMENTO_VENCEDOR,

      easing: "cubic-bezier(0.22, 1, 0.36, 1)",

      fill: "forwards",
    },
  );

  await Promise.all([animacaoPerdedor.finished, animacaoVencedor.finished]);
}

/* ==========================
   CELEBRAÇÃO DO VENCEDOR
========================== */

export async function celebrarVencedor(elemento) {
  const classe =
    elemento === elementoCpu
      ? "elemento-cpu--celebrando"
      : "elemento--celebrando";

  elemento.classList.add(classe);

  await esperar(TEMPOS.CELEBRACAO_VENCEDOR);

  elemento.classList.remove(classe);
}