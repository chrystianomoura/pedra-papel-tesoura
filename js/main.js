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

const ESTADOS = {
  ESCOLHENDO: "escolhendo",
  CPU_ANALISANDO: "cpu-analisando",
  DUELO: "duelo",
  RESULTADO: "resultado",
};

const MENSAGENS_CONFRONTO = {
  "pedra-tesoura": "Pedra esmaga Tesoura",
  "tesoura-papel": "Tesoura corta Papel",
  "papel-pedra": "Papel envolve Pedra",
};

const TEMPOS = {
  SAIDA_OPCOES: 850,
  MOVIMENTO_JOGADOR: 1250,

  ANALISE_CPU: 1500,
  ENTRADA_CPU: 1100,

  LEITURA_DUELO: 1700,

  PULO_NORMAL: 700,
  PULO_EMPATE: 1100,

  PAUSA_APOS_PULO: 750,

  SAIDA_PERDEDOR: 650,
  MOVIMENTO_VENCEDOR: 950,

  ENTRADA_CONFRONTO: 450,

  CELEBRACAO_VENCEDOR: 1500,

  LEITURA_RESULTADO: 500,

  TROCA_MENSAGEM: 300,
  ENTRADA_MENSAGEM: 500,
};

/* ==========================
   DOM
========================== */

const elementos = document.querySelector("#elementos");

const botoesJogada = [...document.querySelectorAll("[data-jogada]")];

const campoVisual = document.querySelector("#campo-visual");

const mensagemJogo = document.querySelector("#mensagem-jogo");

const rodadaElemento = document.querySelector("#rodada");

const duelo = document.querySelector("#duelo");

const slotJogador = document.querySelector("#slot-jogador");

const slotCpu = document.querySelector("#slot-cpu");

const elementoCpu = document.querySelector("#elemento-cpu");

const imagemCpu = document.querySelector("#imagem-cpu");

const resultadoConfronto = document.querySelector("#resultado-confronto");

const placarPontos = document.querySelector("#placar-pontos");

const botaoJogarNovamente = document.querySelector("#jogar-novamente");

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
   ESTADO VISUAL DA MENSAGEM
========================== */

function limparEstadosMensagem() {
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

async function atualizarMensagem(
  texto,
  { destaque = false, impacto = false, estado = null } = {},
) {
  mensagemJogo.classList.add("mensagem-jogo--saindo");

  await esperar(TEMPOS.TROCA_MENSAGEM);

  mensagemJogo.textContent = texto;

  aplicarEstadoMensagem(estado);

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
   MENSAGEM DO CONFRONTO
========================== */

function descobrirMensagemConfronto(resultado) {
  if (resultado === "empate") {
    return "Ninguém cede";
  }

  const vencedor = resultado === "jogador" ? jogadaJogador : jogadaCpu;

  const perdedor = resultado === "jogador" ? jogadaCpu : jogadaJogador;

  return MENSAGENS_CONFRONTO[`${vencedor}-${perdedor}`];
}

async function mostrarMensagemConfronto(texto) {
  resultadoConfronto.textContent = texto;

  resultadoConfronto.setAttribute("aria-hidden", "false");

  await proximoFrame();

  resultadoConfronto.classList.add("resultado-confronto--visivel");

  await esperar(TEMPOS.ENTRADA_CONFRONTO);
}

function esconderMensagemConfronto() {
  resultadoConfronto.classList.remove("resultado-confronto--visivel");

  resultadoConfronto.setAttribute("aria-hidden", "true");

  resultadoConfronto.textContent = "";
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

  jogadaCpu = sortearJogadaCpu();

  imagemCpu.src = ASSETS[jogadaCpu];

  imagemCpu.alt = "";

  elementoCpu.setAttribute("aria-hidden", "false");

  await proximoFrame();

  elementoCpu.classList.add("elemento-cpu--visivel");

  await esperar(TEMPOS.ENTRADA_CPU);

  estadoAtual = ESTADOS.DUELO;

  await atualizarMensagem("Duelo", {
    estado: "duelo",
  });

  await esperar(TEMPOS.LEITURA_DUELO);

  await executarDuelo();
}

/* ==========================
   DUELO
========================== */

async function executarDuelo() {
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

  await mostrarVencedor(resultado);
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

  const mensagem = descobrirMensagemConfronto("empate");

  await mostrarMensagemConfronto(mensagem);

  await esperar(TEMPOS.LEITURA_RESULTADO);

  mostrarBotaoNovaRodada();
}

/* ==========================
   VENCEDOR
========================== */

async function mostrarVencedor(resultado) {
  estadoAtual = ESTADOS.RESULTADO;

  const jogadorVenceu = resultado === "jogador";

  const slotVencedor = jogadorVenceu ? slotJogador : slotCpu;

  const slotPerdedor = jogadorVenceu ? slotCpu : slotJogador;

  const elementoVencedor = jogadorVenceu
    ? slotJogador.querySelector(".elemento")
    : elementoCpu;

  const mensagemResultado = jogadorVenceu ? "Você venceu" : "CPU venceu";

  await atualizarMensagem(mensagemResultado, {
    destaque: true,
    impacto: true,
  });

  if (jogadorVenceu) {
    pontosJogador += 1;
  } else {
    pontosCpu += 1;
  }

  atualizarPlacar();

  const mensagemConfronto = descobrirMensagemConfronto(resultado);

  await mostrarMensagemConfronto(mensagemConfronto);

  await moverVencedorParaCentro(slotVencedor, slotPerdedor);

  await celebrarVencedor(elementoVencedor);

  await esperar(TEMPOS.LEITURA_RESULTADO);

  mostrarBotaoNovaRodada();
}

/* ==========================
   CENTRALIZAR VENCEDOR
========================== */

async function moverVencedorParaCentro(slotVencedor, slotPerdedor) {
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

async function celebrarVencedor(elemento) {
  const classe =
    elemento === elementoCpu
      ? "elemento-cpu--celebrando"
      : "elemento--celebrando";

  elemento.classList.add(classe);

  await esperar(TEMPOS.CELEBRACAO_VENCEDOR);

  elemento.classList.remove(classe);
}

/* ==========================
   JOGAR NOVAMENTE
========================== */

function mostrarBotaoNovaRodada() {
  botaoJogarNovamente.classList.add("jogar-novamente--visivel");

  botaoJogarNovamente.setAttribute("aria-hidden", "false");
}

function esconderBotaoNovaRodada() {
  botaoJogarNovamente.classList.remove("jogar-novamente--visivel");

  botaoJogarNovamente.setAttribute("aria-hidden", "true");
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
    botao.classList.remove(
      "elemento--selecionado",
      "elemento--saindo",
      "elemento--celebrando",
    );

    botao.style.visibility = "";
    botao.style.transform = "";

    botao.getAnimations().forEach((animacao) => {
      animacao.cancel();
    });
  });

  elementos.hidden = false;
}

/* ==========================
   RESET DO DUELO
========================== */

function reiniciarDuelo() {
  esconderBotaoNovaRodada();
  esconderMensagemConfronto();

  limparEstadosMensagem();

  duelo.classList.remove("duelo--pulo", "duelo--empate");

  slotJogador.classList.remove("slot-duelo--vencedor", "slot-duelo--perdedor");

  slotCpu.classList.remove("slot-duelo--vencedor", "slot-duelo--perdedor");

  slotJogador.getAnimations().forEach((animacao) => {
    animacao.cancel();
  });

  slotCpu.getAnimations().forEach((animacao) => {
    animacao.cancel();
  });

  elementoCpu.getAnimations().forEach((animacao) => {
    animacao.cancel();
  });

  elementoCpu.classList.remove(
    "elemento-cpu--visivel",
    "elemento-cpu--celebrando",
  );

  elementoCpu.setAttribute("aria-hidden", "true");

  imagemCpu.src = "";
  imagemCpu.alt = "";

  duelo.hidden = true;

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
    if (estadoAtual !== ESTADOS.ESCOLHENDO) {
      return;
    }

    prepararDuelo(botao);
  });
});

botaoJogarNovamente.addEventListener("click", iniciarNovaRodada);