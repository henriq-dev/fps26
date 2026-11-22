# Plano — Arena FPS consolidado · Pacote 38

Base consolidada: P37. O Pacote 38 amplia o arsenal e o acabamento visual, mantendo as regras centrais de combate, colisão e navegação; medições de desempenho em aparelho/GPU real continuam pendentes.

## Pacote 38 — Arsenal e legibilidade visual

Reutilizar a identidade neon/industrial existente e a arquitetura clássica Three.js r128. Acrescentar duas armas com modelos procedurais, stats balanceados e perfis visuais próprios, preservando o funcionamento das oito armas atuais; tornar listas, slots e atalhos de teclado dinâmicos para dez armas. Adicionar motas energéticas de vida curta por pool limitado e material/geometria reutilizáveis, sem alterar colisões, raycasts ou dano das armas existentes. Enriquecer a interface desenhada nas telas físicas NEXUS e reforçar a leitura de painéis/terminais sem aumentar desnecessariamente draw calls. Rever o scroll/safe-area dos slots touch e corrigir somente problemas responsivos reproduzíveis; gamepad PlayStation será validado por API/código, sem declarar teste físico quando não houver dispositivo conectado. Estrutura mantida: `script.js` para jogo/input/modelos/FX, `weapons.js` para dados do arsenal, `terminal-props.js` para terminais/telas, `style.css` para HUD e responsividade, `tests/core.test.js` para contratos/regressões e `sw.js` para cache offline versionado.

## Pacote 21 — Terminais físicos detalhados

Substituir a leitura visual de mesa + tela por três máquinas procedurais locais: Console KVM, Console de Rede e Console Central do Datacenter. Usar racks, monitores, teclados, trackball, patch panel, cabos coloridos, LEDs, parafusos, ventoinhas e painéis compartilhando geometrias/materials. Os modelos entram em `mapMeshes`, ficam fora de `boxes`/`solids` e acompanham estados `standby`, `detected`, `intrusion`, `committed` e `locked`. Preservar as regras de aproximação, invasão, escolhas, combate e navegação; a interação física/câmera fica para o Pacote 22.

## Mescla seletiva p21 — três prédios na Incursão

Incorporar do ZIP p21 somente os dados e regras de nível que ampliam a campanha: seletor de prédio, Complexo, Refinaria, Laboratório, terminais/saídas/dicas por prédio, spawns e cobertura de testes A*. Preservar do p22 `terminal-props.js`, tipos/orientações dos consoles, prompt contextual, foco/cancelamento da câmera, inimigos, combate e cache offline. Os monitores simples da p21 não entram, evitando duplicação visual com os terminais físicos.

## Pacote 23 — Interface hacker NEXUS

Transformar o modal cenográfico de invasão em uma estação operacional fictícia: moldura de terminal, topologia de rede com grade/pulsos, cartões de estado, prompt de seleção, console de logs e animações locais em CSS/Canvas. Reutilizar os mesmos IDs e fases `choose → run → done`, sem executar comandos, acessar rede ou alterar efeitos de gameplay. Manter leitura em toque, teclado, acessibilidade, `prefers-reduced-motion` e fallback do canvas.
