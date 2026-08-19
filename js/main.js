"use strict";

/* =========================================================
   PEDRA, PAPEL E TESOURA
   CONTROLE DA PARTIDA
========================================================= */

/* ==========================
   CONFIGURAÇÃO
========================== */

const JOGADAS = ["pedra", "papel", "tesoura"];

const ASSETS = {
  pedra: "assets/pedra.png",
  papel: "assets/papel.png",
  tesoura: "assets/tesoura.png",
};

const RESULTADOS_VISUAIS = {
  "pedra-tesoura": {
    src: "assets/resultados/pedra-vence-tesoura.png",
    alt: "Pedra vence Tesoura",
  },

  "papel-pedra": {
    src: "assets/resultados/papel-vence-pedra.png",
    alt: "Papel vence Pedra",
  },

  "tesoura-papel": {
    src: "assets/resultados/tesoura-vence-papel.png",
    alt: "Tesoura vence Papel",
  },
};

const ESTADOS = {
  ESCOLHENDO: "escolhendo",
  CPU_ANALISANDO: "cpu-analisando",
  DUELO: "duelo",
  RESULTADO: "resultado",
};

/*
  Todos os tempos da partida ficam centralizados aqui.

  A análise da CPU é propositalmente mais curta que
  antes, enquanto o restante da cadência permanece igual.
*/

const TEMPOS = {
  SAIDA_OPCOES: 850,
  MOVIMENTO_JOGADOR: 1250,

  ANALISE_CPU: 1500,
  ENTRADA_CPU: 1100,

  LEITURA_DUELO: 1700,

  PULO_NORMAL: 700,
  PULO_EMPATE: 1100,

  PAUSA_APOS_PULO: 900,

  SAIDA_DUELO: 850,
  ENTRADA_RESULTADO: 950,

  LEITURA_RESULTADO: 1100,

  TROCA_MENSAGEM: 300,
  ENTRADA_MENSAGEM: 500,
};

/* ==========================
   DOM
========================== */

const elementos = document.querySelector("#elementos");

const botoesJogada = [...document.querySelectorAll("[data-jogada]")];

const mensagemJogo = document.querySelector("#mensagem-jogo");

const rodadaElemento = document.querySelector("#rodada");

const duelo = document.querySelector("#duelo");

const slotJogador = document.querySelector("#slot-jogador");

const elementoCpu = document.querySelector("#elemento-cpu");
const imagemCpu = document.querySelector("#imagem-cpu");

const resultadoFinal = document.querySelector("#resultado-final");

const imagemResultado = document.querySelector("#imagem-resultado");

const placarPontos = document.querySelector("#placar-pontos");

const botaoJogarNovamente = document.querySelector("#jogar-novamente");

const botaoJogarNovamenteEmpate = document.querySelector(
  "#jogar-novamente-empate",
);

/* ==========================
   ESTADO
========================== */

let estadoAtual = ESTADOS.ESCOLHENDO;

let rodada = 1;

let pontosJogador = 0;
let pontosCpu = 0;

let jogadaJogador = null;
let jogadaCpu = null;

/* ==========================
   UTILITÁRIOS
========================== */

function esperar(tempo) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, tempo);
  });
}

function proximoFrame() {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(resolve);
    });
  });
}

function formatarRodada(numero) {
  return String(numero).padStart(2, "0");
}

/* ==========================
   MENSAGEM DA PARTIDA
========================== */

async function atualizarMensagem(
  texto,
  { destaque = false, impacto = false } = {},
) {
  mensagemJogo.classList.add("mensagem-jogo--saindo");

  await esperar(TEMPOS.TROCA_MENSAGEM);

  mensagemJogo.textContent = texto;

  mensagemJogo.classList.toggle("mensagem-jogo--destaque", destaque);

  mensagemJogo.classList.remove(
    "mensagem-jogo--saindo",
    "mensagem-jogo--entrando",
    "mensagem-jogo--impacto",
  );

  void mensagemJogo.offsetWidth;

  if (impacto) {
    mensagemJogo.classList.add("mensagem-jogo--impacto");
  } else {
    mensagemJogo.classList.add("mensagem-jogo--entrando");
  }

  await esperar(impacto ? 650 : TEMPOS.ENTRADA_MENSAGEM);

  mensagemJogo.classList.remove(
    "mensagem-jogo--entrando",
    "mensagem-jogo--impacto",
  );
}

/* ==========================
   RODADA
========================== */

function atualizarRodada() {
  rodadaElemento.textContent = `Rodada ${formatarRodada(rodada)}`;

  rodadaElemento.classList.remove("rodada--atualizada");

  void rodadaElemento.offsetWidth;

  rodadaElemento.classList.add("rodada--atualizada");
}

/* ==========================
   ESCOLHAS
========================== */

function bloquearEscolhas() {
  botoesJogada.forEach((botao) => {
    botao.disabled = true;
  });
}

function liberarEscolhas() {
  botoesJogada.forEach((botao) => {
    botao.disabled = false;
  });
}

/* ==========================
   PLACAR
========================== */

function atualizarPlacar() {
  placarPontos.textContent = `${pontosJogador} : ${pontosCpu}`;

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
   CPU
========================== */

function sortearJogadaCpu() {
  const indice = Math.floor(Math.random() * JOGADAS.length);

  return JOGADAS[indice];
}

/* ==========================
   RESULTADO
========================== */

function calcularResultado(jogador, cpu) {
  if (jogador === cpu) {
    return "empate";
  }

  const jogadorVenceu =
    (jogador === "pedra" && cpu === "tesoura") ||
    (jogador === "papel" && cpu === "pedra") ||
    (jogador === "tesoura" && cpu === "papel");

  return jogadorVenceu ? "jogador" : "cpu";
}

function descobrirResultadoVisual(jogador, cpu) {
  const resultado = calcularResultado(jogador, cpu);

  if (resultado === "empate") {
    return null;
  }

  const vencedor = resultado === "jogador" ? jogador : cpu;
  const perdedor = resultado === "jogador" ? cpu : jogador;

  return RESULTADOS_VISUAIS[`${vencedor}-${perdedor}`];
}

/* ==========================
   MOVIMENTO PARA O DUELO
========================== */

async function moverJogadorParaDuelo(botaoSelecionado) {
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

  /*
    O clone altera somente sua posição.

    Nenhuma escala é aplicada durante o percurso.
  */

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
   PREPARAR DUELO
========================== */

async function prepararDuelo(botaoSelecionado) {
  estadoAtual = ESTADOS.CPU_ANALISANDO;

  bloquearEscolhas();

  jogadaJogador = botaoSelecionado.dataset.jogada;

  atualizarMensagem("CPU analisando...");

  botoesJogada.forEach((botao) => {
    if (botao !== botaoSelecionado) {
      botao.classList.add("elemento--saindo");
    }
  });

  await esperar(300);

  await moverJogadorParaDuelo(botaoSelecionado);

  await esperar(TEMPOS.SAIDA_OPCOES);

  elementos.hidden = true;

  await esperar(650);

  await revelarCpu();
}

/* ==========================
   REVELAR CPU
========================== */

async function revelarCpu() {
  await esperar(TEMPOS.ANALISE_CPU);

  jogadaCpu = sortearJogadaCpu();

  imagemCpu.src = ASSETS[jogadaCpu];
  imagemCpu.alt = jogadaCpu;

  elementoCpu.setAttribute("aria-hidden", "false");

  await proximoFrame();

  elementoCpu.classList.add("elemento-cpu--visivel");

  await esperar(TEMPOS.ENTRADA_CPU);

  estadoAtual = ESTADOS.DUELO;

  await atualizarMensagem("Duelo");

  await esperar(TEMPOS.LEITURA_DUELO);

  await executarPulo();
}

/* ==========================
   PULO DO DUELO
========================== */

async function executarPulo() {
  const resultado = calcularResultado(jogadaJogador, jogadaCpu);

  if (resultado === "empate") {
    duelo.classList.add("duelo--empate");

    await esperar(TEMPOS.PULO_EMPATE);

    duelo.classList.remove("duelo--empate");

    await esperar(TEMPOS.PAUSA_APOS_PULO);

    await mostrarEmpate();

    return;
  }

  duelo.classList.add("duelo--pulo");

  await esperar(TEMPOS.PULO_NORMAL);

  duelo.classList.remove("duelo--pulo");

  await esperar(TEMPOS.PAUSA_APOS_PULO);

  await mostrarResultado(resultado);
}

/* ==========================
   EMPATE
========================== */

async function mostrarEmpate() {
  estadoAtual = ESTADOS.RESULTADO;

  await atualizarMensagem("Empate", {
    destaque: true,
    impacto: true,
  });

  await esperar(TEMPOS.LEITURA_RESULTADO);

  mostrarBotao(botaoJogarNovamenteEmpate);
}

/* ==========================
   VITÓRIA / DERROTA
========================== */

async function mostrarResultado(resultado) {
  estadoAtual = ESTADOS.RESULTADO;

  const resultadoDaRodada = descobrirResultadoVisual(jogadaJogador, jogadaCpu);

  imagemResultado.src = resultadoDaRodada.src;
  imagemResultado.alt = resultadoDaRodada.alt;

  resultadoFinal.hidden = false;

  duelo.classList.add("duelo--saindo");

  await esperar(TEMPOS.SAIDA_DUELO);

  duelo.hidden = true;

  await proximoFrame();

  resultadoFinal.classList.add("resultado-final--visivel");

  await esperar(TEMPOS.ENTRADA_RESULTADO);

  if (resultado === "jogador") {
    pontosJogador += 1;

    await atualizarMensagem("Você venceu", {
      destaque: true,
      impacto: true,
    });
  } else {
    pontosCpu += 1;

    await atualizarMensagem("CPU venceu", {
      destaque: true,
      impacto: true,
    });
  }

  atualizarPlacar();

  await esperar(TEMPOS.LEITURA_RESULTADO);

  mostrarBotao(botaoJogarNovamente);
}

/* ==========================
   BOTÕES DE NOVA RODADA
========================== */

function mostrarBotao(botao) {
  botao.classList.add("jogar-novamente--visivel");

  botao.setAttribute("aria-hidden", "false");
}

function esconderBotao(botao) {
  botao.classList.remove("jogar-novamente--visivel");

  botao.setAttribute("aria-hidden", "true");
}

/* ==========================
   RESTAURAR ELEMENTOS
========================== */

function restaurarElementosIniciais() {
  JOGADAS.forEach((jogada) => {
    const botao = botoesJogada.find((item) => item.dataset.jogada === jogada);

    elementos.append(botao);
  });

  botoesJogada.forEach((botao) => {
    botao.classList.remove("elemento--selecionado", "elemento--saindo");

    botao.style.visibility = "";
    botao.style.transform = "";
  });

  elementos.hidden = false;
}

/* ==========================
   RESET DA ARENA
========================== */

function reiniciarArena() {
  esconderBotao(botaoJogarNovamente);
  esconderBotao(botaoJogarNovamenteEmpate);

  duelo.classList.remove("duelo--pulo", "duelo--empate", "duelo--saindo");

  duelo.hidden = true;

  elementoCpu.classList.remove("elemento-cpu--visivel");

  elementoCpu.setAttribute("aria-hidden", "true");

  imagemCpu.src = "";
  imagemCpu.alt = "";

  resultadoFinal.classList.remove("resultado-final--visivel");

  resultadoFinal.hidden = true;

  imagemResultado.src = "";
  imagemResultado.alt = "";

  restaurarElementosIniciais();
}

/* ==========================
   NOVA RODADA
========================== */

async function iniciarNovaRodada() {
  rodada += 1;

  jogadaJogador = null;
  jogadaCpu = null;

  estadoAtual = ESTADOS.ESCOLHENDO;

  reiniciarArena();

  atualizarRodada();

  await atualizarMensagem("Escolha sua jogada:");

  liberarEscolhas();
}

/* ==========================
   EVENTOS
========================== */

botoesJogada.forEach((botao) => {
  botao.addEventListener("click", () => {
    if (estadoAtual !== ESTADOS.ESCOLHENDO) {
      return;
    }

    prepararDuelo(botao);
  });
});

botaoJogarNovamente.addEventListener("click", iniciarNovaRodada);

botaoJogarNovamenteEmpate.addEventListener("click", iniciarNovaRodada);