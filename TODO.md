# TODO — Arena FPS v8 · Pacote 23

## Pacote 23 — Interface hacker NEXUS `[~]`

- [x] Definir identidade visual local `NEXUS // OPERATIONS CONSOLE`.
- [x] Criar estação visual com perfil de nó, integridade, risco, link e modo offline.
- [x] Criar topologia de rede animada em Canvas com grade, links, pulsos, núcleo e fluxo de pacote.
- [x] Criar cartões de operações e manter seleção por mouse, toque, teclado e Enter.
- [x] Adicionar console de logs fictícios com sequência de conexão e resultado.
- [x] Adicionar scanline, glitch/grade sutil, pulsos e barras de estado.
- [x] Reforçar visualmente que não há rede externa, comando real ou sistema operacional acessado.
- [x] Preservar acessibilidade, contraste, responsividade mobile e `prefers-reduced-motion`.
- [ ] Integrar uma tela NEXUS menor diretamente aos monitores físicos dos consoles.
- [ ] Criar vocabulário visual específico por tipo de terminal (`LINK_NODE`, `TRACE_ROUTE`, etc.).
- [ ] Fazer playtest humano do fluxo completo nos três prédios.

## Pacote 22 — Interação física em primeira pessoa

- [x] Prompt contextual por proximidade e linha de visão: `E · OPERAR TERMINAL`.
- [x] Operação contínua segurando E/USAR, preservando a regra fictícia existente.
- [x] Aproximação suave da câmera, centralização no monitor e redução de movimento durante a operação.
- [x] Estados do terminal reagem ao início da operação e ao progresso.
- [x] Cancelamento por dano, afastamento, perda de linha de visão, morte e terminal indisponível.
- [x] Inimigos continuam ativos e podem contestar a posição durante a invasão.
- [x] Feedback de cancelamento e bloqueio até soltar E antes de tentar novamente.
- [x] Cache offline versionado para `arena-fps-v8-p22-buildings`.
- [ ] Fazer playtest humano completo em desktop e toque.
- [ ] Validar operação nos três terminais em Baixa, Média e Alta.

## Mescla seletiva p21 — três prédios na Incursão

- [x] Incorporar Complexo, Refinaria e Laboratório ao seletor da Incursão.
- [x] Adaptar terminais, saídas, dicas, spawns e temas por prédio.
- [x] Preservar terminais físicos p22 e remover telas simples duplicadas da p21.
- [x] Preservar prompt, câmera, cancelamento, combate, IA e colisões p22.
- [x] Expandir testes de caminhos, centro livre e spawns para os três prédios.
- [ ] Validar playtest humano e legibilidade dos consoles nos três prédios.

## Pacote 21 — Terminais físicos detalhados

- [x] Criar gerador compartilhado de gabinetes, racks, monitores, LEDs, cabos e detalhes.
- [x] Criar Console KVM físico.
- [x] Criar Console de Rede físico.
- [x] Criar Console Central do Datacenter físico.
- [x] Integrar props em `mapMeshes` sem alterar colisão, A* ou combate.
- [x] Ligar estados visuais de espera, detecção, invasão, comprometimento e alarme.
- [x] Adicionar `terminal-props.js` ao HTML, testes e cache offline p21.
- [ ] Validar legibilidade dos três terminais nas qualidades Baixa, Média e Alta.
- [ ] Iniciar Pacote 22: interação física em primeira pessoa.

## Pacote 20

- [x] Modo Incursão: mapa Complexo, terminais, 4 setores, escolhas, alarme, fuga, vitória
- [x] Drone (F)
- [ ] Testar no aparelho: `index.html?perf=1` e jogar a Incursão
- [ ] Próximo: portas animadas, torretas/câmeras como objetos, segundo bloco (mapa A–E), drone em 3D


## Pacote 19

- [x] floorTint por mapa
- [x] Modo Baixo leve (Lambert, sem PBR, sem luzes extras)
- [x] Resolução adaptativa no PC (desce rápido, sobe devagar)
- [x] GPU/canvas/flags no painel e CSV
- [x] Interruptores por URL
- [x] Documentação P1–P19
- [ ] Rodar 6 testes de 15 s no aparelho real e enviar os CSV
- [ ] Ideia futura (P20+): terminais/invasão fictícia — ver IDEIAS-FUTURAS.md



## Pacote 18 — Híbrido de fluidez

- [x] Preservar materiais ambientais albedo-only do P17, PBR completo do Fuzil/mãos e cache de céu por cor/paleta; não incluir texturas externas.
- [x] Restaurar pré-aquecimento de shaders, geometrias e texturas antes do menu/partida e após cada troca de arena, executando a troca enquanto a transição/banner está ativo.
- [x] Manter a luz de explosão na contagem de luzes desde o começo; animar apenas intensidade/posição e não alterar sua visibilidade no pulso/expiração, para evitar recompilações de shader.
- [x] Compartilhar geometria da antena e materiais básicos de badge/beacon entre rigs; manter pooling e estados individuais necessários.
- [x] Não mudar balanceamento, conteúdo de combate, IA, movimento, colisões, layout, limite de efeitos nem a resolução adaptativa do P17; recuperação gradual de resolução fica para etapa posterior.
- [x] Versionar service worker, painel e CSV para P18; manter `?perf=1` opt-in e fluxo normal sem painel.
- [x] Validar testes de núcleo/sintaxe, inicialização, pré-aquecimento, pulso de explosão e repetição de troca entre as três arenas sem crescimento repetido de geometria/texturas.

**Validação P18:** testes passaram. No Chromium/SwiftShader, um pré-aquecimento inicial e um por troca foram observados; a tabela do renderer reportou 11 programas após o warm-up e permaneceu em 11 após pulso de explosão. Ao visitar seis vezes as três arenas, a contagem de geometrias ficou em 62; após a primeira alocação de sky/material por paleta, texturas estabilizaram em 9 no menu do ensaio. Cenário `?perf=1`: 12 inimigos, sem erros JS. Teste transitório expôs referências para telemetria de execução, mas essa instrumentação não foi incorporada aos arquivos entregues. Não houve benchmark P18 de frametime comparável nem medição em GPU/celular físico; o custo inicial/transição do warm-up ainda deve ser aferido no aparelho-alvo.


## Pacote 1 — Fundação de release

- [x] Three.js local, sem CDN durante a partida.
- [x] Manifest, service worker, ícone vetorial e cache versionado dos recursos críticos.
- [x] Service worker limitado a GET de mesma origem e limpeza de caches antigos.
- [x] Testes Node sem dependências externas para armas, inimigos, perks, mapas e pathfinding.
- [x] Metadados de instalação, labels e descrições para controles principais.

## Pacote 2 — Combate e feedback

- [x] Oito armas com papéis, cores de impacto e leitura no HUD; empurrão contextual para Espingarda/Metralhadora.
- [x] Sinais de áudio distintos para corpo/headshot, escudo, disparos e explosões com espacialização.
- [x] Flash emissivo, faíscas e sobrecarga da Railgun contra escudos.
- [x] Gamepad com analógicos, RT/LT, LB/RB, A/B/X/Y, Start e L3 para interagir.
- [ ] Remapeamento de controles de gamepad no menu (pendência deliberadamente fora desta continuação).

## Pacote 3 — IA, tática e ondas

- [x] Papéis declarativos: pressão, flank, anchor, kite, rush, guard e support.
- [x] Inimigos elegíveis e feridos avaliam cobertura que quebra a linha de tiro do jogador.
- [x] Corredores atribuídos a flancos alternados por esquadrão, com alvo lateral distinto.
- [x] Atiradores escalonam disparos por slot de grupo; guardas/âncoras priorizam contestar objetivos ativos.
- [x] A* existente e colisões permanecem na navegação, sem substituir o sistema de caminho.
- [x] Perfis temáticos e contagem de ondas preservados.
- [x] Testes cobrindo dificuldade, atribuição de flanco, fogo escalonado e cobertura com linha de visão interrompida.

## Pacote 4 — Operações e progressão

- [x] Sobrevivência mantém limpeza de onda; Operações oferece condições alternativas de vitória.
- [x] Onda de terminal: segurar E/USAR próximo para concluir a invasão.
- [x] Onda de relés: aproximar-se e interagir com três terminais em sequência.
- [x] Onda de zona: manter a área sob controle por tempo acumulado; inimigos contestam/interrompem.
- [x] Concluir missão encerra a onda e faz hostis restantes recuarem sem falsos abates/recompensas.
- [x] Ajustes de dificuldade escalonam pontos de vida, velocidade, dano e volume de spawn.
- [x] Carreira local com desafios diários, estatísticas, conquistas e skins cosméticas desbloqueáveis.
- [x] Recordes separados pela combinação de modo e dificuldade.
- [x] UI de missão, interação por teclado/toque/gamepad, e estado persistido localmente sem backend.
- [x] Testes cobrindo missões por onda, persistência, conquistas, cosméticos e isolamento de recordes.

## Pacote 5 — Polimento

- [x] Silhuetas low-poly enriquecidas com placas de armadura, insígnia e antena luminosa.
- [x] Animação corporal sutil de movimento junto às animações de pernas existentes.
- [x] Marcadores 3D emissivos para terminais/relés/zona e efeito de ativação.
- [x] Menu de carreira, estados desbloqueados, feedback de missão/conquista e seletor de paletas.
- [x] Áudio procedural curto para avanço de missão e conquista.
- [x] Cache offline atualizado para incluir `tactics.js` e `progression.js`.

## Limites desta entrega

- Os recordes são locais ao navegador; não há sincronização ou placar online.
- O remapeamento de controles não foi adicionado. Playtest completo de equilíbrio em ondas altas e verificação física de gamepad/touch devem ocorrer em dispositivo real.

## Pacote 6 — Silhuetas e detalhes das armas

- [x] Substituir os oito modelos simplificados por silhuetas procedurais 3D distintivas, mantendo a perspectiva de primeira pessoa low-poly/neon.
- [x] Distinguir os papéis por forma: pistola compacta; fuzil com coronha e trilho; metralhadora robusta com caixa de munição; escopeta de tubos duplos; sniper longo com luneta e bipé; Magnum com tambor e cabo; Railgun com trilhos/bobinas; lança-granadas com tubo largo e tambor.
- [x] Acrescentar detalhes geométricos de metal, empunhadura, miras, cartuchos, ranhuras, anéis e parafusos sem texturas ou downloads externos.
- [x] Reutilizar geometrias/materiais iguais e preservar troca de arma, clarão, recuo, zoom, munição e balanceamento.
- [x] Versionar o service worker para `arena-fps-v8-p6`, entregando os modelos novos também a instalações offline existentes.

## Pacote 7 — Impacto e resposta do arsenal

- [x] Distinguir visualmente os oito clarões por silhueta, cor e proporção, com camadas externas, núcleo e riscos luminosos.
- [x] Reforçar os rastros de projéteis hitscan com halo colorido e núcleo claro, mantendo os mesmos pontos de origem/alvo e duração curta.
- [x] Gerar faíscas coloridas em alvos/escudos e no cenário, com partículas que encolhem e pools reutilizáveis.
- [x] Ejetar estojos para armas balísticas, com material metálico, movimento/rotação, limite simultâneo de 24 e limpeza ao reiniciar; Railgun/lança-granadas não ejetam estojos.
- [x] Acrescentar aura aos projéteis inimigos e anéis emissivos de expansão às explosões, sem alterar dano, cadência, munição ou regras do combate.
- [x] Atualizar o cache offline para `arena-fps-v8-p7` e ampliar testes dos metadados cosméticos das oito armas.

## Pacote 8 — Impactos, recargas e feedback de combate

- [x] Adicionar marcas de bala temporárias nas faces de paredes/obstáculos, reutilizadas por pool, limitadas a 60 simultâneas, com desaparecimento gradual e limpeza em reinício/troca de arena.
- [x] Diferenciar impacto em superfícies: faíscas/fragmentos frios em metal; poeira e estilhaços em pedra/concreto; fragmentos de madeira e poeira em madeira; escudos continuam com resposta energética ciano.
- [x] Animar mecanismos de recarga por arma: ferrolho da Pistola e do Fuzil, tampa/alimentação da Metralhadora, bomba da Escopeta a cada cartucho, ação do Sniper, tambor da Magnum, bobinas da Railgun e tambor do lança-granadas.
- [x] Fazer inimigos recuarem visualmente no acerto, com reação mais marcada a headshot e resposta oscilante/brilhante do escudo; variar cores/fragmentos de eliminação por tipo e dar ao chefe colapso/efeito próprios.
- [x] Dar vida discreta aos mapas com luzes de canto pulsantes e faíscas ambientais raras, respeitando qualidade baixa e sem poluir o centro de combate.
- [x] Contextualizar HUD por cor da arma, tipo de acerto e progresso percentual da recarga, mantendo os controles e valores de combate atuais.
- [x] Restringir o fallback do service worker para `index.html` a navegações, sem retornar HTML em falhas de recursos estáticos.
- [x] Versionar o cache offline para `arena-fps-v8-p8` e validar os fluxos alterados.

## Pacote 9 — Arsenal em primeira pessoa: mãos, materiais e animação

- [x] Anexar mãos/luvas e antebraços low-poly para as oito armas existentes, com poses adaptadas à forma/comprimento da arma, preservando visão da mira, escopo, inimigos e controles/HUD.
- [x] Diferenciar materiais de metal, polímero/borracha, madeira e energia por acabamento, brilho e detalhes de uso; gerar detalhes proceduralmente e reutilizar geometrias/materiais, sem downloads de textura.
- [x] Encadear recargas em etapas visíveis — mão se aproxima, mecanismo/cartucho se move, componente retorna — com cartuchos da Escopeta entrando por unidade e sincronizados ao tempo existente; preservar a animação própria de cada uma das oito armas.
- [x] Acrescentar pose de repouso e troca de arma suave, e fumaça residual curta e discreta após disparos com pool e limites para evitar objetos persistentes.
- [x] Manter todas as alterações cosméticas: não criar armas/projéteis, nem mudar munição, dano, precisão, cadência, alcance, zoom, controles ou tempos de recarga; versionar o cache offline.

## Pacote 10 — Recargas em etapas e mãos articuladas

- [x] Dar pivôs independentes às falanges proximais/distais de cada dedo e a dois segmentos do polegar; ajustar aperto no gatilho ao indicador próximo do polegar, alcance, suporte e retorno por arma.
- [x] Fazer as recargas legíveis por fases sincronizadas ao tempo já existente, sem mexer em munição, dano ou duração.
- [x] Detalhar ferrolho: liberar, recuar para trás ao longo de +Z, manter aberto, ejetar/mostrar o cartucho quando aplicável e fechar/assentar; sincronizar a Pistola/Fuzil após o carregador e manter o Sniper com seu ciclo de ação.
- [x] Detalhar a Magnum com yoke em pivô lateral: liberar trava, abrir para expor o tambor, girar o cilindro sobre o eixo Z, ejetar e repor visualmente seis munições, fechar e travar; tambor, câmaras e cartuchos permanecem ligados ao mesmo conjunto móvel.
- [x] Corrigir o registro/retorno de peças móveis em coleções, incluindo as bobinas da Railgun; restaurar cada transform/material sem duplicar atualização.
- [x] Preservar controles e combate, versionar o cache offline e atualizar a documentação do pacote.

## Pacote 11 — Detalhes focados e assinatura visual do disparo

- [x] Acrescentar detalhes geométricos de leitura próxima às oito armas existentes, priorizando mira, trilhos/ranhuras, guarda-mato, boca do cano, carregador, receptor e laterais; incluir ferragens, parafusos, juntas, ressaltos e texturas de empunhadura conforme a silhueta de cada família.
- [x] Manter as miras/ópticas e modelos legíveis e sem cobrir inimigos, HUD ou controles; reutilizar caches de geometria/material, sem baixar texturas ou criar malhas por disparo.
- [x] Dar a cada arma um perfil cosmético de impulso, elevação, rolagem e recuperação aplicado só ao modelo/luvas em primeira pessoa: mais marcado na Escopeta/Sniper/Magnum/lançador, controlado no Fuzil/Metralhadora e com breve pós-brilho nas bobinas da Railgun.
- [x] Preservar o disparo real e todos os campos de combate — dano, dispersão, cadência, alcance, recuo de mira/câmera e munição — e não introduzir armas, projéteis ou regras novas.
- [x] Restaurar efeitos/transformações ao trocar de arma ou iniciar recarga, versionar cache offline e atualizar a documentação do pacote.

## Pacote 12 — Inércia, luvas e clarão

- [x] Refinar as mãos com pontas arredondadas/reforçadas, costura e punho mais legíveis, detalhe de pele entre luva/manga e pequeno acessório tático no pulso esquerdo.
- [x] Acrescentar balanço cosmético do viewmodel: atraso sutil ao olhar, inclinação no strafe e afundamento breve ao pousar; não alterar a mira nem a movimentação real.
- [x] Melhorar o clarão com brilho radial, jato lateral, pequena variação de escala e desaparecimento gradual; colorir a luz de disparo conforme a arma e dar preenchimento quente/frio à arma/mãos.
- [x] Atualizar o cache pwa para `arena-fps-v8-p12` mantendo a versão original do ZIP p12 intacta.

## Pacote 13 — Calor de cano, estojos e explosões em camadas

- [x] A Metralhadora aquece visualmente apenas durante disparos: detalhes metálicos e aberturas do cano passam a brilhar em tom quente conforme uma variável cosmética sobe por tiro e esfriam gradualmente quando o gatilho é solto; sem penalidade, superaquecimento ou mudança de stats.
- [x] Cada estojo produz um clique metálico procedural curto, espacializado de acordo com sua posição/distância, somente ao tocar o chão com velocidade suficiente; limitar os impactos sonoros por estojo e o volume para que rajadas não virem ruído constante.
- [x] Explosões recebem camadas rápidas de fogo, anel, fumaça e clarão de luz reutilizável/limitado; há no máximo 8 efeitos simultâneos (4 em qualidade baixa), que omite fogo/luz e reduz a fumaça a até 2 puffs. Preservar raio, dano, física e tremor de tela existentes.
- [x] Reutilizar pools/geometrias/materiais, limpar estados temporários no reset e manter o áudio novo dentro do Web Audio existente, sem dependências ou arquivos externos.
- [x] Confirmar que os atributos de combate seguem inalterados e versionar o cache para `arena-fps-v8-p13`.

## Pacote 14 — Piloto industrial semi-realista

- [x] O Fuzil existente (índice 1) recebe receptor em camadas, guarda-mão/cano, trilho, mira, coronha, soleira, carregador e ferragens com materiais metálicos/poliméricos diferenciados e cantos chanfrados; mantém posicionamento, pontos de recarga e boca do cano.
- [x] As mãos acopladas ao Fuzil recebem acabamento de tecido técnico, borracha, costuras e reforços; as malhas acompanham os grupos existentes de repouso/arma/recarga e não cobrem a retícula.
- [x] A arena inicial recebe materiais procedurais de concreto/metal pintado e piso industrial; as posições/dimensões dos obstáculos são fixadas pelos testes de regressão.
- [x] O tratamento visual está restrito ao Fuzil, suas mãos e mapa 0; armas e mapas restantes conservam seu caminho de materiais anterior. Não foram alterados HUD, controles, física ou atributos de combate; texturas são locais/reutilizadas, sem sombras dinâmicas, pós-processamento ou aumento do limite de resolução.
- [x] Cache offline versionado para p14; prévia HTTP temporária iniciada, captura Chromium salva e relatório atualizado.

**Limitação de validação:** o playtest foi headless em Chromium (1280 × 720); não houve teste manual de tiro/recarga em dispositivo físico nem benchmark de FPS em celular.

## Pacote 15 — Telemetria e cenário para reduzir travamentos

- [x] A telemetria só é ativada com `?perf=1`; mede intervalo entre quadros (p50/p95/p99/máximo), CPU de `update` e submissão de `render`, chamadas/triângulos, geometrias/texturas, qualidade/pixel ratio, entidades ativas, chamadas de `blocked`/`lineClear` e quantidade/tempo de A*. O painel informa que `render` não mede tempo concluído de GPU.
- [x] Guardar amostras em buffer circular pré-alocado de 3.600 frames; atualizar o painel a cada 0,5 s e não adicionar coleta ao caminho normal sem o parâmetro de diagnóstico. Exportar as amostras para CSV.
- [x] Cenário repetível do Hangar com exatamente 12 inimigos em composição/posições fixas, Sobrevivência/Normal e Fuzil; a sessão permanece ativa e não persiste score, carreira, desafios ou recordes. Exceções de dano/abate existem somente na sessão `?perf=1`; o jogo normal preserva as regras de combate.
- [x] Documentar como iniciar, reiniciar e exportar; validar desktop/headless e layout móvel simulado, sem alegar benchmark físico ou FPS de GPU.
- [x] `./test.sh` e sintaxe dos módulos aprovados; cache offline versionado para p15.

**Validação P15:** 60 s em Chromium headless com SwiftShader, viewport 1280 × 720, 426 amostras e nenhum erro JavaScript. CSV: frametime p50 133,4 ms / p95 166,7 ms / p99 483,4 ms; `update` p95 1,5 ms; submissão CPU de `render` p95 31,4 ms; 219 draw calls e 7.824 triângulos no último quadro. No cenário permaneceram 12 inimigos. O painel não aparece na URL normal; a verificação móvel foi simulada em 844 × 390. Isso caracteriza somente este sandbox/software renderer e não é benchmark de celular ou GPU física; teste em dispositivo real continua pendente.

## Pacote 16 — Mescla e anti-travamento

- [x] Base p15; nomes de setor do p14 de mapas; look industrial nos 3 mapas com as mesmas texturas (`floorTint` por mapa).
- [x] Luz de explosão sem alternar visibilidade em jogo; geometria/materiais compartilhados nos rigs.
- [x] Aquecimento de shaders/geometrias/texturas no menu e a cada troca de mapa.
- [x] Resolução adaptativa em desktop e celular (desce rápido, sobe devagar; desligada em `?perf=1`).
- [x] `./test.sh` aprovado, Chromium sem erros; cache `arena-fps-v8-p16`.
- [x] NEXUS nos monitores físicos (textura por terminal).
- [ ] Pendente: medir `?perf=1` em celular/GPU física.e comparar o CSV com o p15.
- [ ] Pendente: fundir as peças dos inimigos para reduzir chamadas de desenho.
- [ ] Pendente: HUD enxuto, céu em gradiente avermelhado, luzes ciano e letreiros (referência visual).

## Pacote 24
- [x] Mescla p23 + portas/câmeras; hold respeita lockout; consoles fundidos (≤18 meshes); telas por terminal.
- [x] NEXUS nos monitores físicos (textura por terminal).
- [ ] Pendente: medir `?perf=1` em celular/GPU física.
- [ ] Pendente: torretas, prédios multi-bloco, marcadores 3D do drone, NEXUS dentro dos monitores físicos, porta bloqueando LOS dos inimigos.

## Pacote 25
- [x] Marcadores 3D do drone (inimigos, console/saída, câmeras).
- [x] NEXUS nos monitores físicos (textura por terminal).
- [ ] Pendente: medir `?perf=1` em celular/GPU física.

## Pacote 26
- [x] Portas fechadas barram projétil e disparo de inimigos à distância.
- [ ] Decidir: tiro do jogador também ser barrado? chefe/ataques em área?

## Pacote 27
- [x] Torretas de segurança (2 por prédio), desligáveis.
- [ ] Ajustar dano/alcance após playtest; tornar destrutíveis?

## Pacote 28
- [x] Prédio 4: Campus (blocos A–E).
- [ ] Pendente: medir `?perf=1` em celular; blocos em altura (andares) ou área maior exigem mexer em ARENA.

## Pacote 29
- [x] Torretas destrutíveis (40 HP, +50 pontos).
- [ ] Pendente: medir `?perf=1` em celular; andares/área maior.
