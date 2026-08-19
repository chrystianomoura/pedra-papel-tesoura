"use strict";

/* =========================================================
   PEDRA, PAPEL E TESOURA
   REGRAS E ESTADO DA PARTIDA
========================================================= */

/* ==========================
   JOGADAS
========================== */

export const JOGADAS = ["pedra", "papel", "tesoura"];

/* ==========================
   ASSETS
========================== */

export const ASSETS = {
  pedra: "assets/pedra.png",
  papel: "assets/papel.png",
  tesoura: "assets/tesoura.png",
};

/* ==========================
   ESTADOS DA PARTIDA
========================== */

export const ESTADOS = {
  ESCOLHENDO: "escolhendo",
  CPU_ANALISANDO: "cpu-analisando",
  DUELO: "duelo",
  RESULTADO: "resultado",
};

/* ==========================
   MENSAGENS DE CONFRONTO
========================== */

const MENSAGENS_CONFRONTO = {
  "pedra-tesoura": "Pedra esmaga Tesoura",
  "tesoura-papel": "Tesoura corta Papel",
  "papel-pedra": "Papel envolve Pedra",
};

/* ==========================
   TEMPOS
========================== */

export const TEMPOS = {
  SAIDA_OPCOES: 850,
  MOVIMENTO_JOGADOR: 1250,

  ANALISE_CPU: 900,
  ENTRADA_CPU: 700,

  PULO_NORMAL: 700,
  PULO_EMPATE: 1100,

  PAUSA_APOS_PULO: 750,

  SAIDA_PERDEDOR: 650,
  MOVIMENTO_VENCEDOR: 950,

  ENTRADA_CONFRONTO: 220,

  CELEBRACAO_VENCEDOR: 1500,

  LEITURA_RESULTADO: 500,

  TROCA_MENSAGEM: 220,
  ENTRADA_MENSAGEM: 220,
};

/* ==========================
   ESTADO ATUAL
========================== */

export const estadoJogo = {
  estadoAtual: ESTADOS.ESCOLHENDO,

  rodada: 1,

  pontosJogador: 0,
  pontosCpu: 0,

  jogadaJogador: null,
  jogadaCpu: null,
};

/* ==========================
   CONTROLE DO ESTADO
========================== */

export function definirEstado(novoEstado) {
  estadoJogo.estadoAtual = novoEstado;
}

export function definirJogadaJogador(jogada) {
  estadoJogo.jogadaJogador = jogada;
}

export function definirJogadaCpu(jogada) {
  estadoJogo.jogadaCpu = jogada;
}

/* ==========================
   NOVA RODADA
========================== */

export function prepararNovaRodada() {
  estadoJogo.rodada += 1;

  estadoJogo.jogadaJogador = null;
  estadoJogo.jogadaCpu = null;

  estadoJogo.estadoAtual = ESTADOS.ESCOLHENDO;
}

/* ==========================
   PLACAR
========================== */

export function registrarPonto(resultado) {
  if (resultado === "jogador") {
    estadoJogo.pontosJogador += 1;
  }

  if (resultado === "cpu") {
    estadoJogo.pontosCpu += 1;
  }
}

/* ==========================
   CPU
========================== */

export function sortearJogadaCpu() {
  const indice = Math.floor(Math.random() * JOGADAS.length);

  return JOGADAS[indice];
}

/* ==========================
   RESULTADO
========================== */

export function calcularResultado(jogador, cpu) {
  if (jogador === cpu) {
    return "empate";
  }

  const jogadorVenceu =
    (jogador === "pedra" && cpu === "tesoura") ||
    (jogador === "papel" && cpu === "pedra") ||
    (jogador === "tesoura" && cpu === "papel");

  return jogadorVenceu ? "jogador" : "cpu";
}

/* ==========================
   TEXTO DO CONFRONTO
========================== */

export function descobrirMensagemConfronto(resultado) {
  if (resultado === "empate") {
    return "Ninguém cede";
  }

  const vencedor =
    resultado === "jogador" ? estadoJogo.jogadaJogador : estadoJogo.jogadaCpu;

  const perdedor =
    resultado === "jogador" ? estadoJogo.jogadaCpu : estadoJogo.jogadaJogador;

  return MENSAGENS_CONFRONTO[`${vencedor}-${perdedor}`];
}

/* ==========================
   FORMATAÇÃO
========================== */

export function formatarRodada(numero) {
  return String(numero).padStart(2, "0");
}

/* ==========================
   CONTROLE DE TEMPO
========================== */

export function esperar(tempo) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, tempo);
  });
}

export function proximoFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });
}