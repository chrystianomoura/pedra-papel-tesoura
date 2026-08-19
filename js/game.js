"use strict";

/* =========================================================
   PEDRA, PAPEL E TESOURA
   REGRAS E ESTADO DA PARTIDA
   ---------------------------------------------------------
   Responsabilidades deste módulo:

   • definir os dados fixos do jogo;
   • armazenar o estado atual da partida;
   • controlar rodada e placar;
   • sortear a jogada da CPU;
   • calcular o resultado;
   • fornecer pequenos utilitários de tempo.

   Este arquivo não conhece o HTML nem manipula o DOM.
   Essa separação mantém a lógica do jogo independente
   da interface e das animações.
========================================================= */

/* ==========================
   JOGADAS
========================== */

/*
  As únicas jogadas válidas da aplicação.

  Object.freeze() impede alterações acidentais no array
  durante a execução do jogo.
*/

export const JOGADAS = Object.freeze(["pedra", "papel", "tesoura"]);

/* ==========================
   ASSETS
========================== */

/*
  Centralizar os caminhos evita espalhar strings de arquivos
  pelos diferentes módulos da aplicação.

  O objeto é imutável porque esses caminhos não precisam
  mudar durante uma partida.
*/

export const ASSETS = Object.freeze({
  pedra: "assets/pedra.png",
  papel: "assets/papel.png",
  tesoura: "assets/tesoura.png",
});

/* ==========================
   ESTADOS DA PARTIDA
========================== */

/*
  A partida funciona como uma pequena máquina de estados.

  Cada valor representa uma etapa específica do fluxo e
  ajuda a impedir interações fora do momento correto.
*/

export const ESTADOS = Object.freeze({
  ESCOLHENDO: "escolhendo",
  CPU_ANALISANDO: "cpu-analisando",
  DUELO: "duelo",
  RESULTADO: "resultado",
});

/* ==========================
   MENSAGENS DE CONFRONTO
========================== */

/*
  A chave sempre segue:

  vencedor-perdedor

  Como Pedra, Papel e Tesoura possuem apenas três relações
  de vitória possíveis, não precisamos duplicar mensagens
  para jogador e CPU.
*/

const MENSAGENS_CONFRONTO = Object.freeze({
  "pedra-tesoura": "Pedra esmaga Tesoura",
  "tesoura-papel": "Tesoura corta Papel",
  "papel-pedra": "Papel envolve Pedra",
});

/* ==========================
   TEMPOS
========================== */

/*
  Todos os tempos relacionados ao fluxo da partida ficam
  centralizados aqui.

  Isso evita números mágicos espalhados pelos módulos e
  facilita futuros ajustes de ritmo das animações.

  Valores em milissegundos.
*/

export const TEMPOS = Object.freeze({
  SAIDA_OPCOES: 850,
  MOVIMENTO_JOGADOR: 1250,

  ANALISE_CPU: 900,
  ENTRADA_CPU: 700,

  PULO_NORMAL: 700,
  PULO_EMPATE: 1100,

  PAUSA_APOS_PULO: 750,

  MOVIMENTO_VENCEDOR: 950,
  ENTRADA_CONFRONTO: 220,
  CELEBRACAO_VENCEDOR: 1500,

  LEITURA_RESULTADO: 500,

  TROCA_MENSAGEM: 220,
  ENTRADA_MENSAGEM: 220,
});

/* ==========================
   ESTADO ATUAL
========================== */

/*
  Diferentemente das constantes acima, este objeto precisa
  permanecer mutável porque representa a partida em andamento.

  Os outros módulos consultam este mesmo objeto compartilhado,
  enquanto as alterações devem passar preferencialmente pelas
  funções deste arquivo.
*/

export const estadoJogo = {
  estadoAtual: ESTADOS.ESCOLHENDO,

  rodada: 1,

  pontosJogador: 0,
  pontosCpu: 0,

  jogadaJogador: null,
  jogadaCpu: null,
};

/* ==========================
   VALIDAÇÃO DE JOGADA
========================== */

/*
  Mesmo que atualmente as jogadas venham de botões controlados
  pela própria aplicação, validar o valor mantém a lógica
  protegida contra chamadas incorretas de outros módulos.

  Isso também torna erros de programação mais fáceis de
  identificar durante o desenvolvimento.
*/

function jogadaEhValida(jogada) {
  return JOGADAS.includes(jogada);
}

function validarJogada(jogada) {
  if (!jogadaEhValida(jogada)) {
    throw new Error(`Jogada inválida: "${jogada}".`);
  }
}

/* ==========================
   CONTROLE DO ESTADO
========================== */

export function definirEstado(novoEstado) {
  /*
    Object.values() é suficiente aqui porque temos apenas
    quatro estados fixos e a função não está em um trecho
    crítico de performance.
  */

  const estadoEhValido = Object.values(ESTADOS).includes(novoEstado);

  if (!estadoEhValido) {
    throw new Error(`Estado de jogo inválido: "${novoEstado}".`);
  }

  estadoJogo.estadoAtual = novoEstado;
}

export function definirJogadaJogador(jogada) {
  validarJogada(jogada);

  estadoJogo.jogadaJogador = jogada;
}

export function definirJogadaCpu(jogada) {
  validarJogada(jogada);

  estadoJogo.jogadaCpu = jogada;
}

/* ==========================
   NOVA RODADA
========================== */

export function prepararNovaRodada() {
  /*
    O placar permanece intacto.

    Apenas os dados específicos da rodada anterior são
    descartados antes de devolver o jogo ao estado inicial.
  */

  estadoJogo.rodada += 1;

  estadoJogo.jogadaJogador = null;
  estadoJogo.jogadaCpu = null;

  estadoJogo.estadoAtual = ESTADOS.ESCOLHENDO;
}

/* ==========================
   PLACAR
========================== */

export function registrarPonto(resultado) {
  /*
    Empates não alteram o placar.
  */

  if (resultado === "jogador") {
    estadoJogo.pontosJogador += 1;

    return;
  }

  if (resultado === "cpu") {
    estadoJogo.pontosCpu += 1;

    return;
  }

  if (resultado !== "empate") {
    throw new Error(`Resultado inválido: "${resultado}".`);
  }
}

/* ==========================
   CPU
========================== */

export function sortearJogadaCpu() {
  /*
    Math.random() é adequado aqui porque o sorteio faz parte
    apenas da mecânica de um jogo casual.

    Não há qualquer requisito criptográfico envolvido.
  */

  const indice = Math.floor(Math.random() * JOGADAS.length);

  return JOGADAS[indice];
}

/* ==========================
   RESULTADO
========================== */

export function calcularResultado(jogador, cpu) {
  validarJogada(jogador);
  validarJogada(cpu);

  if (jogador === cpu) {
    return "empate";
  }

  /*
    Existem apenas três condições em que o jogador vence.

    Se não houve empate e nenhuma delas for verdadeira,
    necessariamente a CPU venceu.
  */

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

  if (resultado !== "jogador" && resultado !== "cpu") {
    throw new Error(`Resultado inválido: "${resultado}".`);
  }

  /*
    Descobrimos quem venceu e quem perdeu independentemente
    de ter sido o jogador ou a CPU.

    Dessa forma podemos utilizar a mesma tabela de mensagens
    para ambos os casos.
  */

  const vencedor =
    resultado === "jogador" ? estadoJogo.jogadaJogador : estadoJogo.jogadaCpu;

  const perdedor =
    resultado === "jogador" ? estadoJogo.jogadaCpu : estadoJogo.jogadaJogador;

  validarJogada(vencedor);
  validarJogada(perdedor);

  const chave = `${vencedor}-${perdedor}`;

  const mensagem = MENSAGENS_CONFRONTO[chave];

  /*
    Esta condição não deveria ser atingida com as três
    jogadas válidas atuais. Ela funciona como proteção
    caso as regras sejam modificadas no futuro.
  */

  if (!mensagem) {
    throw new Error(`Confronto sem mensagem cadastrada: "${chave}".`);
  }

  return mensagem;
}

/* ==========================
   FORMATAÇÃO
========================== */

export function formatarRodada(numero) {
  /*
    Exemplos:

    1  → "01"
    9  → "09"
    10 → "10"

    padStart() não limita números maiores que dois dígitos,
    portanto a rodada 100 continuará sendo exibida corretamente.
  */

  return String(numero).padStart(2, "0");
}

/* ==========================
   CONTROLE DE TEMPO
========================== */

export function esperar(tempo) {
  /*
    Transforma setTimeout() em uma Promise para permitir que
    os fluxos de animação sejam escritos de forma sequencial
    e legível utilizando async/await.
  */

  return new Promise((resolve) => {
    window.setTimeout(resolve, tempo);
  });
}

export function proximoFrame() {
  /*
    Dois requestAnimationFrame() consecutivos dão ao navegador
    a oportunidade de aplicar alterações de layout antes de
    fazermos uma nova medição com getBoundingClientRect().

    Isso é especialmente importante nas animações que movem
    elementos entre posições diferentes da interface.
  */

  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });
}