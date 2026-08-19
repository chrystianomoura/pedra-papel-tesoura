"use strict";

/* =========================================================
   PEDRA, PAPEL E TESOURA
   ORQUESTRAÇÃO DA PARTIDA
========================================================= */

import {
  ASSETS,
  ESTADOS,
  TEMPOS,
  calcularResultado,
  definirEstado,
  definirJogadaCpu,
  definirJogadaJogador,
  descobrirMensagemConfronto,
  estadoJogo,
  esperar,
  prepararNovaRodada,
  proximoFrame,
  registrarPonto,
  sortearJogadaCpu,
} from "./game.js";

import {
  atualizarMensagem,
  atualizarPlacar,
  atualizarRodada,
  bloquearEscolhas,
  botaoJogarNovamente,
  botoesJogada,
  elementoCpu,
  elementos,
  imagemCpu,
  liberarEscolhas,
  mostrarBotaoNovaRodada,
  mostrarMensagemConfronto,
  reiniciarDuelo,
  slotCpu,
  slotJogador,
} from "./ui.js";

import {
  animarPuloDuelo,
  animarPuloEmpate,
  celebrarVencedor,
  moverJogadorParaDuelo,
  moverVencedorParaCentro,
} from "./animations.js";

/* ==========================
   PREPARAR DUELO
========================== */

async function prepararDuelo(botaoSelecionado) {
  definirEstado(ESTADOS.CPU_ANALISANDO);

  bloquearEscolhas();

  definirJogadaJogador(botaoSelecionado.dataset.jogada);

  atualizarMensagem("CPU analisando", {
    estado: "analisando",
  });

  botoesJogada.forEach((botao) => {
    if (botao !== botaoSelecionado) {
      botao.classList.add("elemento--saindo");
    }
  });

  await esperar(300);

  await moverJogadorParaDuelo(botaoSelecionado);

  await esperar(TEMPOS.SAIDA_OPCOES);

  elementos.hidden = true;

  await esperar(450);

  await revelarCpu();
}

/* ==========================
   REVELAR CPU
========================== */

async function revelarCpu() {
  await esperar(TEMPOS.ANALISE_CPU);

  const jogadaCpu = sortearJogadaCpu();

  definirJogadaCpu(jogadaCpu);

  imagemCpu.src = ASSETS[jogadaCpu];

  imagemCpu.alt = "";

  elementoCpu.setAttribute("aria-hidden", "false");

  await proximoFrame();

  elementoCpu.classList.add("elemento-cpu--visivel");

  definirEstado(ESTADOS.DUELO);

  const transicaoMensagem = atualizarMensagem("Duelo", {
    estado: "duelo",
  });

  await Promise.all([esperar(TEMPOS.ENTRADA_CPU), transicaoMensagem]);

  await executarDuelo();
}

/* ==========================
   EXECUTAR DUELO
========================== */

async function executarDuelo() {
  const resultado = calcularResultado(
    estadoJogo.jogadaJogador,
    estadoJogo.jogadaCpu,
  );

  if (resultado === "empate") {
    await animarPuloEmpate();

    await esperar(TEMPOS.PAUSA_APOS_PULO);

    await mostrarEmpate();

    return;
  }

  await animarPuloDuelo();

  await esperar(TEMPOS.PAUSA_APOS_PULO);

  await mostrarVencedor(resultado);
}

/* ==========================
   EMPATE
========================== */

async function mostrarEmpate() {
  definirEstado(ESTADOS.RESULTADO);

  await atualizarMensagem("Empate", {
    destaque: true,
  });

  const mensagem = descobrirMensagemConfronto("empate");

  await mostrarMensagemConfronto(mensagem);

  await esperar(TEMPOS.LEITURA_RESULTADO);

  mostrarBotaoNovaRodada();
}

/* ==========================
   VENCEDOR
========================== */

async function mostrarVencedor(resultado) {
  definirEstado(ESTADOS.RESULTADO);

  const jogadorVenceu = resultado === "jogador";

  const slotVencedor = jogadorVenceu ? slotJogador : slotCpu;

  const slotPerdedor = jogadorVenceu ? slotCpu : slotJogador;

  const elementoVencedor = jogadorVenceu
    ? slotJogador.querySelector(".elemento")
    : elementoCpu;

  const mensagemResultado = jogadorVenceu ? "Você venceu" : "CPU venceu";

  await atualizarMensagem(mensagemResultado, {
    destaque: true,
  });

  registrarPonto(resultado);

  atualizarPlacar();

  const mensagemConfronto = descobrirMensagemConfronto(resultado);

  await mostrarMensagemConfronto(mensagemConfronto);

  await moverVencedorParaCentro(slotVencedor, slotPerdedor);

  await celebrarVencedor(elementoVencedor);

  await esperar(TEMPOS.LEITURA_RESULTADO);

  mostrarBotaoNovaRodada();
}

/* ==========================
   NOVA RODADA
========================== */

async function iniciarNovaRodada() {
  prepararNovaRodada();

  reiniciarDuelo();

  atualizarRodada();

  await atualizarMensagem("Escolha sua jogada:");

  liberarEscolhas();
}

/* ==========================
   EVENTOS
========================== */

botoesJogada.forEach((botao) => {
  botao.addEventListener("click", () => {
    if (estadoJogo.estadoAtual !== ESTADOS.ESCOLHENDO) {
      return;
    }

    prepararDuelo(botao);
  });
});

botaoJogarNovamente.addEventListener("click", iniciarNovaRodada);