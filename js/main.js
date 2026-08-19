"use strict";

/* =========================================================
   PEDRA, PAPEL E TESOURA
   ORQUESTRAÇÃO DA PARTIDA
   ---------------------------------------------------------
   Responsabilidades deste módulo:

   • conectar regras, interface e animações;
   • controlar a sequência completa de uma rodada;
   • registrar os eventos de interação;
   • inicializar a aplicação;
   • garantir que os assets estejam preparados antes
     da primeira jogada.

   Este arquivo funciona como o "maestro" da aplicação.

   Ele não implementa:
   • regras do jogo → game.js;
   • manipulação visual do DOM → ui.js;
   • animações → animations.js.
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
  preloadAssetsAnimacao,
} from "./animations.js";

/* ==========================
   TEMPOS DE ORQUESTRAÇÃO
========================== */

/*
  Estes tempos não pertencem a uma animação específica.

  Eles existem apenas para controlar o ritmo entre
  diferentes etapas da sequência da partida.

  Mantê-los nomeados evita números mágicos espalhados
  dentro das funções.
*/

const PAUSA_ANTES_MOVIMENTO = 300;

const PAUSA_ANTES_CPU = 450;

/* ==========================
   PREPARAR DUELO
========================== */

async function prepararDuelo(botaoSelecionado) {
  /*
    Assim que uma escolha é aceita, o estado deixa de ser
    ESCOLHENDO imediatamente.

    Isso impede que cliques ou toques muito rápidos iniciem
    duas rodadas simultaneamente.
  */

  definirEstado(ESTADOS.CPU_ANALISANDO);

  bloquearEscolhas();

  /*
    O valor data-jogada vem exclusivamente dos três botões
    definidos no HTML.

    game.js ainda valida o valor antes de registrá-lo.
  */

  definirJogadaJogador(botaoSelecionado.dataset.jogada);

  /*
    A troca da mensagem pode acontecer paralelamente à saída
    visual das escolhas.

    Não precisamos aguardar sua conclusão antes de iniciar
    os primeiros passos da animação.
  */

  const transicaoAnalise = atualizarMensagem("CPU analisando", {
    estado: "analisando",
  });

  /*
    Apenas a escolha selecionada permanece.

    As outras duas recebem o estado visual de saída.
  */

  botoesJogada.forEach((botao) => {
    if (botao !== botaoSelecionado) {
      botao.classList.add("elemento--saindo");
    }
  });

  await esperar(PAUSA_ANTES_MOVIMENTO);

  /*
    A camada gráfica permanente assume visualmente o card
    enquanto o elemento real é reposicionado no slot.
  */

  await moverJogadorParaDuelo(botaoSelecionado);

  /*
    Garantimos que a transição de "CPU analisando" tenha
    terminado antes de seguir para as próximas mensagens.

    Como ela começou anteriormente, normalmente boa parte
    desse tempo já aconteceu em paralelo.
  */

  await transicaoAnalise;

  await esperar(TEMPOS.SAIDA_OPCOES);

  /*
    A tela inicial deixa de participar do layout enquanto
    o duelo estiver acontecendo.
  */

  elementos.hidden = true;

  await esperar(PAUSA_ANTES_CPU);

  await revelarCpu();
}

/* ==========================
   REVELAR CPU
========================== */

async function revelarCpu() {
  await esperar(TEMPOS.ANALISE_CPU);

  /* ==========================
     SORTEIO
  ========================== */

  const jogadaCpu = sortearJogadaCpu();

  definirJogadaCpu(jogadaCpu);

  /*
    O caminho vem do objeto ASSETS controlado pela própria
    aplicação.

    Nenhuma URL fornecida pelo usuário é utilizada aqui.
  */

  imagemCpu.src = ASSETS[jogadaCpu];

  imagemCpu.alt = "";

  elementoCpu.setAttribute("aria-hidden", "false");

  /*
    Esperamos o navegador registrar o novo src e o estado
    estrutural antes de adicionar a classe de entrada.
  */

  await proximoFrame();

  elementoCpu.classList.add("elemento-cpu--visivel");

  definirEstado(ESTADOS.DUELO);

  /*
    A entrada visual da CPU e a troca da mensagem para
    "Duelo" acontecem ao mesmo tempo.

    Promise.all() evita uma pausa artificial entre elas.
  */

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

  /* ==========================
     EMPATE
  ========================== */

  if (resultado === "empate") {
    await animarPuloEmpate();

    await esperar(TEMPOS.PAUSA_APOS_PULO);

    await mostrarEmpate();

    return;
  }

  /* ==========================
     VITÓRIA
  ========================== */

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

  /*
    Os slots são definidos uma única vez a partir
    do resultado e reutilizados em toda a apresentação.
  */

  const slotVencedor = jogadorVenceu ? slotJogador : slotCpu;

  const slotPerdedor = jogadorVenceu ? slotCpu : slotJogador;

  const mensagemResultado = jogadorVenceu ? "Você venceu" : "CPU venceu";

  /* ==========================
     MENSAGEM PRINCIPAL
  ========================== */

  await atualizarMensagem(mensagemResultado, {
    destaque: true,
  });

  /* ==========================
     PLACAR
  ========================== */

  registrarPonto(resultado);

  atualizarPlacar();

  /* ==========================
     REGRA DO CONFRONTO
  ========================== */

  const mensagemConfronto = descobrirMensagemConfronto(resultado);

  await mostrarMensagemConfronto(mensagemConfronto);

  /* ==========================
     APRESENTAÇÃO DO VENCEDOR
  ========================== */

  await moverVencedorParaCentro(slotVencedor, slotPerdedor);

  /*
    A celebração agora pertence inteiramente à camada
    gráfica permanente.

    Não precisamos mais localizar ou enviar o elemento
    vencedor real para a função.
  */

  await celebrarVencedor();

  await esperar(TEMPOS.LEITURA_RESULTADO);

  mostrarBotaoNovaRodada();
}

/* ==========================
   NOVA RODADA
========================== */

async function iniciarNovaRodada() {
  /*
    game.js limpa os dados lógicos da rodada.

    ui.js limpa os estados visuais e devolve os cards
    às suas posições originais.
  */

  prepararNovaRodada();

  reiniciarDuelo();

  atualizarRodada();

  await atualizarMensagem("Escolha sua jogada:");

  liberarEscolhas();
}

/* ==========================
   EVENTOS
========================== */

function registrarEventos() {
  botoesJogada.forEach((botao) => {
    botao.addEventListener("click", () => {
      /*
            Mesmo que um evento consiga chegar até aqui,
            somente o estado ESCOLHENDO pode iniciar
            uma nova rodada.
          */

      if (estadoJogo.estadoAtual !== ESTADOS.ESCOLHENDO) {
        return;
      }

      /*
            O fluxo é assíncrono, mas o evento não precisa
            aguardar seu retorno.

            void deixa explícito que a Promise é iniciada
            intencionalmente sem ser retornada pelo listener.
          */

      void prepararDuelo(botao);
    });
  });

  botaoJogarNovamente.addEventListener("click", () => {
    /*
        O próprio botão permanece disabled até o final
        da rodada, mas ainda protegemos o fluxo pelo estado.
      */

    if (estadoJogo.estadoAtual !== ESTADOS.RESULTADO) {
      return;
    }

    void iniciarNovaRodada();
  });
}

/* ==========================
   INICIALIZAÇÃO
========================== */

async function inicializarJogo() {
  /*
    As escolhas ficam temporariamente bloqueadas enquanto
    Pedra, Papel e Tesoura são carregados e decodificados.

    Isso garante que a camada gráfica permanente esteja
    pronta antes da primeira animação.
  */

  bloquearEscolhas();

  await preloadAssetsAnimacao();

  /*
    Os listeners são registrados somente depois que a
    aplicação possui tudo o que precisa para funcionar.
  */

  registrarEventos();

  liberarEscolhas();
}

/* ==========================
   INICIAR APLICAÇÃO
========================== */

/*
  Existe um único ponto de entrada.

  O catch evita uma rejeição de Promise silenciosa durante
  a inicialização e mantém os botões bloqueados caso algum
  erro estrutural impeça o jogo de iniciar corretamente.
*/

void inicializarJogo().catch((erro) => {
  console.error("Não foi possível inicializar o jogo:", erro);

  bloquearEscolhas();
});