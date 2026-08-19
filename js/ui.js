"use strict";

/* =========================================================
   PEDRA, PAPEL E TESOURA
   INTERFACE DA PARTIDA
   ---------------------------------------------------------
   Responsabilidades deste módulo:

   • localizar e exportar elementos importantes do DOM;
   • atualizar textos e estados visuais da interface;
   • controlar acessibilidade dos elementos interativos;
   • atualizar rodada e placar;
   • restaurar a interface entre as rodadas;
   • limpar animações e estados temporários.

   Este arquivo não decide quem vence uma partida.
   As regras pertencem ao game.js.
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

/*
  As referências são obtidas uma única vez durante
  a inicialização do módulo.

  Como esses elementos permanecem no documento durante
  toda a aplicação, não existe necessidade de executar
  querySelector() novamente a cada atualização.
*/

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

/*
  Esta camada é permanente.

  animations.js apenas altera sua imagem,
  posição e visibilidade durante os movimentos.
*/

export const elementoAnimado = document.querySelector("#elemento-animado");

export const imagemAnimada = document.querySelector("#imagem-animada");

/* ==========================
   VALIDAÇÃO DO DOM
========================== */

/*
  Como o JavaScript depende diretamente desses elementos,
  é melhor falhar imediatamente durante o desenvolvimento
  caso algum ID seja removido ou renomeado no HTML.

  Sem essa verificação, o erro poderia aparecer muito
  depois como um "Cannot read properties of null".
*/

const elementosObrigatorios = [
  elementos,
  campoVisual,
  mensagemJogo,
  rodadaElemento,
  duelo,
  slotJogador,
  slotCpu,
  elementoCpu,
  imagemCpu,
  resultadoConfronto,
  placarPontos,
  botaoJogarNovamente,
  elementoAnimado,
  imagemAnimada,
];

if (elementosObrigatorios.some((elemento) => !elemento)) {
  throw new Error(
    "A interface não pôde ser inicializada: existem elementos obrigatórios ausentes no HTML.",
  );
}

/*
  O número de botões deve continuar acompanhando
  exatamente as jogadas registradas em game.js.
*/

if (botoesJogada.length !== JOGADAS.length) {
  throw new Error(
    "A quantidade de botões de jogada não corresponde às jogadas definidas em game.js.",
  );
}

/* ==========================
   MOVIMENTO REDUZIDO
========================== */

/*
  Animações criadas pela Web Animations API não são
  automaticamente afetadas pelo media query do CSS.

  Por isso verificamos a preferência também no JavaScript.
*/

function prefereMovimentoReduzido() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ==========================
   UTILITÁRIOS DE ANIMAÇÃO
========================== */

/*
  Cancela animações iniciadas pela Web Animations API
  em determinado elemento.

  Centralizar essa operação evita repetir o mesmo
  getAnimations().forEach() em vários pontos.
*/

function cancelarAnimacoes(elemento) {
  elemento.getAnimations().forEach((animacao) => {
    animacao.cancel();
  });
}

/* ==========================
   ESTADO INICIAL DO BOTÃO
========================== */

/*
  O botão começa visualmente indisponível.

  disabled garante que ele também fique fora da
  navegação por teclado enquanto estiver oculto.
*/

botaoJogarNovamente.disabled = true;

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

    return;
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

  /*
    textContent é utilizado deliberadamente.

    Diferentemente de innerHTML, ele trata todo conteúdo
    recebido apenas como texto e não interpreta marcação HTML.

    Isso também elimina uma possível superfície de XSS caso
    algum texto futuramente deixe de ser totalmente estático.
  */

  mensagemJogo.textContent = texto;

  aplicarEstadoMensagem(estado);

  mensagemJogo.classList.toggle("mensagem-jogo--destaque", destaque);

  mensagemJogo.classList.remove(
    "mensagem-jogo--saindo",
    "mensagem-jogo--entrando",
  );

  /*
    A leitura de offsetWidth força o navegador a consolidar
    o estado anterior antes de adicionarmos novamente a
    classe de entrada.

    Isso permite reiniciar a animação CSS de maneira
    previsível mesmo usando a mesma classe repetidamente.
  */

  void mensagemJogo.offsetWidth;

  mensagemJogo.classList.add("mensagem-jogo--entrando");

  await esperar(TEMPOS.ENTRADA_MENSAGEM);

  mensagemJogo.classList.remove("mensagem-jogo--entrando");
}

/* ==========================
   MENSAGEM DO CONFRONTO
========================== */

export async function mostrarMensagemConfronto(texto) {
  /*
    Novamente utilizamos textContent para que a mensagem
    nunca seja interpretada como HTML.
  */

  resultadoConfronto.textContent = texto;

  resultadoConfronto.setAttribute("aria-hidden", "false");

  /*
    Esperamos o navegador registrar primeiro o conteúdo
    antes de iniciar a transição visual.
  */

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

  /*
    Força o navegador a registrar a remoção da classe
    antes que ela seja adicionada novamente.

    Sem isso, a mesma animação pode não reiniciar.
  */

  void rodadaElemento.offsetWidth;

  rodadaElemento.classList.add("rodada--atualizada");
}

/* ==========================
   ESCOLHAS
========================== */

export function bloquearEscolhas() {
  botoesJogada.forEach((botao) => {
    /*
        disabled bloqueia mouse, toque e teclado de maneira
        nativa, sendo preferível a depender apenas de CSS.
      */

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

  /*
    O placar continua sendo atualizado normalmente quando
    movimento reduzido estiver ativo.

    Apenas a animação decorativa é ignorada.
  */

  if (prefereMovimentoReduzido()) {
    return;
  }

  cancelarAnimacoes(placarPontos);

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

  /*
    Primeiro tornamos o botão disponível para interação
    e depois o expomos à árvore de acessibilidade.
  */

  botaoJogarNovamente.disabled = false;

  botaoJogarNovamente.setAttribute("aria-hidden", "false");
}

export function esconderBotaoNovaRodada() {
  /*
    disabled impede imediatamente que o botão receba
    foco ou seja ativado enquanto desaparece visualmente.
  */

  botaoJogarNovamente.disabled = true;

  botaoJogarNovamente.classList.remove("jogar-novamente--visivel");

  botaoJogarNovamente.setAttribute("aria-hidden", "true");
}

/* ==========================
   RESTAURAR ELEMENTOS
========================== */

export function restaurarElementosIniciais() {
  /*
    Durante o duelo, o botão escolhido pelo jogador é
    fisicamente movido para slotJogador.

    Aqui reconstruímos a ordem original da seleção usando
    JOGADAS como fonte oficial da sequência.
  */

  JOGADAS.forEach((jogada) => {
    const botao = botoesJogada.find((item) => item.dataset.jogada === jogada);

    /*
      Esta condição indicaria inconsistência entre
      game.js e o HTML, portanto falhamos explicitamente
      em vez de executar append(undefined).
    */

    if (!botao) {
      throw new Error(`Botão da jogada "${jogada}" não encontrado.`);
    }

    elementos.append(botao);
  });

  botoesJogada.forEach((botao) => {
    botao.classList.remove("elemento--selecionado", "elemento--saindo");

    /*
        Removemos somente os estilos inline temporários
        aplicados durante a animação.

        Os estilos permanentes continuam definidos no CSS.
      */

    botao.style.visibility = "";
    botao.style.pointerEvents = "";
    botao.style.transform = "";

    cancelarAnimacoes(botao);
  });

  elementos.hidden = false;
}

/* ==========================
   RESET DA CAMADA
========================== */

function reiniciarCamadaMovimento() {
  cancelarAnimacoes(elementoAnimado);

  elementoAnimado.classList.remove(
    "elemento-animado--visivel",
    "elemento-animado--celebrando",
  );

  elementoAnimado.style.left = "";
  elementoAnimado.style.top = "";
  elementoAnimado.style.width = "";
  elementoAnimado.style.height = "";
  elementoAnimado.style.transform = "";

  /*
    A imagem da camada só possui src enquanto estiver sendo
    utilizada.

    removeAttribute() representa melhor esse estado do que
    definir src="".
  */

  imagemAnimada.removeAttribute("src");
}

/* ==========================
   RESET DOS SLOTS
========================== */

function reiniciarSlotsDuelo() {
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

  cancelarAnimacoes(slotJogador);

  cancelarAnimacoes(slotCpu);
}

/* ==========================
   RESET DA CPU
========================== */

function reiniciarCpu() {
  cancelarAnimacoes(elementoCpu);

  elementoCpu.classList.remove("elemento-cpu--visivel");

  elementoCpu.setAttribute("aria-hidden", "true");

  /*
    A imagem da CPU será definida novamente somente
    quando sua nova jogada for sorteada.
  */

  imagemCpu.removeAttribute("src");

  imagemCpu.alt = "";
}

/* ==========================
   RESET DO DUELO
========================== */

export function reiniciarDuelo() {
  /*
    A limpeza é dividida por responsabilidade para evitar
    que esta função vire um bloco grande de operações
    sem relação clara entre si.
  */

  esconderBotaoNovaRodada();
  esconderMensagemConfronto();

  limparEstadosMensagem();

  reiniciarCamadaMovimento();
  reiniciarSlotsDuelo();
  reiniciarCpu();

  duelo.classList.remove("duelo--pulo", "duelo--empate");

  /*
    hidden remove o duelo tanto da renderização visual
    quanto da árvore de acessibilidade.
  */

  duelo.hidden = true;

  restaurarElementosIniciais();
}