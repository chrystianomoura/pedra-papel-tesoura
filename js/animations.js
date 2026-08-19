"use strict";

/* =========================================================
   PEDRA, PAPEL E TESOURA
   ANIMAÇÕES DA PARTIDA
   ---------------------------------------------------------
   Responsabilidades deste módulo:

   • pré-carregar e decodificar os assets visuais;
   • controlar a camada gráfica permanente;
   • movimentar a escolha do jogador até o duelo;
   • executar os pulos do confronto;
   • apresentar o vencedor no centro da arena;
   • respeitar a preferência de movimento reduzido.

   Este módulo não calcula regras nem altera o placar.
   Essas responsabilidades pertencem a game.js e ui.js.
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
   CONFIGURAÇÃO
========================== */

/*
  O crescimento final do vencedor é uma característica
  exclusivamente visual desta camada de animações.

  Manter o valor nomeado evita um "400" sem contexto
  no meio da lógica.
*/

const DURACAO_CRESCIMENTO_VENCEDOR = 400;

const ESCALA_VENCEDOR = 1.2;

const EASING_MOVIMENTO = "cubic-bezier(0.22, 1, 0.36, 1)";

/* ==========================
   CACHE DAS IMAGENS
========================== */

/*
  O Map mantém referências vivas para as imagens que foram
  previamente carregadas e decodificadas.

  Mesmo que não precisemos consultar esses objetos durante
  cada animação, manter as referências ajuda a evitar que
  o navegador precise reconstruir essas superfícies gráficas
  imediatamente antes de um movimento.

  Essa estratégia foi adotada principalmente para eliminar
  os flashes observados anteriormente em dispositivos móveis.
*/

const cacheImagens = new Map();

/* ==========================
   MOVIMENTO REDUZIDO
========================== */

/*
  matchMedia() é criado uma única vez.

  A propriedade .matches continua refletindo mudanças da
  preferência do sistema durante a própria sessão.
*/

const consultaMovimentoReduzido = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

function prefereMovimentoReduzido() {
  return consultaMovimentoReduzido.matches;
}

function obterDuracao(duracaoNormal) {
  /*
    Mantemos 1ms em vez de zero para que Promises ligadas
    ao término das animações continuem seguindo o mesmo
    fluxo assíncrono da versão normal.
  */

  return prefereMovimentoReduzido() ? 1 : duracaoNormal;
}

/* ==========================
   UTILITÁRIOS
========================== */

function cancelarAnimacoes(elemento) {
  elemento.getAnimations().forEach((animacao) => {
    animacao.cancel();
  });
}

/*
  Busca a imagem utilizada dentro de um card.

  Falhar explicitamente produz um erro muito mais útil
  do que permitir que o código continue até tentar acessar
  propriedades de null.
*/

function obterImagemDoElemento(elemento) {
  if (!elemento) {
    throw new Error("Não foi possível animar um elemento inexistente.");
  }

  const imagem = elemento.querySelector(".imagem-elemento");

  if (!imagem) {
    throw new Error("O elemento animado não possui uma imagem válida.");
  }

  return imagem;
}

/*
  Recupera exatamente o caminho utilizado no atributo src.

  Não usamos uma string construída a partir de dados externos:
  todos os assets são definidos e controlados pela própria
  aplicação.
*/

function obterFonteImagem(imagem) {
  const src = imagem.getAttribute("src");

  if (!src) {
    throw new Error("A imagem que seria animada não possui um src definido.");
  }

  return src;
}

/* ==========================
   CARREGAMENTO DE IMAGEM
========================== */

/*
  Aguarda uma imagem estar pronta para uso.

  Estratégia:

  1. tenta decode(), quando disponível;
  2. se decode() falhar, usa load/error como fallback;
  3. se a imagem já terminou de carregar, retorna imediatamente.

  O tratamento de "error" libera o fluxo para que uma falha
  de asset não deixe a inicialização presa para sempre.
*/

async function aguardarImagem(imagem) {
  if (typeof imagem.decode === "function") {
    try {
      await imagem.decode();

      return;
    } catch {
      /*
        Alguns navegadores podem rejeitar decode() mesmo
        quando o recurso ainda poderá terminar de carregar
        normalmente.

        Por isso não encerramos a função aqui.
      */
    }
  }

  if (imagem.complete) {
    return;
  }

  await new Promise((resolve) => {
    imagem.addEventListener("load", resolve, {
      once: true,
    });

    imagem.addEventListener("error", resolve, {
      once: true,
    });
  });
}

/* ==========================
   PRÉ-CARREGAMENTO
========================== */

export async function preloadAssetsAnimacao() {
  /*
    Cada asset recebe seu próprio objeto Image.

    Os carregamentos acontecem em paralelo e a aplicação
    aguarda todos antes de liberar a primeira jogada.
  */

  const carregamentos = Object.entries(ASSETS).map(async ([jogada, src]) => {
    const imagem = new Image();

    imagem.src = src;

    /*
          Guardamos a referência antes mesmo de aguardar
          o carregamento para que o objeto permaneça vivo.
        */

    cacheImagens.set(jogada, imagem);

    await aguardarImagem(imagem);
  });

  await Promise.all(carregamentos);
}

/* ==========================
   PREPARAR CAMADA
========================== */

async function prepararCamada(elementoOrigem) {
  const imagemOrigem = obterImagemDoElemento(elementoOrigem);

  const src = obterFonteImagem(imagemOrigem);

  /*
    Evita redefinir src desnecessariamente quando a camada
    já está utilizando exatamente o mesmo asset.
  */

  if (imagemAnimada.getAttribute("src") !== src) {
    imagemAnimada.src = src;
  }

  imagemAnimada.alt = "";

  /*
    O preload prepara os arquivos globalmente.

    Ainda assim aguardamos a imagem do elemento permanente,
    pois ela é a superfície gráfica que efetivamente será
    utilizada durante a animação.
  */

  await aguardarImagem(imagemAnimada);

  /*
    A medição acontece antes de esconder o elemento real,
    garantindo que suas dimensões e coordenadas representem
    exatamente a posição atualmente visível.
  */

  const origem = elementoOrigem.getBoundingClientRect();

  cancelarAnimacoes(elementoAnimado);

  elementoAnimado.classList.remove(
    "elemento-animado--visivel",
    "elemento-animado--celebrando",
  );

  /*
    A camada recebe exatamente o retângulo do card original.

    A partir daí, apenas transform é animado. Isso evita
    alterações de layout durante o movimento.
  */

  elementoAnimado.style.left = `${origem.left}px`;

  elementoAnimado.style.top = `${origem.top}px`;

  elementoAnimado.style.width = `${origem.width}px`;

  elementoAnimado.style.height = `${origem.height}px`;

  elementoAnimado.style.transform = "translate3d(0, 0, 0)";

  return origem;
}

/* ==========================
   VISIBILIDADE DA CAMADA
========================== */

function mostrarCamada() {
  elementoAnimado.classList.add("elemento-animado--visivel");
}

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
    A camada é preparada enquanto o card original
    ainda permanece completamente visível.
  */

  const origem = await prepararCamada(botaoSelecionado);

  duelo.hidden = false;

  /*
    O card real é escondido antes de mudar de posição
    dentro do DOM.

    A camada permanente assume visualmente seu lugar
    no mesmo ciclo de execução.
  */

  botaoSelecionado.style.visibility = "hidden";

  botaoSelecionado.style.pointerEvents = "none";

  slotJogador.append(botaoSelecionado);

  botaoSelecionado.classList.add("elemento--selecionado");

  mostrarCamada();

  /*
    O botão já está dentro do slot, mas precisamos permitir
    que o navegador consolide o novo layout antes de medir
    sua posição final.
  */

  await proximoFrame();

  const destino = botaoSelecionado.getBoundingClientRect();

  const deslocamentoX = destino.left - origem.left;

  const deslocamentoY = destino.top - origem.top;

  /* ==========================
     ANIMAÇÃO
  ========================== */

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

      easing: EASING_MOVIMENTO,

      fill: "forwards",
    },
  );

  await animacao.finished;

  /*
    A camada desaparece exatamente quando o elemento real
    já está disponível em sua posição definitiva.
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
  /*
    O vencedor pode pertencer tanto ao jogador quanto à CPU.

    Buscamos o card real existente dentro do slot vencedor
    e reutilizamos exatamente a mesma camada gráfica.
  */

  const elementoVencedor = slotVencedor.querySelector(
    ".elemento, .elemento-cpu",
  );

  if (!elementoVencedor) {
    throw new Error("O slot vencedor não contém um elemento válido.");
  }

  const origem = await prepararCamada(elementoVencedor);

  const campo = campoVisual.getBoundingClientRect();

  /* ==========================
     TROCA VISUAL
  ========================== */

  /*
    Os dois slots permanecem estruturalmente no Grid.

    Apenas são ocultados visualmente, portanto nenhuma
    reorganização do layout acontece durante a animação.
  */

  slotVencedor.classList.add("slot-duelo--oculto", "slot-duelo--vencedor");

  slotPerdedor.classList.add("slot-duelo--oculto", "slot-duelo--perdedor");

  mostrarCamada();

  /* ==========================
     CENTRO DA ARENA
  ========================== */

  const centroCampo = campo.left + campo.width / 2;

  const destinoLeft = centroCampo - origem.width / 2;

  const deslocamentoX = destinoLeft - origem.left;

  /* ==========================
     MOVIMENTO
  ========================== */

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

      easing: EASING_MOVIMENTO,

      fill: "forwards",
    },
  );

  await animacaoMovimento.finished;

  /*
    Enquanto a animação existe, a posição horizontal final
    está armazenada no transform.

    Antes de cancelá-la, transferimos essa posição para left.
    Assim o próximo efeito começa sem carregar deslocamentos
    anteriores no mesmo transform.
  */

  animacaoMovimento.cancel();

  elementoAnimado.style.left = `${destinoLeft}px`;

  elementoAnimado.style.transform = "translate3d(0, 0, 0)";

  /* ==========================
     CRESCIMENTO
  ========================== */

  /*
    Movimento e crescimento permanecem separados.

    O card só aumenta depois de já estar completamente
    centralizado, evitando distorções na trajetória.
  */

  const animacaoCrescimento = elementoAnimado.animate(
    [
      {
        transform: "scale(1)",
      },
      {
        transform: `scale(${ESCALA_VENCEDOR})`,
      },
    ],
    {
      duration: obterDuracao(DURACAO_CRESCIMENTO_VENCEDOR),

      easing: EASING_MOVIMENTO,

      fill: "forwards",
    },
  );

  await animacaoCrescimento.finished;

  /*
    O estado visual final é convertido em estilo inline
    antes que a Web Animation seja cancelada.

    Isso mantém o vencedor ampliado durante a celebração.
  */

  animacaoCrescimento.cancel();

  elementoAnimado.style.transform = `scale(${ESCALA_VENCEDOR})`;
}

/* ==========================
   CELEBRAÇÃO DO VENCEDOR
========================== */

export async function celebrarVencedor() {
  /*
    O CSS executa os três pulos.

    Como a camada já está centralizada e ampliada,
    esta etapa altera apenas o eixo vertical.
  */

  elementoAnimado.classList.add("elemento-animado--celebrando");

  await esperar(obterDuracao(TEMPOS.CELEBRACAO_VENCEDOR));

  elementoAnimado.classList.remove("elemento-animado--celebrando");
}