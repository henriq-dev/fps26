# Próximas melhorias — animações e visual geral

O P38 já tem balanço de câmera/arma, corrida, aterrissagem, agachar/deslizar, inspeção da arma, recargas coreografadas, animações de morte, efeitos de impacto, câmeras/portas/torretas, detalhes ambientais e o novo acabamento de armas/terminais. As ideias abaixo são trabalho futuro e ampliam esses sistemas sem exigir uma reescrita do motor.

## Entregue no P38

- Duas armas procedurais integradas — **SMG Vespa** (onda 8) e **Carabina Íon** (onda 10) — com silhueta, pose, clarão e recarga próprios; o arsenal agora tem dez entradas e a tecla **0** seleciona a décima.
- Motas iônicas de curta duração, com geometria/material reaproveitados, pool e orçamento compartilhado de efeitos.
- Telas NEXUS com apresentação variável por tipo/estado do terminal e pequenos detalhes físicos fundidos às malhas existentes.
- Slots touch roláveis com safe-area e ajustes do menu/HUD para paisagem e telas curtas; o menu 844×390 mantém **JOGAR** visível e expõe rolagem nas configurações.
- Testes de núcleo/sintaxe e renderização Chromium em 1280×720, 844×390 e 320×568; o último mostra a orientação portrait intencional. Não houve teste físico de joystick.

## Prioridade 1 — Feedback de jogo legível

1. **Animação distinta por evento de acerto:** diferenciar hit normal, headshot, escudo, armadura e inimigo blindado com variação curta de hitmarker, cor e som sincronizados. Respeitar as cores da arma, mantendo contraste alto.
2. **Telegráficos de ataque:** aumentar a leitura de investida do chefe, disparos de inimigos, explosão de kamikaze, torreta e câmeras. Usar um breve pulso no material/indicador e um marcador de direção, sem cobrir a mira ou depender só da cor.
3. **Transições de missão e ondas:** entrada curta do briefing, avanço do objetivo, alarme e vitória/derrota com hierarquia visual consistente. Manter texto importante disponível mesmo se a animação for desligada.
4. **Dano recebido:** melhorar a direção do ataque, pulso de borda e retorno da barra de vida com animação curta; evitar flash branco total, que pode prejudicar jogadores sensíveis.

## Prioridade 2 — Vida visual dos personagens e armas

1. **Inimigos em repouso e patrulha:** micro-movimentos de cabeça/ombros, respiração, troca de peso e variação de postura antes do combate. Usar fases determinísticas por entidade para que a arena não pareça sincronizada.
2. **Reações por classe:** hit-stagger leve para inimigos comuns, proteção levantada para escudeiros, pausa de mira para atiradores e reação maior para o chefe. Preservar hitboxes, velocidade e janelas de ataque.
3. **Armas e mãos:** completar blends entre disparo, corrida, mira, recarga e inspeção; limitar o deslocamento do modelo para não ocultar inimigos. Dar silhuetas de recarga mais distintas às armas em que ainda se confundem.
4. **Ejeção/impacto de cartuchos:** variar rotação e contato com chão de forma curta, com limite de objetos ativos e retorno ao pool.

## Prioridade 3 — Cenário e narrativa ambiental

1. **Ciclos de luz e sinalização:** luzes de corredor, painéis de direção, indicadores de porta e terminais que comunicam estados de segurança, alarme e objetivo.
2. **Prop ambiental animado:** ventiladores lentos, cabos oscilando levemente, telas com conteúdo fictício, pequenos pistões e vapor localizado. Manter animações sutis e desligáveis na qualidade Baixa.
3. **Marcas de combate com contexto:** decalques temporários de impacto por superfície, fuligem leve e fragmentos localizados. Reutilizar pools, limitar duração/quantidade e limpar ao trocar de mapa.
4. **Identidade por prédio:** paleta, pictogramas, placas de setor, alertas e composição de luz específicas para Complexo, Refinaria, Laboratório e Campus, sem mudar a navegação ou bloquear linhas de visão.
5. **Transições de sala/mapa:** porta ou painel com animação curta e indicação de rota; evitar transições longas que retirem controle do jogador.

## Prioridade 4 — HUD e acabamento consistente

1. **Sistema de movimento do HUD:** animar suavemente troca de arma, munição, recarga, créditos, combo e progresso do objetivo; evitar saltos de layout.
2. **Tipografia e escala:** definir níveis comuns de tamanho, espaçamento, brilho e contorno para menus, feed, alertas, terminais e overlays; confirmar legibilidade em tela pequena.
3. **Estados além da cor:** combinar cor com texto, ícone ou forma (por exemplo, bloqueado/aberto/concluído) para acessibilidade e contraste.
4. **Opção de movimento reduzido:** honrar `prefers-reduced-motion` e oferecer controles para reduzir bob de câmera, inclinação, shake, slow motion, flashes e animações do HUD.
5. **Controles móveis:** adicionar opção/botão de agachar e inspecionar quando caber no layout; permitir redimensionar/reposicionar controles e evitar toque acidental em granada/interação.

## Prioridade 5 — Atmosfera e efeitos de alto custo

1. **Pós-processamento seletivo:** avaliar bloom, vinheta ou aberração cromática apenas se houver ganho visual claro; oferecer toggle e opção Baixa sem pós-processamento.
2. **Partículas e fumaça:** usar efeitos curtos, com orçamento máximo, pools e redução por qualidade; manter inimigos e objetivo mais contrastados que o fundo.
3. **Iluminação:** preferir materiais emissivos e mudanças graduais em luzes já existentes a criar/remover luzes durante combate, para reduzir recompilações de shader.
4. **Áudio-visual:** sincronizar impactos, portas, relés e alertas com som espacial curto, preservando opção de volume e sem aumentar o ruído visual.

## Plano de implementação sugerido

- **Etapa A — baixo risco:** melhorar feedback de acerto, telegráficos, HUD e transições; sem alterar dano, IA ou colisões.
- **Etapa B — personagem/arma:** polir estados de animação já existentes e conferir recargas/interrupções em cada arma.
- **Etapa C — cenário:** criar um protótipo de props/luzes em um mapa e comparar Média/Baixa antes de propagar aos demais.
- **Etapa D — acessibilidade/móvel:** opções de movimento reduzido, controles remapeáveis e botões móveis para as ações novas.
- **Etapa E — efeitos pesados:** avaliar pós-processamento e mais partículas só após medição no aparelho-alvo.

## Critérios de aceite para cada melhoria

- Não mudar dano, precisão, cadência, hitboxes, IA, colisão, pontuação ou condição de vitória quando o objetivo for apenas visual.
- Fazer animações dependerem de `dt`, com duração limitada, estado de retorno previsível e tratamento de interrupção (troca de arma, morte, pausa, recarga ou troca de mapa).
- Preferir materiais/geometrias compartilhados, pools e números máximos explícitos; não criar novas luzes ou materiais por quadro.
- Conferir qualidade Baixa/Média/Alta, desktop e paisagem móvel; incluir `prefers-reduced-motion` para movimento não essencial.
- Acrescentar teste automatizado para regras/estados puros e realizar playtest visual para composição, legibilidade e sensação.
