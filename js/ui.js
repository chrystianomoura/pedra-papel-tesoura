"use strict";

/* =========================================================
   PEDRA, PAPEL E TESOURA
   INTERFACE DA PARTIDA
========================================================= */

import {
  JOGADAS,
  TEMPOS,
  estadoJogo,
  esperar,
  formatarRodada,
  proximoFrame,
} from "./game.js";

/* ==========================
   ELEMENTOS DO DOM
========================== */

export const elementos = document.querySelector("#elementos");

export const botoesJogada = [...document.querySelectorAll("[data-jogada]")];

export const campoVisual = document.querySelector("#campo-visual");

export const mensagemJogo = document.querySelector("#mensagem-jogo");

export const rodadaElemento = document.querySelector("#rodada");

export const duelo = document.querySelector("#duelo");

export const slotJogador = document.querySelector("#slot-jogador");

export const slotCpu = document.querySelector("#slot-cpu");

export const elementoCpu = document.querySelector("#elemento-cpu");

export const imagemCpu = document.querySelector("#imagem-cpu");

export const resultadoConfronto = document.querySelector(
  "#resultado-confronto",
);

export const placarPontos = document.querySelector("#placar-pontos");

export const botaoJogarNovamente = document.querySelector("#jogar-novamente");

/* ==========================
   CAMADA DE ANIMAÇÃO
========================== */

export const elementoAnimado = document.querySelector("#elemento-animado");

export const imagemAnimada = document.querySelector("#imagem-animada");

/* ==========================
   ESTADOS DA MENSAGEM
========================== */

export function limparEstadosMensagem() {
  mensagemJogo.classList.remove(
    "mensagem-jogo--analisando",
    "mensagem-jogo--duelo",
  );
}

function aplicarEstadoMensagem(estado) {
  limparEstadosMensagem();

  if (estado === "analisando") {
    mensagemJogo.classList.add("mensagem-jogo--analisando");
  }

  if (estado === "duelo") {
    mensagemJogo.classList.add("mensagem-jogo--duelo");
  }
}

/* ==========================
   MENSAGEM SUPERIOR
========================== */

export async function atualizarMensagem(
  texto,
  { destaque = false, estado = null } = {},
) {
  mensagemJogo.classList.add("mensagem-jogo--saindo");

  await esperar(TEMPOS.TROCA_MENSAGEM);

  mensagemJogo.textContent = texto;

  aplicarEstadoMensagem(estado);

  mensagemJogo.classList.toggle("mensagem-jogo--destaque", destaque);

  mensagemJogo.classList.remove(
    "mensagem-jogo--saindo",
    "mensagem-jogo--entrando",
  );

  void mensagemJogo.offsetWidth;

  mensagemJogo.classList.add("mensagem-jogo--entrando");

  await esperar(TEMPOS.ENTRADA_MENSAGEM);

  mensagemJogo.classList.remove("mensagem-jogo--entrando");
}

/* ==========================
   MENSAGEM DO CONFRONTO
========================== */

export async function mostrarMensagemConfronto(texto) {
  resultadoConfronto.textContent = texto;

  resultadoConfronto.setAttribute("aria-hidden", "false");

  await proximoFrame();

  resultadoConfronto.classList.add("resultado-confronto--visivel");

  await esperar(TEMPOS.ENTRADA_CONFRONTO);
}

export function esconderMensagemConfronto() {
  resultadoConfronto.classList.remove("resultado-confronto--visivel");

  resultadoConfronto.setAttribute("aria-hidden", "true");

  resultadoConfronto.textContent = "";
}

/* ==========================
   RODADA
========================== */

export function atualizarRodada() {
  rodadaElemento.textContent = `Rodada ${formatarRodada(estadoJogo.rodada)}`;

  rodadaElemento.classList.remove("rodada--atualizada");

  void rodadaElemento.offsetWidth;

  rodadaElemento.classList.add("rodada--atualizada");
}

/* ==========================
   ESCOLHAS
========================== */

export function bloquearEscolhas() {
  botoesJogada.forEach((botao) => {
    botao.disabled = true;
  });
}

export function liberarEscolhas() {
  botoesJogada.forEach((botao) => {
    botao.disabled = false;
  });
}

/* ==========================
   PLACAR
========================== */

export function atualizarPlacar() {
  placarPontos.textContent = `${estadoJogo.pontosJogador} : ${estadoJogo.pontosCpu}`;

  placarPontos.animate(
    [
      {
        transform: "scale(1)",
      },
      {
        transform: "scale(1.2)",
      },
      {
        transform: "scale(1)",
      },
    ],
    {
      duration: 500,
      easing: "ease",
    },
  );
}

/* ==========================
   JOGAR NOVAMENTE
========================== */

export function mostrarBotaoNovaRodada() {
  botaoJogarNovamente.classList.add("jogar-novamente--visivel");

  botaoJogarNovamente.setAttribute("aria-hidden", "false");
}

export function esconderBotaoNovaRodada() {
  botaoJogarNovamente.classList.remove("jogar-novamente--visivel");

  botaoJogarNovamente.setAttribute("aria-hidden", "true");
}

/* ==========================
   RESTAURAR ELEMENTOS
========================== */

export function restaurarElementosIniciais() {
  JOGADAS.forEach((jogada) => {
    const botao = botoesJogada.find((item) => item.dataset.jogada === jogada);

    elementos.append(botao);
  });

  botoesJogada.forEach((botao) => {
    botao.classList.remove("elemento--selecionado", "elemento--saindo");

    botao.style.visibility = "";
    botao.style.pointerEvents = "";
    botao.style.transform = "";

    botao.getAnimations().forEach((animacao) => {
      animacao.cancel();
    });
  });

  elementos.hidden = false;
}

/* ==========================
   RESET DA CAMADA
========================== */

function reiniciarCamadaMovimento() {
  elementoAnimado.getAnimations().forEach((animacao) => {
    animacao.cancel();
  });

  elementoAnimado.classList.remove(
    "elemento-animado--visivel",
    "elemento-animado--celebrando",
  );

  elementoAnimado.style.left = "";
  elementoAnimado.style.top = "";
  elementoAnimado.style.width = "";
  elementoAnimado.style.height = "";
  elementoAnimado.style.transform = "";

  imagemAnimada.src = "";
}

/* ==========================
   RESET DO DUELO
========================== */

export function reiniciarDuelo() {
  esconderBotaoNovaRodada();
  esconderMensagemConfronto();

  limparEstadosMensagem();

  reiniciarCamadaMovimento();

  slotJogador.classList.remove(
    "slot-duelo--oculto",
    "slot-duelo--vencedor",
    "slot-duelo--perdedor",
  );

  slotCpu.classList.remove(
    "slot-duelo--oculto",
    "slot-duelo--vencedor",
    "slot-duelo--perdedor",
  );

  duelo.classList.remove("duelo--pulo", "duelo--empate");

  slotJogador.getAnimations().forEach((animacao) => {
    animacao.cancel();
  });

  slotCpu.getAnimations().forEach((animacao) => {
    animacao.cancel();
  });

  elementoCpu.getAnimations().forEach((animacao) => {
    animacao.cancel();
  });

  elementoCpu.classList.remove("elemento-cpu--visivel");

  elementoCpu.setAttribute("aria-hidden", "true");

  imagemCpu.src = "";
  imagemCpu.alt = "";

  duelo.hidden = true;

  restaurarElementosIniciais();
}