# Pedra, Papel e Tesoura

> **Um clássico jogo de Pedra, Papel e Tesoura construído para explorar
> estado, fluxo assíncrono, animações coordenadas e experiência de
> interface com JavaScript puro.**

![Status](https://img.shields.io/badge/status-concluído-success)
![HTML](https://img.shields.io/badge/HTML5-semântico-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-responsivo-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-F7DF1E?logo=javascript&logoColor=111)
![License](https://img.shields.io/badge/license-MIT-blue)

```{=html}
<p align="center">
```
`<a href="https://chrystianomoura.github.io/pedra-papel-tesoura/">`{=html}
`<strong>`{=html}🎮 Jogar agora`</strong>`{=html} `</a>`{=html}
```{=html}
</p>
```
![Pedra, Papel e Tesoura --- interface
desktop](./assets/screenshots/desktop.png)

------------------------------------------------------------------------

## Sobre o projeto

**Pedra, Papel e Tesoura** é uma implementação do jogo clássico
desenvolvida com HTML, CSS e JavaScript puro.

As regras são intencionalmente simples. Isso permitiu concentrar o
desenvolvimento em problemas que aparecem com frequência em interfaces
interativas: controle de estado, bloqueio de ações concorrentes,
coordenação de transições, movimentação de elementos entre diferentes
regiões da interface e consistência visual entre desktop e dispositivos
móveis.

A partida foi estruturada como uma sequência de estados bem definidos:

``` text
ESCOLHENDO
    │
    ▼
CPU_ANALISANDO
    │
    ▼
DUELO
    │
    ▼
RESULTADO
    │
    ▼
NOVA RODADA
```

Mais do que implementar as regras de Pedra, Papel e Tesoura, o objetivo
foi construir uma pequena experiência de jogo com código organizado,
responsabilidades separadas e comentários que também possam servir como
material de estudo.

------------------------------------------------------------------------

## Funcionalidades

-   Escolha entre **Pedra**, **Papel** e **Tesoura**.
-   Jogada da CPU sorteada a cada rodada.
-   Cálculo automático de vitória, derrota ou empate.
-   Placar acumulado durante a sessão.
-   Contador de rodadas.
-   Mensagens específicas para cada confronto.
-   Sequência visual de análise da CPU, duelo e resultado.
-   Animação da escolha do jogador até a arena.
-   Animação de entrada da CPU.
-   Apresentação e celebração do vencedor.
-   Fluxo próprio para empates.
-   Botão de nova rodada liberado somente após o encerramento do
    confronto.
-   Interface adaptada para desktop e mobile.
-   Suporte à preferência de movimento reduzido do sistema.
-   Controles preparados para mouse, teclado e toque.

------------------------------------------------------------------------

## Interface

A interface utiliza uma composição vertical única como base para
diferentes tamanhos de tela. Em vez de manter experiências visualmente
distintas entre desktop e mobile, o projeto preserva a mesma hierarquia:

``` text
Título
  ↓
Rodada
  ↓
Estado da partida
  ↓
Arena
  ↓
Placar
```

No mobile, os elementos são reorganizados e dimensionados para preservar
áreas de toque, leitura e espaço para as animações sem alterar a
identidade visual do jogo.

```{=html}
<table>
```
```{=html}
<tr>
```
```{=html}
<td align="center">
```
`<img src="./assets/screenshots/mobile-inicial.png" alt="Tela inicial do jogo no mobile" width="320">`{=html}
```{=html}
</td>
```
```{=html}
<td align="center">
```
`<img src="./assets/screenshots/mobile-resultado.png" alt="Resultado de uma rodada no mobile" width="320">`{=html}
```{=html}
</td>
```
```{=html}
</tr>
```
```{=html}
</table>
```

------------------------------------------------------------------------

## Como uma rodada funciona

Quando o usuário seleciona uma jogada, a aplicação não calcula e
apresenta o resultado imediatamente.

A interação passa por uma sequência controlada:

``` text
Usuário escolhe uma jogada
          │
          ▼
Escolhas são bloqueadas
          │
          ▼
Outras opções deixam a interface
          │
          ▼
Jogada selecionada vai para o duelo
          │
          ▼
CPU analisa e sorteia sua jogada
          │
          ▼
Escolha da CPU é apresentada
          │
          ▼
Resultado é calculado
          │
          ▼
Animação do confronto
          │
          ▼
Resultado e mensagem são exibidos
          │
          ▼
Placar é atualizado
          │
          ▼
Nova rodada é liberada
```

Essa sequência impede que novas escolhas sejam realizadas enquanto uma
rodada ainda está em andamento e mantém lógica, interface e animações
sincronizadas.

------------------------------------------------------------------------

## Regras do jogo

A lógica central segue as três relações clássicas:

``` text
Pedra   → vence Tesoura
Papel   → vence Pedra
Tesoura → vence Papel
```

Se jogador e CPU escolherem o mesmo elemento, o resultado é empate.

A função responsável pelo resultado trabalha apenas com os valores das
jogadas e retorna um dos três estados possíveis:

``` text
jogador
cpu
empate
```

Essa lógica permanece separada da apresentação visual do resultado.

------------------------------------------------------------------------

## Arquitetura

O JavaScript foi dividido em quatro módulos com responsabilidades
específicas:

``` text
                         ┌──────────────────┐
                         │     main.js      │
                         │   Orquestração   │
                         └────────┬─────────┘
                                  │
                  ┌───────────────┼───────────────┐
                  │               │               │
                  ▼               ▼               ▼
           ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐
           │   game.js   │ │    ui.js    │ │  animations.js  │
           │ Regras/estado│ │ Interface   │ │    Movimento    │
           └─────────────┘ └─────────────┘ └─────────────────┘
```

### `game.js`

Concentra as regras e o estado da partida.

Entre suas responsabilidades estão:

-   lista de jogadas válidas;
-   caminhos dos assets;
-   estados da partida;
-   pontuação;
-   número da rodada;
-   jogadas atuais do jogador e da CPU;
-   sorteio da CPU;
-   cálculo do resultado;
-   mensagens dos confrontos;
-   tempos compartilhados pelas transições;
-   utilitários de temporização.

Esse módulo não depende da estrutura visual da página para calcular quem
venceu.

### `ui.js`

Centraliza a interação com a interface.

É responsável por:

-   referências aos elementos do DOM;
-   mensagens de estado;
-   atualização da rodada;
-   atualização do placar;
-   bloqueio e liberação das escolhas;
-   apresentação do botão de nova rodada;
-   restauração dos elementos após um confronto;
-   limpeza dos estados visuais entre rodadas.

### `animations.js`

Isola o comportamento das animações.

O módulo controla:

-   pré-carregamento dos assets;
-   movimentação da escolha do jogador;
-   pulos do duelo;
-   animação específica de empate;
-   centralização do vencedor;
-   crescimento e celebração final;
-   adaptação das durações quando `prefers-reduced-motion` está ativo.

### `main.js`

Funciona como camada de orquestração.

Ele conecta regras, interface e animações e determina a ordem em que
cada etapa da rodada acontece.

A intenção é manter `main.js` responsável pelo **fluxo**, sem
transformar o arquivo no local onde todas as regras e todos os detalhes
visuais são implementados.

------------------------------------------------------------------------

## Estados da partida

O estado atual é representado explicitamente pelo objeto da partida e
pelos valores definidos em `ESTADOS`:

``` js
export const ESTADOS = {
  ESCOLHENDO: "escolhendo",
  CPU_ANALISANDO: "cpu-analisando",
  DUELO: "duelo",
  RESULTADO: "resultado",
};
```

Antes de aceitar uma escolha, `main.js` verifica se a aplicação ainda
está em `ESCOLHENDO`.

Isso evita iniciar duas rodadas simultaneamente durante uma animação ou
durante a análise da CPU.

O estado também torna o fluxo mais fácil de compreender: cada interação
acontece dentro de uma etapa conhecida da partida.

------------------------------------------------------------------------

## Animações e a camada permanente

Um dos principais desafios técnicos do projeto apareceu em dispositivos
móveis.

Durante as primeiras implementações, a troca entre o card original e sua
representação animada podia produzir pequenos flashes visuais,
especialmente com **Pedra** e **Papel**.

A solução adotada foi manter uma **camada de animação permanente no
DOM**.

``` text
Elemento real
     │
     ▼
Camada permanente preparada
     │
     ▼
Elemento real é ocultado
     │
     ▼
Camada executa o movimento
     │
     ▼
Destino é alcançado
     │
     ▼
Elemento real assume o estado final
```

Em vez de criar um novo clone visual a cada movimento, a aplicação
reutiliza sempre o mesmo elemento de animação.

Antes do movimento, a camada recebe:

-   a imagem correspondente;
-   posição inicial;
-   largura;
-   altura.

A movimentação é executada com a **Web Animations API** e transformações
`translate3d()`.

Ao final, a camada é escondida e o elemento real reaparece já em sua
posição definitiva.

Essa estratégia reduziu as trocas visuais durante os movimentos e tornou
as animações mais consistentes em dispositivos móveis.

------------------------------------------------------------------------

## Pré-carregamento dos assets

As três imagens utilizadas pelo jogo são carregadas antecipadamente pelo
módulo de animações.

Quando suportado pelo navegador, `HTMLImageElement.decode()` também é
utilizado para aguardar a decodificação antes de uma imagem participar
da animação.

O objetivo é evitar que carregamento ou decodificação aconteçam
justamente no momento em que um movimento precisa começar.

Os assets também foram redimensionados e otimizados para reduzir o peso
da aplicação sem alterar perceptivelmente sua apresentação na interface.

------------------------------------------------------------------------

## Movimento reduzido

O projeto respeita a preferência de acessibilidade:

``` css
@media (prefers-reduced-motion: reduce)
```

No JavaScript, a mesma preferência é consultada através de
`matchMedia()`.

Quando movimento reduzido está ativo, as durações das animações
controladas pelo JavaScript são reduzidas praticamente a zero,
preservando o funcionamento da partida sem exigir que o usuário
acompanhe toda a sequência de movimentos.

------------------------------------------------------------------------

## Acessibilidade

Algumas decisões presentes na interface:

-   elementos interativos implementados com `button`;
-   nomes acessíveis para as três escolhas;
-   imagens decorativas com `alt=""`;
-   `aria-live="polite"` para mensagens da partida;
-   `aria-atomic="true"` para atualização integral da mensagem;
-   elementos puramente visuais ocultados de tecnologias assistivas;
-   estado `disabled` utilizado quando uma ação ainda não está
    disponível;
-   agrupamento semântico das três escolhas;
-   suporte a `prefers-reduced-motion`;
-   foco e interação preservados para controles de teclado.

O viewport bloqueia o zoom acidental por toque nesta interface
específica de jogo. Essa é uma decisão contextual para evitar
interferência durante interações rápidas e não deve ser tratada como
padrão para páginas orientadas à leitura.

------------------------------------------------------------------------

## Desempenho

O projeto não utiliza framework JavaScript, processo de build ou
dependências de runtime.

Algumas decisões voltadas à fluidez da interface incluem:

-   assets gráficos redimensionados e otimizados;
-   pré-carregamento das imagens utilizadas durante a partida;
-   decodificação antecipada quando suportada;
-   reutilização de uma única camada para movimentos;
-   animações baseadas principalmente em `transform`;
-   uso da Web Animations API para movimentos coordenados;
-   reutilização dos elementos da interface entre rodadas;
-   ausência de criação contínua de elementos durante as animações.

A versão final também foi validada com o **Lighthouse** antes da
publicação.

------------------------------------------------------------------------

## Tecnologias utilizadas

### HTML5

Utilizado para a estrutura semântica da interface, incluindo:

-   `main`;
-   `header`;
-   `section`;
-   `footer`;
-   `button`;
-   atributos ARIA;
-   metadados para navegador, favicon e manifest.

### CSS3

Responsável pela identidade visual, layout e adaptação da interface:

-   Flexbox;
-   Grid;
-   propriedades customizadas;
-   `clamp()`;
-   media queries;
-   estados de interação;
-   transformações;
-   transições;
-   animações;
-   `prefers-reduced-motion`.

### JavaScript

O projeto utiliza JavaScript puro com ES Modules.

Entre os recursos aplicados estão:

-   `import` / `export`;
-   manipulação do DOM;
-   eventos;
-   objetos de estado;
-   `async` / `await`;
-   Promises;
-   `requestAnimationFrame()`;
-   `Math.random()`;
-   `matchMedia()`;
-   `HTMLImageElement.decode()`;
-   Web Animations API.

------------------------------------------------------------------------

## Estrutura do projeto

``` text
pedra-papel-tesoura/
├── assets/
│   ├── favicon/
│   │   ├── android-chrome-192x192.png
│   │   ├── android-chrome-512x512.png
│   │   ├── apple-touch-icon.png
│   │   ├── favicon-16x16.png
│   │   ├── favicon-32x32.png
│   │   ├── favicon-48x48.png
│   │   ├── favicon.ico
│   │   └── site.webmanifest
│   │
│   ├── screenshots/
│   │   ├── desktop.png
│   │   ├── mobile-inicial.png
│   │   └── mobile-resultado.png
│   │
│   ├── papel.png
│   ├── pedra.png
│   └── tesoura.png
│
├── css/
│   └── style.css
│
├── js/
│   ├── animations.js
│   ├── game.js
│   ├── main.js
│   └── ui.js
│
├── .gitignore
├── LICENSE
├── README.md
└── index.html
```

------------------------------------------------------------------------

## Como executar

O projeto não possui processo de build nem dependências npm.

Clone o repositório:

``` bash
git clone https://github.com/chrystianomoura/pedra-papel-tesoura.git
```

Entre na pasta:

``` bash
cd pedra-papel-tesoura
```

Depois, sirva os arquivos através de um servidor HTTP local, como a
extensão **Live Server** do VS Code.

Como o JavaScript utiliza ES Modules, executar o projeto através de um
servidor local evita limitações que alguns navegadores aplicam ao
protocolo `file://`.

A versão publicada pode ser acessada em:

**https://chrystianomoura.github.io/pedra-papel-tesoura/**

------------------------------------------------------------------------

## Aprendizados

Apesar de utilizar regras simples, o desenvolvimento permitiu trabalhar
conceitos que aparecem em aplicações interativas maiores:

-   separação de responsabilidades entre módulos;
-   modelagem explícita de estado;
-   controle de fluxo assíncrono;
-   coordenação entre JavaScript e CSS;
-   prevenção de interações concorrentes;
-   movimentação baseada em geometria do DOM;
-   Web Animations API;
-   pré-carregamento e decodificação de imagens;
-   debugging de animações em dispositivos reais;
-   responsividade orientada à experiência;
-   acessibilidade em interfaces dinâmicas;
-   otimização de assets;
-   organização de código para leitura e estudo.

O principal aprendizado foi que **uma regra simples não implica uma
interface trivial**. A qualidade da experiência depende também de como
estado, movimento, feedback e interação são coordenados.

------------------------------------------------------------------------

## Licença

Este projeto está distribuído sob a **MIT License**.

Consulte o arquivo [`LICENSE`](./LICENSE) para mais informações.
