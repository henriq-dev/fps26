# Relatório atual — Arena FPS v8 · Pacote 13

**Data:** 17/11/2026  
**Projeto:** Arena FPS — jogo web 3D com Three.js r128, scripts JavaScript clássicos e namespace `Arena`.

## Resumo executivo

Esta continuação preserva a estrutura original Three.js + scripts clássicos e avança o polimento visual/sonoro do arsenal sobre a atualização p12 recebida. O Pacote 13 acrescenta calor cosmético à Metralhadora, um clique metálico espacializado nos estojos e explosões em camadas; não publica o jogo nem habilita serviços externos.

O Pacote 6 aprimorou os modelos das armas; o 7 acrescentou clarões específicos, rastros, faíscas, estojos e auras; o 8 adicionou marcas de impacto e respostas por superfície; o 9 trouxe luvas, acabamentos e fumaça; o 10 articulou dedos e recargas; o 11 aprofundou detalhes próximos e a assinatura visual por arma. O p12 recebido trouxe inércia do viewmodel, acabamento das luvas e clarão radial/lateral. O p13 acrescenta calor no cano da Metralhadora, som de estojo e camadas de explosão, todos visuais/sonoros.

O modo Sobrevivência mantém a limpeza de onda. Operações alterna três objetivos (invadir terminal, ativar três relés, controlar zona) e permite concluir a onda sem eliminar todos os inimigos. A carreira e os recordes são armazenados apenas no navegador.

## Funcionalidades encontradas

### Fácil

- Ajustes de campo de visão e sensibilidade no menu; a mira dinâmica acompanha a dispersão da arma e o movimento.
- Velocidades configuradas para Soldado/Grunt (2,3), Brutamonte/Brute (1,7) e Corredor/Runner (4,0), com rótulos localizados para os inimigos no jogo e no feed.

### Médio

- Pools/reutilização de entidades e efeitos para inimigos, projéteis, granadas, itens, elementos de dano flutuante e efeitos visuais.
- Interlúdio tático com três perks aleatórios e seleção por teclas 1–3; loja pelas teclas 4–7, com créditos, custo progressivo e limites aplicáveis.
- Rotação dos mapas Arena, Pátio e Fábrica por blocos de cinco ondas.
- Combo de abates até x5, janela de 3,2 segundos, feed de abates e créditos por morte.
- Três granadas de mão por partida, lançadas com G.
- Regeneração de 7 HP/s após 4,5 s sem dano, tremor de tela e efeito de batimento em vida baixa.

### Difícil

- Busca A* em grade de 1 m, heap binário, prevenção de corte diagonal de cantos e suavização por visibilidade/linha livre.
- Chefe com três fases: rajadas; anel de projéteis com reforços; e investida com aviso prévio.
- Módulos JavaScript clássicos compartilhando dados e funções pelo namespace `window.Arena`.
- Direção visual Neon Rebellion: céu em gradiente, luzes/faixas nos cantos, poeira em partículas, piso em grade e HUD neon.

## Arquitetura e arquivos

`index.html` carrega Three.js e os módulos clássicos na ordem necessária. Os módulos que publicam no namespace `Arena` são:

- `weapons.js`: `WEAPONS`.
- `enemies.js`: `TYPES`, tabela de geração, escalonamento de inimigos e classificação das fases do chefe.
- `upgrades.js`: catálogo de perks, cálculo de atributos e sorteio de opções.
- `maps.js`: definições dos três mapas e rotação por onda.
- `pathfinding.js`: grade navegável, testes de bloqueio/linha livre, busca A* e caminho suavizado.
- `tactics.js`: funções puras para dificuldade, objetivos por onda, cobertura, flanqueamento e distribuição de disparos do esquadrão.
- `progression.js`: carreira local, desafios diários, conquistas, skins e recordes por par modo/dificuldade.
- `audio.js`: criação do áudio, espacialização e efeitos sonoros.

`script.js` integra essas APIs ao runtime, ao combate, aos menus, à loja, à renderização e aos pools de efeitos. `style.css` contém a apresentação e o layout da interface.

## Comportamento do chefe

Os limiares são definidos por `Arena.bossPhase` em `enemies.js`: fase 1 acima de 66% de vida; fase 2 acima de 33% e até 66%; fase 3 com 33% ou menos.

1. **Fase 1 — rajadas:** a menos de 22 m, emite três projéteis por rajada, espaçados em 0,16 s. Inicia nova rajada a cada 2,8 s. Os projéteis viajam a 9 m/s e causam 16 de dano.
2. **Fase 2 — anel e reforços:** ao entrar, convoca dois Corredores e um Kamikaze, se houver espaço. O primeiro anel sai após 1,5 s e os seguintes a cada 4,5 s; cada um tem 14 projéteis radiais, a 6 m/s, com 12 de dano. As rajadas passam a quatro tiros a cada 2,5 s.
3. **Fase 3 — investida:** as rajadas passam a cinco tiros a cada 1,9 s e os anéis continuam. O chefe começa a buscar uma investida quando o jogador está a mais de 4 m. Pisca/telegrafa por 0,9 s, depois avança a 15 m/s por até 0,9 s ou até bloquear. Se chegar a menos de 1,8 m, causa 30 de dano uma vez por investida. A recarga entre investidas é 5,5 s e o chefe recebe brilho avermelhado nesta fase.

Os limiares, avisos, ataques, dano, velocidades e intervalos estão implementados em `script.js` e `enemies.js`.

## Testes realizados nesta continuação

- `./test.sh`: aprovado (`core tests: OK` e `syntax checks: OK`). Foram adicionadas verificações de calendário de objetivos, multiplicadores de dificuldade, atribuição alternada de flanco e cadência de disparo, cobertura que bloqueia linha de visão, desafios/conquistas/skins e separação de recordes.
- `node --check` em todos os scripts JavaScript: aprovado.
- Teste de geometria de pontos candidatos: os pontos de Operações ficaram livres em 9/10 posições na Arena, 10/10 no Pátio e 10/10 na Fábrica; o gerador ignora posições obstruídas.
- Preview HTTP privado: menu renderizado, valores Operações/Pesadelo persistidos localmente e partida iniciada no navegador com HUD/canvas funcionando.
- Não foi feito playtest manual até onda 2+ nesta verificação; portanto, a apresentação e o balanceamento das missões em combate não são declarados como aprovados. Também não houve teste em dispositivo físico de touch/gamepad nem reexecução das medições de performance do pacote anterior.

## Performance observada no pacote anterior (não reavaliada no pacote 5)

Medições curtas no navegador de teste, com viewport de 1280 × 1100, DPR 1 e uma cena carregada com 12 inimigos (incluindo o chefe), poeira e projéteis. WebGL2 permaneceu ativo sem perda de contexto.

| Qualidade | Resolução interna do canvas | FPS médio medido | Frametime P95 | Maior frametime observado |
|---|---:|---:|---:|---:|
| Baixa | 960 × 825 | 59,5 | 20,0 ms | 24,1 ms |
| Média | 1280 × 1100 | 44,9 | 29,5 ms | 48,4 ms |
| Alta | 1280 × 1100 | 47,9 | 26,4 ms | 30,0 ms |

Na amostra da cena carregada, o renderer indicou 43 chamadas de desenho, 484 triângulos, 260 pontos de poeira, 15 geometrias e 2 texturas. As amostras são breves e variam entre execuções; não representam uma garantia de FPS em outros computadores, navegadores ou dispositivos.

## Alterações e limitações

- `script.js`, `index.html`, `style.css`, `enemies.js`, `audio.js` e `sw.js` foram atualizados; `tactics.js` e `progression.js` foram acrescentados.
- `tests/core.test.js`, `TODO.md`, `plan.md` e este relatório documentam as regras e os testes do pacote.
- Recordes, desafios e cosméticos persistem no `localStorage` do navegador; não são sincronizados entre dispositivos nem enviados a servidor.
- A rotação e os parâmetros de missão foram testados como funções puras; a execução completa da vitória alternativa e a retirada de hostis não tiveram playtest manual nesta sessão.
- A tabela de desempenho abaixo registra a amostra do pacote anterior e não deve ser interpretada como benchmark desta continuação.

## Pacote 1 — Fundação de release (16/11/2026)

Este pacote iniciou a evolução solicitada sem substituir a arquitetura existente. O Three.js r128 agora está incluído localmente em `three.min.js`, e `index.html` não depende mais da CDN para iniciar o jogo. Foram adicionados `manifest.json`, `icon.svg` e `sw.js`, com cache versionado dos arquivos críticos, limpeza de caches antigos e fallback para `index.html` em navegação offline. O service worker só intercepta requisições GET da própria origem.

Também foram adicionados metadados de descrição, ícone, manifest, labels de acessibilidade para arena, radar, HUD, estatísticas e seleção de armas, além do registro automático do service worker. O núcleo do jogo e o loop de combate não foram reescritos neste pacote.

Foi criado `tests/core.test.js`, executado por `test.sh`, cobrindo quantidade e propriedades de armas, sorteio de inimigos, fases do chefe, rotação de mapas, sorteio de perks, cálculo de atributos e existência de caminho navegável no A*. O plano geral está em `plan.md` e o acompanhamento em `TODO.md`.

### Validação do pacote 1

- `./test.sh`: aprovado (`core tests: OK` e `syntax checks: OK`).
- `node --check sw.js`: aprovado.
- Validação do `manifest.json`: aprovada.
- Verificação de dependência: Three.js local presente; nenhuma referência CDN restante no HTML.
- O ZIP original não tinha servidor, build ou navegador embutido; a instalação do service worker precisa ser validada quando o jogo for servido por HTTP/HTTPS, não abrindo o arquivo diretamente com `file://`.

### Pendências para os próximos pacotes

Os pacotes 1–5 agora estão descritos no `TODO.md`; a pendência explicitamente fora deste marco é remapeamento de gamepad. O próximo passo recomendado é playtest humano para calibrar duração/contestação das operações e a dificuldade em ondas altas, seguido de ajustes com resultados observados.

## Pacote 2 — Combate, feedback e áudio espacial (16/11/2026)

O combate recebeu feedback mais legível sem trocar a arquitetura do jogo. O escudo agora usa material emissivo individual por inimigo, pisca em ciano ao receber impacto e gera uma esfera de energia e fragmentos. A Railgun atravessa o escudo com um evento visual e sonoro de sobrecarga. Acertos no corpo continuam usando o som de impacto normal; headshots recebem uma camada aguda adicional. Tiros inimigos agora têm som próprio e explosões do chefe são posicionadas no espaço.

O áudio procedural ganhou uma função pura `Arena.audioSpatial`, que calcula panorama estéreo e atenuação por distância usando a posição, orientação e posição do jogador. `script.js` atualiza o ouvinte a cada quadro, e disparos inimigos, anéis do chefe e explosões informam suas coordenadas ao áudio. O fallback continua funcionando em navegadores sem `StereoPannerNode`.

O cache offline foi atualizado para `arena-fps-v8-p2`, garantindo que uma instalação existente busque os arquivos de combate novos.

### Validação do pacote 2

- `./test.sh`: aprovado, incluindo testes de panorama direita/esquerda e atenuação espacial.
- `node --check sw.js`: aprovado.
- `node --check` dos scripts: aprovado.
- O teste automatizado não pode confirmar fisicamente o som ou a renderização WebGL; a validação de áudio espacial em aparelho e de equilíbrio visual fica pendente de teste manual no navegador.
- Gamepad, diferenciação completa de papel das oito armas, cobertura/flanqueamento e objetivos alternativos permanecem no próximo pacote conforme `TODO.md`.

## Pacote 3 — Gamepad e diferenciação das oito armas (16/11/2026)

Foi adicionado suporte a gamepad sem remover teclado, mouse ou touch. O jogo lê o primeiro controle conectado usando deadzone redimensionada, analógico esquerdo para movimento e direito para olhar. O mapeamento padrão é: A para pular, B para dash, X para recarregar, Y para granada, LB/RB para trocar arma, LT para mirar, RT para atirar e Start para pausar. O disparo automático mantém o comportamento de segurar o gatilho, enquanto armas semiautomáticas disparam na borda de pressionamento.

As oito armas agora possuem papel nomeado, cor própria de impacto e nome curto consistente no HUD: Precisão, Versátil, Supressão, Impacto, Execução, Alto Dano, Perfuração e Área. O HUD exibe o papel da arma atual. A Espingarda empurra inimigos atingidos e a Metralhadora aplica um empurrão leve de supressão; o deslocamento respeita colisões do mapa. Todas as armas passaram a ter cor explícita para clarão e rastros, corrigindo também a dependência anterior de cor apenas na Railgun.

O cache offline foi atualizado para `arena-fps-v8-p3`. Foram ampliados os testes para verificar oito papéis únicos, cores válidas e o comportamento de impacto da Espingarda.

### Validação do pacote 3

- `./test.sh`: aprovado (`core tests: OK` e `syntax checks: OK`).
- `node --check sw.js`: aprovado.
- Foram verificadas as referências de gamepad, os oito papéis, cores, knockback e HUD.
- O suporte a gamepad foi validado por inspeção de mapeamento e sintaxe; a confirmação física depende de um controle conectado ao navegador.
- Remapeamento de botões, IA tática, objetivos alternativos e ondas temáticas continuam pendentes no `TODO.md`.

## Pacote 4 — IA e progressão de ondas (16/11/2026)

Os tipos de inimigo agora declaram sua função de comportamento: pressão para Soldados, flanqueamento para Corredores, âncora para Brutamontes, kite para Atiradores, rush para Kamikazes, guard para Escudeiros e support para Curandeiros. O A* existente continua sendo usado como base de navegação.

Corredores recebem um alvo lateral em torno do jogador e alternam o lado do flanqueamento em intervalos curtos, evitando que todos avancem pela mesma reta. Atiradores fazem deslocamento lateral quando estão na faixa de distância segura, além de manterem a lógica existente de aproximação/recuo. O deslocamento respeita as colisões do cenário e reutiliza a animação de pernas já existente.

A progressão foi organizada em perfis cíclicos: `ENXAME`, `FOGO CRUZADO`, `CAÇADORES`, `RUPTURA` e `SENHOR DA ARENA`. Cada perfil possui briefing visual, pesos de composição e ajuste de contagem. A vida recebe leve reforço em ondas de chefe e a velocidade um pequeno reforço em ondas de enxame. O spawn continua limitado por `MAX_ALIVE`, e a fila de introdução dos tipos especiais permanece preservada.

### Validação do pacote 4

- `./test.sh`: aprovado, incluindo perfis temáticos, contagem e composição ponderada de ondas.
- `node --check` dos scripts: aprovado.
- Os detalhes táticos e os novos sistemas de Operações, carreira e polimento estão documentados na seção Pacote 5 abaixo.


## Pacote 5 — IA tática, Operações, carreira e polimento (16/11/2026)

`script.js` passou a atribuir lados e slots de esquadrão em ciclos curtos. Corredores buscam alvos de flanco diferentes; atiradores recebem atraso escalonado para disparos coordenados; Escudeiros e Brutamontes podem priorizar a zona/terminal ativo. Unidades elegíveis com pouca vida avaliam posições ao redor de obstáculos e só consideram uma posição de cobertura quando ela realmente interrompe a linha de tiro do jogador. A navegação usa o A* e a colisão que já existiam. Os tipos expõem `cover`/`priority` como dados em `enemies.js`.

O menu oferece Sobrevivência e Operações, além de três níveis de dificuldade. A dificuldade ajusta HP e velocidade de inimigos, dano recebido e tamanho do spawn. Em Operações, cada segunda onda usa um tipo de missão em rotação: segurar E/USAR próximo de um terminal para invadir, visitar três relés em sequência ou manter controle de uma zona por tempo acumulado. Guardas/âncoras e hostis próximos contestam a posição; a invasão é mais lenta sob pressão. Concluir uma missão encerra a onda e remove os inimigos restantes como recuo, sem somar abates ou drops indevidos.

`progression.js` registra no navegador estatísticas de carreira, recordes por modo/dificuldade, desafios diários, conquistas e cinco paletas de HUD. As paletas alternativas são liberadas por onda, chefe, objetivos ou conclusão dos desafios. A opção de cosmético altera somente apresentação; não altera hitboxes, dano nem pontuação. Nenhum dado de carreira sai do dispositivo.

O acabamento inclui placas de armadura, insígnia e luzes de silhueta dos inimigos, inclinação corporal sutil em movimento, marcadores de missão 3D emissivos e efeito de ativação, painel de operação na HUD, painel de carreira, suporte contextual E/USAR/L3, skins de cor e dois sinais sonoros procedurais novos. O cache do service worker é `arena-fps-v8-p5` e inclui `tactics.js` e `progression.js`.

### Validação e limitações do pacote 5

- `./test.sh` e `node --check` dos scripts passam.
- O preview HTTP iniciou a partida com as preferências de Operações/Pesadelo salvas; a sessão começou na onda 1. Os objetivos começam na onda 2, mas não foram jogados manualmente durante esta checagem.
- Os testes automatizados verificam regras de missão, dificuldade, cobertura, distribuição de grupo, desafios, conquistas e recordes separados, mas não substituem playtest em ondas altas ou controle físico.
- Serviço remoto, publicação, placar online e remapeamento de gamepad não foram adicionados.

## Pacote 6 — Silhuetas e detalhes das armas (17/11/2026)

Os oito modelos de primeira pessoa foram redesenhados diretamente no construtor Three.js existente. Pistola recebeu ferrolho, cano, guarda-mato e empunhadura; Fuzil, coronha, trilho, guarda-mão e carregador; Metralhadora, caixa de munição, cano reforçado e corpo mais robusto; Escopeta, tubos duplos, bomba e cartuchos; Sniper, cano longo, luneta e bipé; Magnum, tambor de seis câmaras e cabo; Railgun, trilhos laterais e bobinas emissivas; Lança-granadas, tubo de boca larga e tambor.

Os modelos usam caixas, cilindros e anéis low-poly com paleta escura metálica e acentos emissivos por arma. Geometrias e materiais repetidos são compartilhados entre grupos para limitar alocações e custo. Permanecem intactos o clarão, a troca de arma, o recuo, a mira/zoom, as animações existentes, as estatísticas e o balanceamento. Não foram introduzidos modelos baixados, texturas ou dependências.

### Validação do pacote 6

- `./test.sh`: aprovado; `node --check` em todos os JavaScripts e no service worker: aprovado.
- Preview local abriu a partida e renderizou as novas formas da Pistola, do Fuzil e da Metralhadora. Esta conferência foi visual e curta; não é uma aprovação detalhada de equilíbrio nem uma validação manual das oito armas durante uma campanha.
- O service worker foi atualizado para `arena-fps-v8-p6`, para que instalações existentes busquem `script.js` e o restante dos arquivos atualizados.

## Pacote 7 — Resposta visual do arsenal (16/11/2026)

As oito armas agora declaram perfis cosméticos de clarão. Clarões procedurais usam estrela exterior, núcleo e duas lâminas luminosas, com proporção de precisão, dispersão, energia ou impacto conforme a arma. O jogo mostra um ressalto/janela de ejeção no lado do receptor e ejeta estojos de latão nas seis armas balísticas; cada estojo recebe impulso lateral, gravidade, quique discreto e rotação. Há limite de 24 estojos ativos e o pool é limpo ao reiniciar a partida. Railgun e lança-granadas não ejetam cartuchos balísticos.

Os rastros hitscan agora sobrepõem um halo na cor da arma e um núcleo claro. Impactos no cenário, inimigos, headshots e escudos produzem faíscas curtas em cores distintas. Projéteis hostis ganharam uma esfera difusa e aro orientado pelo vetor de movimento. Explosões/pulsos apresentam esfera e anel emissivo expansivos. Os efeitos reutilizam geometrias/materiais, limitam partículas e não mudam valores de dano, cadência, munição, alcance ou regras de acerto.

### Validação do pacote 7

- `./test.sh`: aprovado, incluindo verificações de perfis visuais distintos para as oito armas, presença de estojos balísticos e ausência de estojo na Railgun.
- `node --check` em todos os arquivos JavaScript: aprovado.
- Cache offline atualizado para `arena-fps-v8-p7`.
- Chromium headless local: menu e partida renderizaram; foi disparada a Pistola e observou-se redução de munição e estojo ejetado. A campanha com todas as armas e o teste físico em celular/gamepad permanecem pendentes.
- A comparação dos campos de combate de `weapons.js` com o ZIP de entrada confirma que dano, cadência, munição, alcance, dispersão, recarga, zoom e demais atributos foram preservados.

## Pacote 8 — Impactos, recarga e leitura da arena (16/11/2026)

Hits em paredes e obstáculos agora criam marcas geométricas rasas, orientadas pela normal da face, com fade e reutilização em pool (limite de 60 ativas); marcas e poeira são limpas em troca de mapa e reinício. Os blocos recebem tipo de superfície por cor/material do mapa: impactos metálicos lançam faíscas frias; pedra/concreto gera poeira e fragmentos minerais; madeira gera poeira e estilhaços quentes. Escudos conservam a leitura energética ciano.

Cada arma declara um perfil de recarga visual cosmético: ferrolho da Pistola/Fuzil, tampa de alimentação da Metralhadora, bomba que recua por cartucho na Escopeta, ação do Sniper, giro do tambor da Magnum, pulso das bobinas da Railgun e indexação do tambor do lança-granadas. As peças se movem durante a recarga existente e não alteram munição, duração, cadência ou dano. Inimigos inclinam corpo/cabeça brevemente ao sofrer impacto, escudos brilham/oscilam, e as eliminações deixam queda encolhida e fragmentos coloridos por papel; o chefe tem colapso maior e anel próprio.

As luzes de canto variam suavemente e faíscas ambientais surgem raramente perto das paredes, desativadas em qualidade baixa. A HUD usa a cor da arma na retícula, diferencia headshot e escudo no hitmarker e mostra percentual textual da recarga. Os efeitos usam pools e limites para evitar criação excessiva de objetos. O service worker mantém fallback para `index.html` apenas em navegações, sem devolver HTML em falhas de carregamento de recursos estáticos.

### Validação do pacote 8

- `./test.sh`, checagem de sintaxe de scripts e validação JSON do manifest: aprovados; o teste cobre os oito perfis cosméticos de recarga.
- Comparação automática de todos os campos de cada arma com o pacote 7, excluindo somente `visual`: idêntica (dano, cadência, pente, reserva, recarga, alcance, zoom, dispersão e outros campos de combate preservados).
- Chromium headless: menu/canvas e partida renderizaram; três disparos reduziram a munição da Pistola de 12 para 9; a ação de recarregar exibiu “RECARREGANDO · 20%”; sem exceções JavaScript durante o playtest.
- Inspeção do código confirma `MAX_SURFACE_MARKS = 60`, remoção por tempo, limpeza por reset/mapa, qualidade baixa sem faíscas de ambiente, respawn de rigs com transformações restauradas e fallback offline de navegação restrito. A campanha com todas as armas e o teste físico de toque/gamepad não foram executados.

## Pacote 9 — Mãos, materiais e recargas em etapas (17/11/2026)

Cada arma recebe um perfil cosmético de acabamento e pose de mãos. Os modelos low-poly agora incluem pares de antebraços e luvas táticas proporcionais às silhuetas, com costuras e protetores nas mãos; os grupos acompanham arma, balanço, recarga, troca e escopo. Materiais Phong com cache por acabamento dão brilhos distintos a aço acetinado, liga escovada, polímero, madeira, material oxidado, acabamento de precisão e cerâmica energética. Pequenas marcas geométricas de abrasão reforçam a leitura sem texturas externas. Geometrias repetidas e materiais das luvas são reutilizados.

As recargas encadeiam alcance das mãos e movimento de componentes: carregador se desloca e retorna na Pistola/Fuzil/Metralhadora, a tampa da Metralhadora abre, a Escopeta insere cartuchos por ciclo e movimenta a bomba, o Sniper exibe a ação do ferrolho e ejeção/reposição visual, a Magnum e o lança-granadas giram os tambores com cartuchos, e as bobinas da Railgun pulsam sequencialmente. Uma oscilação de repouso muito pequena e a troca em que a arma anterior baixa enquanto a nova sobe completam a apresentação. A fumaça dos disparos é temporária, agrupada no pool de efeitos e usa de um a três puffs por perfil.

### Validação do pacote 9

- `./test.sh`, sintaxe JavaScript/service worker e JSON do manifest: aprovados; os testes confirmam oito perfis únicos de acabamento/pose e quantidades limitadas de fumaça.
- Chromium headless: partida e luvas renderizadas; um disparo consumiu um cartucho; início de recarga mostrou “RECARREGANDO · 21%”; sem exceções JavaScript.
- Comparação automática de todos os campos de combate com o pacote 8, excluindo somente `visual`: idêntica. A campanha completa e inspeção manual de cada arma desbloqueada ainda não foram realizadas.
- Cache offline versionado como `arena-fps-v8-p9`.

## Pacote 10 — Recargas coreografadas e mãos articuladas (17/11/2026)

Cada um dos quatro dedos é composto por falange proximal e distal, com pivôs separados; o polegar também possui dois segmentos articuláveis. `poseGloveDigits()` move a falange distal em proporção à proximal, fecha os dedos da mão de suporte no alcance/manuseio e aplica o gatilho ao indicador mais próximo do polegar (dedo 3 na mão direita). A pose é restaurada explicitamente ao trocar de arma, evitando que uma mão antiga fique presa em uma animação interrompida.

`animateBoltCycle()` agora explicita o curso do ferrolho: após a reposição do carregador na Pistola/Fuzil, o conjunto recua no eixo local +Z (para a câmera), fica retido por uma pausa curta, retorna à câmara e recebe um pequeno assentamento. O Sniper reutiliza a mesma curva com curso maior e fases antecipadas, coordenadas com a ejeção/reposição visual do cartucho. O eixo/curso são cosméticos e normalizados pelo tempo de recarga já existente.

A Magnum usa dois pivôs encadeados: o yoke parte de uma dobradiça lateral e se abre para expor o cilindro; o tambor, as seis câmaras e os seis cartuchos permanecem filhos do mesmo conjunto. A trava se desloca, o yoke abre, o cilindro indexa 360° sobre Z, um movimento curto do extrator projeta os estojos para fora, e os cartuchos novos reaparecem e assentam individualmente, espaçados em sequência. Só depois o yoke fecha e a trava volta à posição, com o martelo acompanhando o fechamento. A recarga real, a contagem de munição e sua duração permanecem intocadas.

Também foi normalizado o formato dos descritores móveis de reload: agora as coleções, inclusive as três bobinas do Railgun, guardam referências ao mesh e ao transform inicial sem misturar malhas cruas com descritores nem duplicar a atualização. A troca durante recarga restaura a arma anterior antes de iniciar a transição.

### Validação do pacote 10

- `./test.sh`, `node --check` em `script.js`, `weapons.js` e `sw.js`, e JSON do manifest: aprovados.
- Playtest Chromium na cópia de diagnóstico: Pistola e Fuzil atingiram curso +Z do ferrolho depois da inserção do carregador; a Pistola também retornou à posição base. A Magnum abriu o yoke, girou o tambor, exibiu os cartuchos em sequência e fechou/retornou ao estado-base; Railgun animou a bobina. Um harness de pose confirmou em runtime que o gatilho flexiona o quarto dedo (indicador à direita) e que as falanges proximais/distais e as duas partes do polegar se movem; sem exceções JavaScript.
- Comparação automática dos campos de combate com o pacote 9, ignorando apenas `visual`: idêntica. Nenhuma arma, regra ou tempo de combate foi alterado.
- Cache offline versionado como `arena-fps-v8-p10`.

## Pacote 11 — Detalhes focados e assinatura visual do disparo (17/11/2026)

`buildGun()` enriquece pontos próximos da câmera sem mudar as silhuetas existentes: a Pistola recebe mira frontal/traseira, serrilhas de ferrolho dos dois lados e ranhuras no carregador; o Fuzil ganha alças alinhadas e recortes de trilho; a Metralhadora recebe aberturas laterais e ranhuras na tampa; a Escopeta recebe abraçadeiras dos canos, massa de mira e nervuras na bomba; o Sniper ganha aros/lentes, torres de ajuste e sapatas do bipé; a Magnum recebe aro/eixo solidários ao tambor e quadriculado no cabo; a Railgun recebe suportes de bobinas e janela de carga; o lança-granadas recebe aro e janelas que giram com o tambor. Ferragens usam os caches geométricos/materiais existentes e não geram trabalho por disparo.

`weapons.js` declara `visual.shot` com impulso, elevação, rolagem e recuperação por arma. `tryShoot()` aplica esses valores apenas às variáveis visuais do `holder` (arma e luvas): Fuzil/Metralhadora mantêm perfil controlado, Escopeta/Sniper/Magnum/lançador mostram movimento maior e cada arma recupera à sua taxa. O recoil de combate já existente continua sendo aplicado separadamente por `w.recoil`; o perfil cosmético não altera pitch/yaw, dispersão, raios, dano ou cadência. A Railgun usa ainda `coilPulse` para intensificar e expandir levemente os emissores por um instante, decaindo em seguida; o impulso `view*`, o pulso e os transforms/emissividade das bobinas são restaurados ao trocar de arma ou iniciar recarga.

### Validação do pacote 11

- `./test.sh`, `node --check` em `script.js`, `weapons.js` e `sw.js`, e validação JSON do manifest: aprovados. A suíte fixa em baseline os atributos de combate das oito armas, testa os limites dos perfis `visual.shot` e verifica que a recarga zera o impulso visual e restaura o pulso/transform dos emissores da Railgun.
- Playtest Chromium headless dos modelos Pistola, Escopeta, Magnum e Railgun: sem exceções JavaScript; detalhe geométrico visível em primeira pessoa. Para esses quatro disparos, a variação de pitch da câmera foi exatamente `w.recoil * 0.03`, confirmando que o impulso cosmético não substitui o recoil real. Capturas: `/home/ubuntu/arena-fps-p11-w3.png` e `/home/ubuntu/arena-fps-p11-w6.png`.
- Cache offline versionado como `arena-fps-v8-p11`; comparação automática dos campos de combate com o p10, ignorando somente `visual`, idêntica em todas as oito armas.

## Pacote 12 — Polimento recebido (17/11/2026)

A atualização p12 fornecida melhora a leitura das mãos com pontas arredondadas/reforçadas, costuras, punhos, detalhe de pele e acessório no pulso esquerdo. O viewmodel agora atrasa suavemente ao olhar, inclina no strafe e afunda no pouso; o clarão recebe brilho radial, jato lateral, variação curta de escala e luz colorida por arma, com preenchimento quente/frio nas mãos e no modelo. A cópia de trabalho versiona o cache como `arena-fps-v8-p12`; o ZIP recebido permaneceu intacto.

## Pacote 13 — Calor, estojos e explosões em camadas (17/11/2026)

O calor da Metralhadora é somente visual: `tryShoot()` aumenta `machineGunHeat` em cada tiro válido da arma índice 2; o update reduz o valor continuamente e usa-o para misturar a cor de base com um tom incandescente e elevar a emissividade do cano/colares. Os materiais dessas partes são clones locais, não os materiais Phong compartilhados por outras armas. Não há limite funcional, penalidade, bloqueio, dano ou alteração de cadência; o estado volta a zero ao reiniciar a partida.

`updateCasings()` emite `sfx.casing(x,z,impact)` somente na primeira colisão descendente suficientemente rápida de cada estojo. O evento usa o panner do sistema de áudio existente, volume baixo e um limitador global de 45 ms; sem contexto Web Audio ativado não cria nós. Os estojos continuam com a mesma física e duração.

Explosões de dano recebem uma camada esférica curta de fogo no pool de blast atual, preservam o anel/núcleo, emitem 2 puffs de fumaça na qualidade baixa ou até 5 nas demais qualidades pelo pool existente, e acendem uma única PointLight compartilhada por 0,22 s. Há um teto de quatro explosões visuais simultâneas em qualidade baixa e oito nas demais; a qualidade baixa também omite fogo/luz. O tremor, a física, o raio, os parâmetros de dano e a lógica de detonação existentes não foram modificados.

### Validação do pacote 13

- `./test.sh`, `node --check` em `script.js`, `audio.js`, `weapons.js` e `sw.js`, e validação JSON do manifest: aprovados. O teste de áudio confirma que `sfx.casing` existe e é seguro quando ainda não há contexto Web Audio.
- `weapons.js` é byte a byte idêntico ao p12; a suíte também mantém snapshots de combate para as oito armas. Não foram alterados dano, cadência, dispersão, alcance, munição, recuo real ou raio de explosão.
- Chromium headless capturou o menu inicial em 1280×720, e a prévia p13 respondeu HTTP 200. Recomenda-se testar no navegador o brilho térmico em rajada longa, o volume do clique e a leitura da explosão; a captura inicial não substitui esse playtest subjetivo.
- Cache offline versionado como `arena-fps-v8-p13`.

## Pacote 14 — Gráficos industriais detalhados (17/11/2026)

O p13 foi mantido como base e recebeu a primeira camada de implementação da concept art aprovada. Os materiais dos obstáculos deixaram de ser cores lisas: agora são `MeshStandardMaterial` locais com `CanvasTexture` procedural, ruído, juntas, fissuras/veios, relevo por bump, roughness e metalness diferentes para metal, madeira e pedra/concreto. Nenhuma textura externa foi adicionada.

O piso das arenas recebeu juntas, manchas e desgaste procedurais, com bump mínimo sincronizado à troca de mapa. Cada obstáculo mantém exatamente a mesma caixa de colisão e o mesmo mesh de raycast principal, mas ganha bordas estruturais, painel frontal e barra emissiva visual; esses detalhes são removidos junto com o mapa e não entram em `solids`.

As três arenas agora exibem identidade temática na transição: `CONCRETO // SETOR 07`, `DOCA // CHUVA ÂMBAR` e `PLANTA // NÚCLEO CIANO`. O cache foi versionado para `arena-fps-v8-p14`.

### Validação do pacote 14

- A implementação preserva armas, inimigos, objetivos, cobertura, carreira e regras de combate do p13.
- A próxima validação deve confirmar `./test.sh`, sintaxe JavaScript, carregamento HTTP e renderização no navegador.
- O impacto de FPS em baixa/média/alta ainda não foi medido após a adição de detalhes; props maiores, tubulações, cabos, inimigos e materiais de armas ficam para etapas seguintes.
