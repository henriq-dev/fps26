# Plano de evolução — Arena FPS v8 · Pacote 15

## Direção

Preservar o motor Three.js clássico, o HUD Neon Rebellion, o loop de arena e a distribuição offline. O piloto p14 introduz um acabamento sci-fi industrial semi-realista apenas no Fuzil, nas mãos ligadas a ele e na primeira arena; as outras sete armas e demais arenas permanecem como comparação. Materiais e texturas são gerados proceduralmente em Canvas, sem baixar assets; a simulação continua autoritativa no `script.js` e regras de combate não mudam.

### Extensão visual do piloto

Usar superfícies metálicas escovadas, polímero fosco, tecido técnico e concreto pintado, com variação de rugosidade, micro-risco, costura e desgaste discreto; manter a paleta do cenário mais neutra e deixar ciano/âmbar como acentos de leitura. A forma do Fuzil ganha peças tubulares mais suaves, carcaças sobrepostas, trilho, ferragens e mira ótica compacta sem alterar seu envelope de primeira pessoa ou os pontos de animação/recarga. A arena inicial recebe textura de placas, piso industrial e acabamento de paredes sobre a geometria e os pontos de colisão já existentes. Não habilitar sombras dinâmicas ou pós-processamento; preservar o teto de pixel ratio e gerar cada textura uma vez para reutilização.

## Estado consolidado

- **Pacote 1 — Fundação:** Three.js local, PWA/cache offline versionado, metadados e testes Node sem dependências externas.
- **Pacote 2 — Combate:** oito papéis de armas, feedback visual/sonoro, áudio espacial e gamepad padrão.
- **Pacote 3 — IA e ondas:** perfis temáticos, papéis de inimigo, navegação A* existente, cobertura sob fogo, flanqueamento em esquadrão e coordenação de disparos/prioridade.
- **Pacote 4 — Progressão:** recordes isolados por modo e dificuldade; carreira local, estatísticas, desafios diários, conquistas e cosméticos por desbloqueio.
- **Pacote 5 — Operações e polimento:** modo de objetivos alternativos além da eliminação, controles contextuais, apresentação visual e feedback de missão.
- **Pacote 6 — Arsenal em primeira pessoa:** oito modelos low-poly procedurais com silhuetas e detalhes próprios, materiais/geometrias compartilhados e nenhuma mudança nas regras de combate.
- **Pacote 7 — Resposta visual do arsenal:** clarões por família de arma, rastros em núcleo/halo, estojos ejetados com pool limitado, faíscas de impacto e projéteis/explosões com aura e anel.
- **Pacote 8 — Detalhes de combate:** decalques temporários em paredes, impactos classificados por material, recarga animada por arma, reações e quedas inimigas, pulso ambiental e HUD contextual.
- **Pacote 9 — Apresentação do arsenal:** mãos/luvas low-poly por arma, materiais com acabamentos distintos, recargas em etapas articuladas, pose de espera/troca e fumaça sutil após disparos; nenhum equipamento ou atributo de combate novo.
- **Pacote 10 — Coreografia de recarga e mãos articuladas:** falanges proximais/distais e polegares com pivôs independentes; ferrolho recua, segura e fecha após a substituição do carregador; a Magnum solta a trava, articula o yoke, gira o tambor e anima a troca/assentamento das seis munições, então trava novamente.
- **Pacote 11 — Detalhes focados e assinatura do disparo:** realce procedural de mira, trilho, guarda-mato, boca do cano, carregador e laterais do receptor; cada arma recebe impulso, elevação e rolagem apenas no modelo em primeira pessoa, com breve pós-brilho das bobinas da Railgun.
- **Pacote 12 — Polimento recebido:** pontas arredondadas/reforçadas nas luvas, materiais mais visíveis, inércia do viewmodel ao olhar/andar/pousar e clarão radial com jato lateral; cache offline versionado para p12.
- **Pacote 13 — Calor, estojos e explosões:** aquecimento emissivo cosmético da Metralhadora durante rajadas e resfriamento em repouso; som metálico procedural, baixo e espacializado no contato de estojos com o piso; explosões com núcleo/fogo, anel, fumaça e um clarão de luz compartilhado. Efeitos limitados/reutilizados, sem alterar combate.
- **Pacote 14 — Piloto industrial semi-realista:** Fuzil e mãos com superfícies PBR procedurais e detalhes de fabricação, mais uma arena inicial com materiais industriais; HUD, silhuetas/posições de combate e valores do jogo preservados. Escopo experimental localizado para comparar com o restante do estilo atual.
- **Pacote 15 — Telemetria e cenário anti-travamento:** modo de diagnóstico opt-in por `?perf=1`, com buffer circular pré-alocado e atualização visual limitada; registra frametime, custo CPU de `update`/submissão de `render`, draw calls, triângulos, contagens de entidades, qualidade/resolução e chamadas/duração de A*. Um cenário de estresse reproduzível no Hangar usa composição e posições fixas, sem registrar progresso nem alterar regras fora do modo de diagnóstico. Nenhuma telemetria é enviada pela rede.

## Comportamento das Operações

A Sobrevivência mantém a condição normal de limpar a onda. Em Operações, ondas pares alternam entre três objetivos independentes: invadir um terminal mantendo E (ou USAR no toque), ativar três relés em sequência, ou controlar uma zona por tempo acumulado. Inimigos próximos contestam a zona ou reduzem a velocidade da invasão. Ao cumprir o objetivo, a onda termina mesmo havendo hostis restantes: eles recuam sem contar como abates nem conceder recompensas.

## Tática de esquadrão

`TYPES` declara se o papel é apto a buscar cobertura e qual prioridade tática usa. Unidades feridas aptas procuram posições fora da linha de tiro do jogador em torno de obstáculos. Corredores são distribuídos entre os dois flancos por posição no esquadrão, evitando convergência na mesma rota. Atiradores escalonam salvas. Escudeiros/âncoras tendem a contestar o objetivo ativo; o A* e os testes de colisão existentes continuam a guiar a navegação.

## Progressão local

`progression.js` mantém somente dados locais no navegador (`localStorage`): totais de carreira, melhor onda, combo, objetivos, chefes, desafios do dia, conquistas, cosmético selecionado e recordes por par modo/dificuldade. Não há login, placar online ou envio de dados. A migração automática aceita perfil ausente/corrompido como estado novo. As skins alteram a paleta do HUD/retícula e não a simulação.

## Módulos e responsabilidades

- `index.html`: ordem dos módulos, acessibilidade do HUD, escolhas de partida e painel da carreira.
- `script.js`: simulação, interação com objetivos, HUD, preferências e aplicação dos eventos de carreira.
- `script.js` também constrói o arsenal de câmera em componentes geométricos reutilizáveis: corpo, cano, mira, coronha, carregador, luneta, tambor, janela de ejeção, mãos, ferragens e peças móveis de recarga. A resposta visual ao tiro move somente o `holder` das armas/mãos e não substitui o recuo/espalhamento de combate. Pools limitados apresentam clarões, fumaça, rastros, marcas de bala, poeira, faíscas, estojos, projéteis e explosões em camadas; o calor da Metralhadora só altera material emissivo. No p14, `script.js` ativa mapas PBR procedurais apenas para o Fuzil, suas mãos e superfícies da arena com perfil industrial.
- `industrial-materials.js`: biblioteca de mapas Canvas de cor, rugosidade e relevo, gerados uma vez por perfil de material, seed estável e sem assets/dependências externos.
- `perf-telemetry.js`: buffer circular fixo, quantis de frametime e exportação CSV; só é instanciado quando a URL contém `?perf=1`.
- `weapons.js` mantém os mesmos parâmetros de combate e declara `visual` para clarão, material, pose de mãos, estágios de recarga, tipo/ponto de saída dos estojos e perfil de resposta visual ao disparo; essas propriedades são cosméticas.
- `tactics.js`: funções puras para dificuldade, calendário de objetivos, flancos, atribuições de esquadrão e escolha de cobertura.
- `progression.js`: persistência local e regras de desafios, conquistas, recordes e cosméticos.
- `enemies.js`: papéis declarativos, aptidão para cobertura e prioridades.
- `maps.js`: arenas, blocos, paletas e o marcador visual que ativa o perfil industrial somente no mapa piloto.
- `audio.js`: eventos sonoros procedurais de missão/conquista e cliques de estojo espacializados, mantendo o áudio procedural existente.
- `style.css`: UI responsiva, carreira, objetivos e temas cosméticos.
- `tests/core.test.js`: testes puros determinísticos; `sw.js` versiona os novos módulos para uso offline.

## Critérios de validação

1. `./test.sh` e `node --check` em todos os scripts aprovados.
2. Testar chave da missão por modo/onda, perfis de dificuldade, alternância dos flancos, cobertura que realmente oculta a linha de visão e atraso de salva.
3. Testar carreira com storage falso: desafios, desbloqueios e reabertura do perfil; verificar que recordes de combinações distintas nunca se cruzam.
4. Servir o jogo por HTTP, abrir o menu e iniciar uma partida. Validar em navegador o canvas, os controles e os seletores; testes de playtest em ondas altas e dispositivo físico ficam como limitação quando não realizados. Para o p14, a captura Chromium confirma o Hangar e o Fuzil, mas não substitui teste manual de tiro/recarga nem benchmark em celular.
5. No p15, executar `?perf=1` em cenário fixo por pelo menos 60 s em qualidade/resolução documentadas; comparar p50/p95/p99, CPU de atualização/render, draw calls e contadores de A*. Registrar que `render` é tempo CPU de submissão, não medição concluída de GPU; não inferir FPS de aparelho físico a partir do headless.
6. Não publicar ou conectar serviços externos sem pedido explícito.

## Pacote 7 — Impacto, clarões e ejeção

Manter os modelos e o combate existentes, acrescentando camadas de clarão geométrico por família de arma, rastros com núcleo/halo, faíscas coloridas em acertos, estojos balísticos de vida curta, aura em projéteis inimigos e anéis de expansão em explosões. Os estojos e partículas devem usar geometrias/materiais reutilizáveis, limites ativos e atualização simples; a Railgun não ejeta estojo e o lança-granadas continua sem estojo balístico. Não alterar dano, munição, cadência, alcance ou condições de vitória. Versionar cache offline e validar testes de núcleo/sintaxe; inspeção de renderização física permanece sujeita a playtest no navegador.

## Pacote 8 — Impacto, recarga e apresentação de combate

Criar marcas planas de bala aderidas à face atingida de paredes/obstáculos, com pool reutilizável, opacidade decrescente, duração limitada e limpeza na troca de arena/reinício. Identificar pedra/concreto, madeira e metal pelos metadados de superfície do mapa; poeira e fragmentos acompanham as superfícies minerais/madeira e faíscas/fragmentos frios acompanham metal; escudos mantêm resposta de energia ciano. A recarga deve animar partes próprias da Pistola/Fuzil, Metralhadora, Escopeta, Sniper, Magnum, Railgun e lança-granadas, sem acelerar ou alterar a recarga real. Dano imprime reação breve no corpo/cabeça/escudo; eliminações usam dissolução/queda curta e efeito de cor por papel, com encerramento mais forte do chefe. Luzes de canto pulsam moderadamente e faíscas ambientais raras são suprimidas em qualidade baixa. HUD retém retícula codificada pela cor da arma, hitmarker específico de headshot/escudo e percentual/etiqueta de recarga. Limitar e reutilizar efeitos e não mudar dano, precisão, munição, cadência, IA ou condições de vitória.

## Pacote 9 — Mãos, materiais e recargas em etapas

Enriquecer a apresentação em primeira pessoa das oito armas existentes. Anexar mãos/luvas low-poly e antebraços ao suporte da câmera, com posicionamento adaptado ao comprimento e ao tipo de cada arma; manter a mira, o escopo, a visibilidade dos alvos e a área de controles/HUD livres. Distinguir metal, polímero, borracha, madeira e energia por materiais, brilho, painéis e desgaste geométrico sutil, reutilizando geometrias/materiais e sem texturas remotas. Transformar as recargas já existentes em sequências legíveis: mão alcança o mecanismo, componente/cartucho se desloca, reposição e retorno; cartuchos individuais da Escopeta acompanham seu tempo real, enquanto ferrolho, tampa, tambor e bobinas mantêm os perfis específicos. Acrescentar pose de repouso/troca suave e um rastro curto de fumaça no cano após disparos, com pools e duração limitada. Não introduzir armas/projéteis novos nem alterar munição, dano, precisão, cadência, alcance, zoom ou duração das recargas.

## Pacote 10 — Dedos articulados e recargas coreografadas

Acrescentar falanges/polegares simples como pivôs low-poly reutilizáveis às luvas atuais, com pequenas poses de aperto no gatilho, alcance, sustentação e retorno. Dar às recargas fases visualmente separadas, sincronizadas ao progresso já existente e interrompíveis nas mesmas condições atuais. No ferrolho: liberar a trava, puxar a peça em +Z (em direção à câmera), sustentar brevemente, ejetar/mostrar cartucho quando aplicável e devolver/assentar o conjunto; coordenar isso depois da entrada do carregador na Pistola/Fuzil e com a ação própria do Sniper. Na Magnum: destravar o ressalto, girar o yoke em torno do pivô lateral para expor o tambor, indexar o tambor ao redor do seu eixo Z, ejetar e assentar seis munições sequencialmente, fechar e reencaixar a trava. A geometria de tambor, câmaras e cartuchos permanece no mesmo grupo/pivô para que o movimento seja coerente. Não mudar atributos de combate nem tempos de recarga; corrigir os perfis de peças móveis para que todos os componentes do Railgun também sejam restaurados/animados como descritores, sem duplicação.

## Pacote 11 — Detalhes focados e assinatura visual do disparo

Continuar com as oito armas atuais, sem criar armas, tipos de projétil ou regras. Dar prioridade às áreas legíveis no enquadramento de primeira pessoa — mira, trilhos/ranhuras, guarda-mato, boca do cano, carregador, receptor e laterais — com pontos de fixação, parafusos, painéis, texturas geométricas de empunhadura e ressaltos próprios de cada silhueta. Incluir detalhes característicos de cada família (ex.: miras e serrilhas da Pistola/Fuzil; reforços e alimentação da Metralhadora; anéis e bomba da Escopeta; torres/apoios da luneta do Sniper; ferragens do yoke da Magnum; suportes de bobina da Railgun; janelas do tambor do lança-granadas). Reutilizar geometrias e materiais existentes, sem baixar texturas externas nem encobrir alvos, mira, HUD ou controles.

Declarar em `weapons.js` um perfil exclusivamente cosmético de impulso, elevação, rolagem e recuperação por arma. Aplicá-lo só ao `holder` da arma/mãos, independente dos campos reais `recoil`, `spread`, `rate`, `range`, `dmg` e munição: Escopeta/Sniper/Magnum/lançador podem ter movimento visível mais forte; Fuzil/Metralhadora ficam controlados; a Railgun ganha breve pulso residual e decrescente nas bobinas após o disparo. O efeito não altera a câmera/mira nem o vetor, dispersão, dano ou cadência do tiro. Manter grupos e materiais cacheados para a adição geométrica, sem criar meshes por disparo; limpar/restaurar o pulso ao trocar de arma ou recarregar.

## Pacote 13 — Calor de cano, estojos e explosões em camadas

Continuar com os mesmos modelos, armas e projéteis. Na Metralhadora, somar calor apenas em `tryShoot()` e reduzir o valor continuamente quando não está disparando; mapear o resultado a emissividade/cor das partes metálicas e aberturas de ventilação do modelo, com material isolado da paleta compartilhada. Não aplicar superaquecimento, penalidade, dano, cadência, dispersão ou limite funcional. Para estojos, emitir som procedural metálico curto apenas quando há colisão descendente real com o piso, espacializado por posição/distância e limitado por estojo/volume para evitar ruído em rajada; não criar áudio até a interação iniciar o contexto Web Audio.

Ampliar o pool de explosões com uma camada curta de fogo, o anel já existente, fumaça do pool comum e uma única luz de clarão compartilhada com duração curta. Limitar explosões visuais simultâneas a 4 em qualidade baixa e 8 nas demais; em qualidade baixa, omitir fogo/luz e reduzir fumaça a no máximo 2 puffs. Reutilizar geometrias/materiais. A apresentação preserva o `R`, o dano em área, a física, o tremor atual, as regras de jogo e a distribuição offline; versionar o cache e manter o restante do áudio/IA inalterado.

## Pacote 14 — Piloto industrial semi-realista

Aplicar o novo tratamento visual somente ao Fuzil existente (índice 1), ao par de mãos que acompanha essa arma e à arena inicial (mapa 0). Substituir no rifle a leitura de blocos low-poly por componentes mais bem definidos — receptor dividido, coronha e soleira, guarda-mão ventilado, cano e ferragens suavizados, trilho, mira, parafusos e carregador com canais — preservando encaixe da recarga, posição da boca do cano, alcance do modelo em primeira pessoa e visibilidade da retícula/alvos. Usar materiais PBR com variação procedural de metal escovado, polímero fosco e tecido/borracha nas mãos, micro-riscos, rugosidade e costuras sutis; texturas geradas localmente e compartilhadas, sem baixar imagens ou adicionar dependências.

No mapa 0, trocar apenas paleta, materiais e leitura superficial para concreto/painéis metálicos industriais, piso com placas e marcações de segurança, e poucos detalhes de perímetro. Preservar a disposição de blocos, dimensões, caixas de colisão, navegação e linhas de tiro. Manter HUD, menus, controles, câmera, regras, stats e efeitos atuais; as outras sete armas e mapas continuam no estilo/materialização p13. Sem sombras dinâmicas, pós-processamento ou aumento do pixel ratio. Versionar cache offline p14 e fornecer uma prévia para comparar o rifle e a arena.

## Próximo passo opcional

Playtest humano em dificuldade Recruta/Veterano/Pesadelo para calibrar cadência de cobertura, contestações de objetivo e duração de missão; seguir com remapeamento de gamepad apenas se for solicitado. Não é necessário adicionar backend, leaderboard online nem novos mapas para esta etapa.


## Validação P15 — diagnóstico (17/11/2026)

A suíte de núcleo/sintaxe passou. Em Chromium headless com SwiftShader, 1280 × 720 e 60 s de cenário, foram capturados 426 frames: p50/p95/p99 do intervalo 133,4/166,7/483,4 ms; `update` média/p95 0,98/1,5 ms; `render-submit` média/p95 8,45/31,4 ms. O último frame tinha 219 draw calls, 7.824 triângulos e 12 inimigos. Isso é uma medição de sandbox/software renderer, não um benchmark de celular; como próximo passo, coletar `?perf=1` no aparelho/browser-alvo e só então priorizar otimizações de renderização.
