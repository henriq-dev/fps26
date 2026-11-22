# Relatório atual — Arena FPS v8 · Pacote P55

**Base de integração:** P53 + diagnóstico de instalação. **Última atualização:** pacote P54 em 22/11/2026.  
**Projeto:** Arena FPS — Three.js r128, scripts clássicos, namespace `Arena`.

## Pacote 55 — Mescla P54 + P36 + P37 (22/11/2026)

**Mescla:** base = seu P54 (lobby, BAIXAR/INSTALAR, 10 armas, cache do SW). Entrou por mesclagem de três vias tudo o que a minha linha tinha de P35→P37. Três conflitos resolvidos à mão (FOV da cinemática com sprint/dash do P54; monitores do P38 mantidos + pacotes de dados; testes mantidos dos dois lados).

| Nível | Atividade | Conceito praticado | Justificativa |
|---|---|---|---|
| Fácil | Cache `v8-p55`, título e versão do lobby | Versionamento de PWA | Força atualização do service worker. |
| Fácil | Login no boot, janela de arquivos, mapa de rede, notificações, relógio/taskbar, desktop (P36) | DOM + Canvas 2D | Deck vira um mini desktop fictício. |
| Fácil | Flash na borda ao fim do scan, chuva de código no shell, linha tracejada laptop→console, pacotes de dados no NEXUS (P36) | CSS `animation`, Canvas, `setInterval` | Efeitos baratos, respeitam `prefers-reduced-motion`. |
| Médio | Mãos do personagem no laptop: balançam devagar parado e rápido ao digitar (`deckLastKey`) | Animação por tempo + estado de entrada | Poucas caixas, sem material novo. |
| Médio | Cinemática ao vencer um console: barras de cinema + zoom de FOV por 1,5 s | `Math.sin` como curva, tempo real (`performance.now`) | Em tempo real para não travar em quadros lentos; pulada com movimento reduzido. |
| Difícil | Hologramas: contornos (`EdgesGeometry`) de inimigos, torretas, câmeras e console, vistos através das paredes durante o scan | Pool de 16 objetos pré-criados, `depthTest:false`, `renderOrder` | Zero alocação em jogo e sem luz dinâmica. |
| Difícil | Drone 3D atrás do jogador com câmera própria numa janelinha (PiP) | `WebGLRenderTarget` 256×160, render a cada 3 quadros, esconder PiP/arma/laptop durante o render | Evita feedback do próprio PiP e custo extra constante e baixo. |

Testes: `bash test.sh` aprovado; Chromium (SwiftShader): scan → 6 hologramas, drone + PiP visíveis, cinemática liga e desliga, 0 erros JS. Armas, dano, IA, colisão, balanceamento: intocados.
**Limites:** FPS real não medido (SwiftShader); valores de balanceamento do deck (scan 8 s/20 s, jam 12 s/40 s, connect +50%) seguem como chute para você confirmar.

## Pacote 54 — Diagnóstico de instalação (22/11/2026)

Sem o aviso nativo (`beforeinstallprompt`), o botão INSTALAR APP mostrava só instruções genéricas. Agora, ao clicar, ele checa HTTPS, service worker, manifest e `getInstalledRelatedApps()` e informa o motivo concreto (por exemplo, “o app já está instalado: abra pelo atalho ou chrome://apps”). Se estiver rodando dentro do app, avisa isso. O manifest ganhou `related_applications` (webapp) para essa detecção. Cache PWA: `arena-fps-v8-p54`.

## Pacote 53 — Correção do cache do service worker (22/11/2026)

**Bug (P49–P52):** o GitHub Pages serve os arquivos com `Cache-Control: max-age=600`. O `cache.addAll()` do service worker passava pelo cache HTTP do navegador e podia guardar `style.css`/`app.js` antigos junto do `index.html` novo; como o SW responde primeiro do cache, a página ficava com HTML novo, CSS antigo (lobby sem estilo) e botão de baixar sem o JS correspondente. Reproduzido em teste com servidor de `max-age=600`: SW antigo cacheou a versão A, o corrigido cacheou a B.
**Correção:** o install agora busca cada arquivo com `new Request(url, { cache: 'reload' })`. Cache PWA: `arena-fps-v8-p53`.
**Quem já está com cache preso:** ao abrir, aparece “Nova versão disponível” → ATUALIZAR; ou DevTools → Application → Storage → Clear site data.

## Pacote 52 — Download do jogo em arquivo único (22/11/2026)

O botão “BAIXAR / INSTALAR APP” dependia do aviso nativo do navegador (`beforeinstallprompt`), que o Chrome não dispara se o app já foi instalado ou se a sessão não cumpre os critérios dele; sem aviso, o botão só mostrava instruções e nada era baixado. Agora há dois botões independentes:
- **⬇ BAIXAR O JOGO (arquivo único):** monta no navegador um único `arena-fps.html` (HTML + CSS + todos os scripts embutidos, ~1 MB) e o baixa. Abre com duplo clique, sem internet, sem instalar nada. Testado: o arquivo baixado abre via `file://`, inicia a partida, sem erros e sem requisições externas.
- **📲 INSTALAR APP:** continua usando a instalação PWA quando o navegador oferece, ou mostra o passo a passo.
Na versão baixada (`file://`) ambos os botões se escondem. Cache PWA: `arena-fps-v8-p52`.

## Pacote 51 — Lobby redesenhado (22/11/2026)

- Duas cartas: **MISSÃO** (modo e dificuldade em botões, prédio só aparece na Incursão, JOGAR grande, instalar app) e **CONTROLES** (teclas em “keycaps” por grupo, em vez do bloco de texto).
- Ajustes (sensibilidade, visão, volume, controles, radar, qualidade) e Carreira em painéis recolhidos.
- O HUD do jogo não aparece mais por trás do menu/lobby/game over; o aviso de atualização foi para o rodapé e não cobre o título.
- Cada tela mostra só o que precisa (`data-view`): menu/lobby completos, pausa sem a carta de missão, game over só com resultado e “VOLTAR AO LOBBY”.
- Os `<select>` originais continuam como fonte da verdade (os botões os controlam), então preferências salvas e lógica do jogo não mudam. Layout testado em 1365×650, 390×780 e 844×390.
- Cache PWA: `arena-fps-v8-p51`.

## Pacote 50 — Mira, primeira pessoa, lobby e instalação (22/11/2026)

- **Mirar não tampa mais o inimigo:** ao mirar, a arma ia para o centro da tela e, com o FOV reduzido pelo zoom, ficava ampliada e cobria o alvo. Agora ela fica no canto inferior (metade do deslocamento lateral, levemente mais baixa) e a escala compensa o zoom.
- **Primeira pessoa menor:** `VM_SCALE = 0.88` reduz arma e mãos em todo momento (ajuste num único número em `script.js`).
- **Lobby:** ao fim da partida o botão passa a ser “VOLTAR AO LOBBY”; recomeçar exige ir ao lobby (modo, dificuldade, carreira) e clicar JOGAR.
- **Instalação:** o botão “BAIXAR / INSTALAR APP” agora aparece sempre (fora do app instalado). Quando o navegador não libera o aviso nativo, mostra o passo a passo para iPhone, Android e computador. O manifest foi verificado no Chrome (`Page.getInstallabilityErrors` vazio).
- Cache PWA: `arena-fps-v8-p50`.

## Pacote 49 — App instalável com download e aviso de atualização (22/11/2026)

- **Botão “BAIXAR / INSTALAR APP”** no menu (`app.js`): aparece quando o navegador oferece a instalação (Chrome/Edge/Android) e some depois de instalado. No iPhone/iPad mostra a instrução “Adicionar à Tela de Início”.
- **Aviso de atualização:** a nova versão é baixada em segundo plano e fica em espera; aparece a barra “Nova versão disponível · ATUALIZAR”. Só ao tocar o SW troca e a página recarrega — nunca no meio da partida sem o jogador querer. Verificação ao voltar para o app e a cada 30 min.
- **Status offline/versão** no menu (“Pronto para jogar offline”, “versão P49”).
- **Ícones PNG** 192/512, maskable e apple-touch (o manifest só tinha SVG, que o Chrome não aceita para instalar); manifest com `id` e `display_override`.
- `sw.js` sem `skipWaiting` automático; cache `arena-fps-v8-p49`. Gameplay intacto.
- **Correção crítica:** o Three r128 empacotado não tem `InstancedMesh.computeBoundingSphere` (existe só a partir do r151). As chamadas dos pacotes P40–P48 lançavam `TypeError` ao carregar o mapa Hangar (visto em Chromium headless: `wallStrips.computeBoundingSphere is not a function`). Agora o helper `fitInstanced` usa a função se existir e, senão, desliga o frustum culling da instância.

Limites: instalação e atualização exigem HTTPS (ou localhost) e não foram testadas em dispositivo real. Para testar a atualização, publique uma versão nova com `CACHE_NAME` diferente e reabra o app.

### Medições P49

- **Teste de runtime novo:** `tests/e2e-smoke.py` (Chromium headless, `?test=1`) carrega os 3 mapas e os 3 prédios da Incursão nas 3 qualidades, renderiza um quadro e falha em qualquer exceção JS; `test.sh` roda quando o playwright existe.
- **Medição real de draw calls (Hangar, software GL, contagem independe da GPU):** P39 = 123 (Média) / 122 (Alta); P49 = 94 / 94, cerca de -24%. Nos outros mapas a diferença é de 1-3 chamadas. Incursão: -2 a -3.
- **Onde está o resto do custo:** ~60 das ~79 chamadas base de qualquer mapa vêm do viewmodel (arma + mãos, ~128 meshes sob a câmera). Próximo alvo de otimização: fundir as partes estáticas da arma por material, mantendo separadas as móveis (`movable`) e as de calor (`trackHeat`). Exige conferência visual das 10 armas.

## Pacote 48 — Cache do cenário ao trocar a qualidade (22/11/2026)

`cachedSkyline` e `cachedIndustrialDressing` eram criados uma vez e nunca invalidados, então as versões adaptativas do P41 e P42 (torres e neons por qualidade) só valiam após recarregar a página. Agora ambos são zerados quando a qualidade muda, antes do `loadMap`, e o cenário é refeito com a quantidade correta. Nenhuma outra mudança; gameplay intacto. Cache PWA: `arena-fps-v8-p48`.

Limite: sem teste visual em navegador; validado por `bash test.sh`.

## Pacote 47 — Faixas luminosas perimetrais (22/11/2026)

As quatro faixas luminosas das paredes, presentes nos mapas e alteradas pelo estado visual da Incursão, agora usam um único `THREE.InstancedMesh`. A cor continua sendo aplicada pelo mesmo `stripMat`, de modo que o alarme e os estados de alerta preservam seu comportamento. As matrizes mantêm as posições e escalas anteriores; `instanceMatrix.needsUpdate` e `computeBoundingSphere()` são executados após o preenchimento.

A alteração é exclusivamente de renderização. Não modifica colisão, navegação, spawn, combate, armas, IA, progressão ou regras dos modos Sobrevivência, Operações e Incursão. As otimizações de cenário dos pacotes P41–P46 permanecem ativas.

### Validação P47

- `bash test.sh`: aprovado, incluindo checks do `wallStrips` instanciado.
- `node --check` dos scripts: aprovado.
- Smoke test HTTP/headless: recursos principais em HTTP 200 e título P47 carregado sem exceções JavaScript da aplicação.
- ZIP final inspecionado, com arquivos diretamente na raiz e sem dependências de build.

### Limites P47

- O ganho efetivo de draw calls e FPS precisa ser medido em GPU e celular reais; o headless usa renderização por software.
- A validação visual humana dos estados normal e de alerta da Incursão continua recomendada.

## Pacote 46 — Estrutura escura da ponte e do guindaste (22/11/2026)

Os cinco blocos estruturais escuros que compõem a ponte elevada e o guindaste do Hangar agora usam um único `THREE.InstancedMesh`. As matrizes preservam exatamente posições, escalas e material da composição anterior. O `instanceMatrix` é atualizado e o bounding sphere é recalculado após o preenchimento, reduzindo cinco meshes decorativas para uma chamada de desenho.

A alteração é exclusivamente de renderização. Não modifica colisão, navegação, spawn, combate, armas, IA, progressão ou regras dos modos Sobrevivência, Operações e Incursão. As otimizações de skyline, neons, luzes vermelhas e trilhos dos pacotes P41–P45 permanecem ativas.

### Validação P46

- `bash test.sh`: aprovado, incluindo checks da estrutura escura instanciada.
- `node --check` dos scripts: aprovado.
- Smoke test HTTP/headless: recursos principais em HTTP 200 e título P46 carregado sem exceções JavaScript da aplicação.
- ZIP final inspecionado, com arquivos diretamente na raiz e sem dependências de build.

### Limites P46

- O ganho efetivo de draw calls e FPS precisa ser medido em GPU e celular reais; o headless usa renderização por software.
- A validação visual humana da ponte e do guindaste continua recomendada para confirmar o alinhamento dos cinco blocos.

## Pacote 45 — Instanciamento dos trilhos perimetrais (22/11/2026)

Os quatro trilhos metálicos do dressing industrial — dois longitudinais e dois transversais — agora usam dois `THREE.InstancedMesh`, um por orientação. As geometrias e o material de aço permanecem os mesmos; as matrizes preservam as posições e escalas originais. Os bounds são recalculados após o preenchimento, reduzindo quatro meshes decorativas para duas chamadas de desenho.

A alteração é exclusivamente de renderização. Não modifica colisão, navegação, spawn, combate, armas, IA, progressão ou regras dos modos Sobrevivência, Operações e Incursão. As otimizações de skyline, neons e luzes vermelhas dos pacotes P41–P44 permanecem ativas.

### Validação P45

- `bash test.sh`: aprovado, incluindo checks dos trilhos longitudinais/transversais instanciados.
- `node --check` dos scripts: aprovado.
- Smoke test HTTP/headless: recursos principais em HTTP 200 e título P45 carregado sem exceções JavaScript da aplicação.
- ZIP final inspecionado, com arquivos diretamente na raiz e sem dependências de build.

### Limites P45

- O ganho efetivo de draw calls e FPS precisa ser medido em GPU e celular reais; o headless usa renderização por software.
- A validação visual humana do alinhamento dos trilhos continua recomendada em diferentes resoluções.

## Pacote 44 — Instanciamento das luzes vermelhas do Hangar (22/11/2026)

Os quatro halos vermelhos lineares das paredes e as duas lâmpadas vermelhas do guindaste agora usam `THREE.InstancedMesh`: um grupo para os halos e outro para as lâmpadas. As matrizes preservam as posições, escalas e materiais existentes, reduzindo seis meshes decorativas para duas chamadas de desenho. Os bounds são recalculados após o preenchimento.

A alteração é exclusivamente de renderização. Não modifica colisão, navegação, spawn, combate, armas, IA, progressão ou regras dos modos Sobrevivência, Operações e Incursão. As otimizações adaptativas de skyline e neons dos pacotes P41–P43 permanecem ativas.

### Validação P44

- `bash test.sh`: aprovado, incluindo checks dos halos e lâmpadas instanciados.
- `node --check` dos scripts: aprovado.
- Smoke test HTTP/headless: recursos principais em HTTP 200 e título P44 carregado sem exceções JavaScript da aplicação.
- ZIP final inspecionado, com arquivos diretamente na raiz e sem dependências de build.

### Limites P44

- O ganho efetivo de draw calls, overdraw e FPS precisa ser medido em GPU e celular reais; o headless usa renderização por software.
- A validação visual humana do Hangar continua recomendada para confirmar a preservação dos halos e das lâmpadas vermelhas.

## Pacote 43 — Instanciamento dos neons do Hangar (22/11/2026)

Os pontos ciano e seus halos transparentes agora são agrupados em quatro `THREE.InstancedMesh`: lâmpada vertical, lâmpada horizontal, halo vertical e halo horizontal. A quantidade de instâncias continua adaptativa ao P42 — Alta usa quatro colunas por parede e Média usa duas —, mas cada grupo de orientação/material passa a consumir uma chamada de desenho em vez de uma malha por ponto.

As matrizes preservam as posições, escalas, cores e o comportamento visual anterior. Os bounds das quatro instâncias são recalculados após o preenchimento. A alteração é exclusivamente de renderização e não modifica colisão, navegação, spawn, combate, armas, IA, progressão ou regras dos modos existentes.

### Validação P43

- `bash test.sh`: aprovado, incluindo checks dos quatro `InstancedMesh`, capacidade adaptativa e bounds.
- `node --check` dos scripts: aprovado.
- Smoke test HTTP/headless: recursos principais em HTTP 200 e título P43 carregado sem exceções JavaScript da aplicação.
- ZIP final inspecionado, com arquivos diretamente na raiz e sem dependências de build.

### Limites P43

- O ganho efetivo de draw calls, overdraw e FPS precisa ser medido em GPU e celular reais; o headless usa renderização por software.
- A validação visual humana das qualidades Alta e Média continua recomendada para confirmar que as matrizes instanciadas mantêm a leitura dos neons.

## Pacote 42 — Overdraw adaptativo dos neons do Hangar (22/11/2026)

O dressing industrial do Hangar agora reduz a quantidade de pontos ciano e halos transparentes na qualidade **Média**: são usados dois pontos por lado (`[-18, 6]`) em vez de quatro (`[-18, -6, 6, 18]`) na qualidade **Alta**. Os halos lineares das paredes e a leitura cromática principal permanecem preservados. A qualidade **Baixa** e `?simples=1` continuam sem o dressing industrial, conforme o comportamento anterior.

Essa redução limita meshes transparentes e overdraw, especialmente em dispositivos móveis, sem alterar materiais de gameplay, colisão, navegação, spawn, combate, armas, IA, progressão ou regras dos modos existentes.

### Validação P42

- `bash test.sh`: aprovado, incluindo checks da amostragem de neons e das otimizações de skyline P41.
- `node --check` dos scripts: aprovado.
- Smoke test HTTP/headless: recursos principais em HTTP 200 e título P42 carregado sem exceções JavaScript da aplicação.
- ZIP final inspecionado, com arquivos diretamente na raiz e sem dependências de build.

### Limites P42

- O ganho de overdraw, draw calls e FPS precisa ser medido em GPU e celular reais; o headless usa renderização por software.
- A validação visual humana das qualidades Alta e Média continua recomendada para confirmar a leitura das paredes em diferentes telas.

## Pacote 41 — Skyline adaptativo por qualidade (22/11/2026)

O skyline exterior do Hangar mantém o `THREE.InstancedMesh`, mas agora adapta a quantidade de silhuetas à qualidade selecionada: **Alta** preserva 16 torres no anel mais a torre central; **Média** usa 8 torres no anel mais a torre central. A qualidade Baixa e `?simples=1` continuam seguindo o comportamento existente de desligar o skyline. A torre central permanece em todas as variantes ativas, e a esfera de bounds é recalculada explicitamente após a atualização das instâncias.

A alteração é visual e de orçamento de renderização apenas: não modifica colisão, navegação, spawn, combate, armas, IA, progressão ou regras dos modos Sobrevivência, Operações e Incursão.

### Validação P41

- `bash test.sh`: aprovado, incluindo checks de `ringCount`, capacidade `ringCount + 1`, distinção Alta/Média e `computeBoundingSphere()`.
- `node --check` dos scripts: aprovado.
- Smoke test HTTP/headless: recursos principais em HTTP 200 e título P41 carregado sem exceções JavaScript da aplicação.
- ZIP final inspecionado, com os arquivos diretamente na raiz e sem dependências de build.

### Limites P41

- A redução de draw calls/FPS precisa ser medida em GPU e celular reais; o headless usa renderização por software.
- A validação visual humana do skyline em Alta e Média continua recomendada.

## Pacote 40 — Otimização do Hangar e robustez de release (22/11/2026)

O skyline do Hangar agora usa um `THREE.InstancedMesh` para as 16 torres exteriores e a torre central, reduzindo draw calls sem alterar colisão, navegação ou gameplay. A textura de janelas passou a usar um gerador pseudoaleatório determinístico, mantendo a mesma composição visual entre carregamentos. Foram adicionados checks estáticos para proteger a otimização e o cache PWA foi versionado para `arena-fps-v8-p40`.

### Validação P40

- `bash test.sh`: aprovado, incluindo checks de `InstancedMesh`, esfera de bounds e seed determinística.
- `node --check` dos scripts: aprovado.
- Smoke test HTTP/headless: recursos principais em HTTP 200 e título P40 carregado sem exceções JavaScript da aplicação.
- O balanceamento, armas, IA, progressão, Incursão e controles foram preservados.

### Limites P40

- Ainda é necessário medir draw calls e FPS em GPU/celular real para quantificar o ganho.
- A validação visual humana do Hangar continua recomendada após a otimização.

## Pacote 39 — Junção P38 consolidado + P38 cenário/animação (22/11/2026)

Junção em três vias (base P37) de dois pacotes P38 independentes: o consolidado (SMG Vespa, Carabina Íon, terminais NEXUS detalhados, slots/HUD com safe-area) e o de cenário/animação (skyline, faixas, ponte, guindaste e neons com brilho no mapa 0; braços e respiração dos inimigos; explosões suaves; hit marker com pop; feed e `prefers-reduced-motion`). `script.js`, `style.css` e `maps.js` uniram sem conflito; o `sw.js` só diferia no nome do cache (`arena-fps-v8-p39`). Suíte automática aprovada; sem playtest visual nem medição de FPS.

## Pacote consolidado P37 — junção dos pacotes recebidos (22/11/2026)

Base de código: P37. Foram preservadas as mudanças de terminal/cyberdeck do P35 e os subsistemas presentes no P34. As melhorias visuais do checkpoint de animação P35 foram incorporadas pela implementação posterior do P37 (câmera, corrida, aterrissagem e arma em primeira pessoa); o checkpoint original fica registrado em `ANIMATIONS_PROGRESS.md`, sem substituir o código mais novo.

O P37 acrescenta agachar/deslizar, inspeção de arma (V), câmera lenta em eventos, placar animado, animação de morte e detalhes ambientais. Os testes automatizados existentes passam; essas mecânicas novas ainda precisam de playtest manual em desktop e celular. O service worker recebeu um identificador de cache novo para clientes já instalados. Documentos P14–P20 e P34/P35 são mantidos junto aos arquivos.

**Limite da consolidação:** não foram fundidas variantes contraditórias de `script.js` como blocos; manteve-se a implementação mais recente do P37, que contém os recursos anteriores e substitui a revisão de câmera do checkpoint.

## Pacote 38 — arsenal, partículas, consoles e responsividade (22/11/2026)

Sobre a base P37 foram integradas duas armas procedurais: **SMG Vespa**, desbloqueada na onda 8, e **Carabina Íon**, desbloqueada na onda 10. Ambas têm stats, modelo, pose, clarão e animação de recarga próprios. A seleção agora contempla dez armas, com a tecla **0** para a décima. Foi acrescentado um efeito curto de motas iônicas com pool reutilizável e limite compartilhado de efeitos.

As telas NEXUS variam a apresentação conforme tipo e estado do terminal, e os consoles receberam detalhes de hardware fundidos às malhas existentes. Ajustes de safe-area, rolagem dos slots touch e indicador/área de rolagem do menu em telas baixas melhoram a leitura sem mexer em colisões ou regras de combate. O service worker usa `arena-fps-v8-p38-arsenal-visual`.

### Validação e limites P38

- `bash test.sh`: aprovado (`core tests`, testes de Incursão/consoles e `syntax checks`).
- Chromium headless via HTTP: menu renderizado em 1280×720, 844×390 e 320×568; os recursos centrais (`index.html`, CSS, scripts, telas e service worker) responderam HTTP 200. Nenhum erro ou exceção JavaScript foi encontrado nos logs examinados; avisos de DBus e fallback SwiftShader são do ambiente.
- Em 844×390, as configurações têm rolagem indicada e o botão **JOGAR** permanece visível. Em 320×568 portrait, o jogo mostra intencionalmente o aviso para girar o celular.
- Não havia `/dev/input` nem joystick acessível no Sandbox. O mapeamento existente Gamepad API/Standard foi revisado, mas controle PlayStation físico, jogabilidade em aparelho real e FPS em GPU/celular não foram testados.
- Continuam pendentes o playtest humano do fluxo NEXUS nos três prédios e a validação de desempenho em hardware real; ver `TODO.md`.

---

## Pacote 20 — Modo Incursão: prédio em salas, terminais, escolhas e fuga (18/11/2026)

Baseado no plano `IDEIAS-FUTURAS.md` e nas imagens de referência (mapa da estação em blocos, Hadley's Hope bloco C, corredor "SECURITY" e HUD tático).

### Ordem das atividades (Fácil → Médio → Difícil)
| # | Nível | Atividade | Conceito |
|---|---|---|---|
| 1 | Fácil | Opção "Incursão (prédio)" no menu e arquivo `incursion.js` (dados + regras puras) | separação dados/regra |
| 2 | Fácil | Mapa "Complexo": corredores em cruz de 6 m, 4 salas com portas de 4 m (segurança, rede, datacenter, alojamento), teto e luzes de LED sem luz dinâmica | blocos AABB, material compartilhado |
| 3 | Fácil | Terminais (mesa + tela) e marcador do objetivo atual | reuso de geometrias |
| 4 | Médio | Invasão: segurar E perto do console enche a barra; inimigo perto atrasa (×0,55) | estado + `dt` |
| 5 | Médio | 4 setores (infiltrar, rede, datacenter, fuga) com reforços contínuos e cura/munição ao avançar | máquina de estados |
| 6 | Médio | Spawns dentro do prédio (15 pontos, longe do jogador e fora de paredes) | filtro por distância |
| 7 | Médio | Drone (tecla F): marca todos os inimigos no radar por 10 s (16 s se liberado) | cooldown |
| 8 | Difícil | Escolha de segurança (1 de 3) e objetivo final (1 ou mais de 4: derrubar, vírus, roubar dados, destruir) com efeitos somados em `Arena.incursionEffects` | função pura testável |
| 9 | Difícil | Tela de invasão cenográfica: rede "3D" (pontos projetados em canvas 2D), registro `[SIM]` digitando, estados escolher → executar → continuar | projeção em perspectiva |
| 10 | Difícil | Alarme (60–75 s) só com cores, depois "resposta total"; fuga até a saída de serviço; vitória "MISSÃO CUMPRIDA" | sem recompilar shaders |

### Justificativa da lógica
- **Regras puras em `incursion.js`**: os efeitos das escolhas ficam fora do DOM, então os testes rodam em Node.
- **Sem luz dinâmica nova**: mudar luzes no Three.js r128 recompila shaders; o alarme troca só cor de faixa e de neblina.
- **Fictício**: a tela de invasão é um texto e um desenho; nenhum comando ou rede real.
- **Não mexe** em armas, dano, IA, colisão ou balanceamento. As armas liberam pelo "wave" interno (2, 4, 6, 8) como nas ondas.

### Testes
- `./test.sh`: caminho A* do centro até os 3 terminais e a saída; centro livre; efeitos somados; spawn longe; sintaxe.
- Chromium (SwiftShader), fluxo completo automatizado: setor 1 → modal de segurança (3 opções) → modal de objetivo final (4 opções, combinando 3) → fuga com alarme → saída → "MISSÃO CUMPRIDA". 0 erros de JS.

### Limites
- Sem teste em GPU real; o desempenho do mapa novo no aparelho do usuário não foi medido (use `?perf=1`).
- O drone marca no radar, não em 3D através das paredes.
- Salas ainda simples (blocos); sem portas animadas, sem torretas nem câmeras como objetos.
- Versão em um bloco só; o prédio em vários blocos (como o mapa A–E) fica para depois.

---

## Pacote 19 — Modo Baixo real, piso legível, resolução adaptativa no PC e diagnóstico de GPU (18/11/2026)

### Ordem das atividades (Fácil → Médio → Difícil)
| # | Nível | Atividade |
|---|---|---|
| 1 | Fácil | `floorTint` por mapa em `maps.js` (Hangar 0x959994, Pátio 0xa8916c, Fábrica 0x7fa89c): piso com cor própria e legível |
| 2 | Fácil | Painel/CSV de diagnóstico renomeados para P19; cache do service worker `arena-fps-v8-p19` |
| 3 | Fácil | Interruptores por URL: `?semluzes=1 &simples=1 &escala=0.5 &semneblina=1 &sempoeira=1` |
| 4 | Médio | GPU (`WEBGL_debug_renderer_info`), devicePixelRatio, tamanho do canvas e flags no painel e no cabeçalho do CSV; aviso "SOFTWARE" se o renderer for SwiftShader/llvmpipe |
| 5 | Médio | Modo Baixo leve de verdade: materiais Lambert sem textura, sem decoração PBR, sem luzes de canto e de explosão |
| 6 | Difícil | Resolução adaptativa também no PC: cai rápido (média > 26 ms), sobe devagar (média < 18,5 ms por 3 janelas de 60 quadros); desligada com `?perf=1` ou `?escala=` |
| 7 | Difícil | Documentação completa P1–P19 reunida num só relatório |

### Conceitos praticados e justificativa
- **Histerese**: descer a resolução rápido evita travada; subir devagar evita oscilar entre dois valores.
- **Luzes e shaders no Three.js r128**: mudar o número de luzes visíveis recompila os shaders. Por isso o modo Baixo só altera luzes e materiais ao trocar a qualidade no menu, seguido de `loadMap` + `warmScene` (aquecimento), nunca durante o combate.
- **Diagnóstico antes de otimizar**: os CSVs reais do P18 mostraram ~20 FPS com só 14–17% do quadro em JavaScript e sem relação com chamadas de desenho; logo o gargalo é GPU/navegador. Os interruptores e a GPU no CSV permitem descobrir qual recurso custa no aparelho dele, em vez de supor.
- **TDZ (`let` antes da declaração)**: `appliedQuality` foi movido para o topo porque `loadMap(0)` já o consulta.

### Testes e medições
- `./test.sh`: testes de núcleo e `node --check` passam.
- Chromium/SwiftShader, 0 erros JS em: normal, `?simples=1`, `?semluzes=1&semneblina=1&sempoeira=1&escala=0.5`, `?perf=1` e qualidade Baixa.
- Cenário fixo (12 inimigos) por modo — chamadas de desenho / triângulos: Média 334 / 10 436; Baixa 246 / 7 760; `simples` 247 / 7 768; `semluzes` 253 / 8 224.
- O detector de GPU marcou "SOFTWARE" no ambiente de teste (SwiftShader), como esperado.

### Limites
- O teste foi em renderização por software: **não há benchmark em GPU real**. Tempo por quadro só vale no aparelho dele (use `?perf=1` + F10).
- Efeito real do modo Baixo sobre FPS no aparelho do usuário ainda não medido.
- Não mexe em armas, dano, IA, colisão nem balanceamento.

---



## Pacote 18 — Híbrido de fluidez (18/11/2026)

O P18 parte dos materiais leves e do cache de céu do P17 e restaura três proteções/otimizações presentes no P16:

- `prewarmAll()` cria um rig reutilizável por tipo de inimigo e aquece shaders, buffers e texturas antes de exibir o menu; após cada `loadMap`, `warmScene()` executa na transição/banner para antecipar o custo da nova arena.
- A luz de explosão fica visível e registrada na contagem de luzes desde o começo. Os pulsos mudam sua posição/intensidade, sem ligar/desligar `visible` durante o combate; isso evita alterar a quantidade de luzes e solicitar novas variantes de shader.
- A geometria de antena e os materiais básicos de badge/beacon são compartilhados entre rigs; o pooling e os materiais com estado por inimigo continuam conforme necessário.

O P18 mantém albedo-only em piso, blocos e decoração ambiental, PBR completo no Fuzil/mãos, cache de sky texture por paleta e o resto dos conteúdos. Armas, atributos, IA, movimento, colisão e layout dos mapas não mudaram. A política de resolução adaptativa permanece exatamente como no P17; o upscale/histerese do P16 ficou fora desta etapa.

### Validação

`./test.sh`, snapshots de combate/layout e `node --check` de todos os JavaScript passaram. Os módulos de armas, inimigos, pathfinding, táticas, progressão e upgrades são idênticos à base P16/P17.

No Chromium headless com SwiftShader, a instrumentação transitória de teste observou um pré-aquecimento na inicialização e mais um por troca de arena. O renderer reportou 11 programas WebGL após o aquecimento e continuou em 11 após simular e renderizar o pulso de explosão. O cenário `?perf=1` mostrou P18 e 12 inimigos, sem erro JavaScript. Em seis carregamentos alternados de Hangar/Pátio/Fábrica, o contador de geometria permaneceu em 62; após alocar as paletas na primeira visita, as texturas ficaram estáveis em 9 no menu do ensaio. O teste usou uma exposição de APIs dentro da rota HTTP do Chromium; essa instrumentação temporária não foi salva no código final.

### Limitações e próximo teste

O pré-aquecimento desloca trabalho para a abertura e para as transições; ele não elimina esse trabalho. Os valores de renderer.info acima confirmam estabilidade de contagem, não tempo de GPU nem redução garantida de frametime. Não foi coletado nesta etapa um novo benchmark comparável de P16/P17/P18 e não houve teste em dispositivo físico. O custo de abertura/transição e o resultado perceptível devem ser medidos no aparelho-alvo, usando `?perf=1`. A resolução adaptativa e a recuperação de nitidez do P16 podem ser avaliadas em uma etapa separada.


---

## Pacote 17 — Menos travamentos (resumo)

P17 parte do P16 unificado (visual PBR procedural nas três arenas, Fuzil e mãos industriais, telemetria local opcional) e faz uma otimização focada nas superfícies ambientais e nas trocas de mapa. O motor Three.js, HUD neon e conteúdo de combate continuam iguais.

## O que mudou

- Piso, obstáculos e decoração estática usam o albedo procedural compartilhado com roughness/metalness escalares. Os canvases e mapas de relevo/rugosidade não são criados para esses materiais ambientais.
- O Fuzil e as mãos continuam com os mapas PBR completos para manter o acabamento de perto.
- As texturas Canvas dos fundos são cacheadas por cor/arena; ao retornar a um mapa, o gradiente não é recriado.
- O Hangar continua reaproveitando decoração instanciada. Os módulos de combate (`weapons.js`, `enemies.js`, IA, progressão e upgrades) permanecem idênticos ao P16; sem ajuste de dano, cadência, munição, recarga, movimentação, colisão ou dificuldade.
- Sem dependências ou downloads externos. Cache offline avançado para P17.

## Executar e testar

Na pasta do projeto:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8000/`. Para iniciar o cenário fixo, abra `http://127.0.0.1:8000/?perf=1` e clique em **INICIAR CENÁRIO FIXO**. O modo de diagnóstico usa 12 inimigos, Hangar e Fuzil; não persiste score/carreira e não altera o jogo normal.

- **F8:** mostrar/ocultar a telemetria.
- **F9:** reiniciar o cenário e limpar a janela de coleta.
- **F10:** exportar CSV.
- Perda de foco/Pointer Lock pausa a medição; os quadros de pausa e a transição ao retomar não entram no CSV.

Execute `./test.sh` (ou `bash test.sh`) para os testes do núcleo e checks de sintaxe.

## Comparação local P16 → P17

Três pares sequenciais, mesma janela Chromium headless/SwiftShader, 1280×720, cenário fixo, 10,5 s por versão e descarte das três primeiras amostras. Valores abaixo são medianas dos quantis de cada execução, não uma medição de GPU física.

| Métrica | P16 | P17 | Variação |
| --- | ---: | ---: | ---: |
| Intervalo RAF p50 | 266,7 ms | 250,1 ms | −6,2% |
| Intervalo RAF p95 | 641,7 ms | 439,9 ms | −31,4% |
| CPU `update` p95 | 3,37 ms | 1,46 ms | −56,6% |
| `render-submit` p50 | 4,75 ms | 6,10 ms | +28,4% |
| `render-submit` p95 | 58,10 ms | 45,56 ms | −21,6% |
| Texturas WebGL ativas p50 | 31 | 24 | −22,6% |
| Draw calls p50 | 253 | 253 | sem mudança |

O `render-submit` mede trabalho síncrono de submissão no CPU, não o tempo final de GPU. O resultado é variável entre execuções e o renderer de software é o gargalo do próprio sandbox; não interprete os tempos RAF como FPS do seu aparelho. O P17 reduz recursos e construção repetida, mas ainda é necessário testar em um dispositivo/browser real para confirmar o ganho perceptível e localizar travamentos específicos.

## Evidências incluídas

- `p17-hangar-playtest.png`, `p17-patio-playtest.png`, `p17-fabrica-playtest.png`: capturas em jogo das três arenas.
- `p17-final-run1-p16.csv` a `p17-final-run3-p16.csv` e equivalentes `p17` : as três medições pareadas completas.
- `RELATORIO_ATUAL.md`: histórico P14–P17, resultados e limitações.


---


## Resumo executivo

Esta continuação preserva a estrutura original Three.js + scripts clássicos. O Pacote 14 modernizou somente o Fuzil existente, suas mãos e a arena inicial com materiais PBR procedurais; o Pacote 15 acrescenta telemetria local opt-in e um cenário fixo para medir travamentos sem persistir progresso nem alterar o jogo normal. Não houve publicação nem habilitação de serviços externos.

O Pacote 6 aprimorou os modelos das armas; o 7 acrescentou clarões específicos, rastros, faíscas, estojos e auras; o 8 adicionou marcas de impacto e respostas por superfície; o 9 trouxe luvas, acabamentos e fumaça; o 10 articulou dedos e recargas; o 11 aprofundou detalhes próximos e a assinatura visual por arma. O p12 recebido trouxe inércia do viewmodel, acabamento das luvas e clarão radial/lateral; o p13 adicionou calor, som de estojo e explosões em camadas. O p14 inicia a transição visual industrial controlada; o p15 cria instrumentos para localizar gargalos e orientar a próxima otimização.

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

`script.js` integra essas APIs ao runtime, ao combate, aos menus, à loja, à renderização e aos pools de efeitos; também constrói o Fuzil em componentes reutilizáveis e escolhe o perfil PBR do Hangar. `industrial-materials.js` gera e armazena mapas Canvas locais de cor, rugosidade e relevo. `style.css` contém a apresentação e o layout da interface.

## Comportamento do chefe

Os limiares são definidos por `Arena.bossPhase` em `enemies.js`: fase 1 acima de 66% de vida; fase 2 acima de 33% e até 66%; fase 3 com 33% ou menos.

1. **Fase 1 — rajadas:** a menos de 22 m, emite três projéteis por rajada, espaçados em 0,16 s. Inicia nova rajada a cada 2,8 s. Os projéteis viajam a 9 m/s e causam 16 de dano.
2. **Fase 2 — anel e reforços:** ao entrar, convoca dois Corredores e um Kamikaze, se houver espaço. O primeiro anel sai após 1,5 s e os seguintes a cada 4,5 s; cada um tem 14 projéteis radiais, a 6 m/s, com 12 de dano. As rajadas passam a quatro tiros a cada 2,5 s.
3. **Fase 3 — investida:** as rajadas passam a cinco tiros a cada 1,9 s e os anéis continuam. O chefe começa a buscar uma investida quando o jogador está a mais de 4 m. Pisca/telegrafa por 0,9 s, depois avança a 15 m/s por até 0,9 s ou até bloquear. Se chegar a menos de 1,8 m, causa 30 de dano uma vez por investida. A recarga entre investidas é 5,5 s e o chefe recebe brilho avermelhado nesta fase.

Os limiares, avisos, ataques, dano, velocidades e intervalos estão implementados em `script.js` e `enemies.js`.

## Testes realizados nesta continuação

- `./test.sh`: aprovado (`core tests: OK` e `syntax checks: OK`), incluindo snapshots dos atributos de combate, seleção de perfil industrial somente no mapa 0 e preservação das coordenadas/dimensões dos obstáculos.
- Chromium headless via HTTP (1280 × 720): menu fechado, canvas renderizado, Fuzil selecionado pelo fluxo normal de teclado e captura salva em `p14-rifle-playtest.png`; sem erros de console/JavaScript.
- Viewport móvel simulado em paisagem (844 × 390): HUD, controles de toque, retícula e Fuzil renderizados sem erros. Isso verifica layout, não mede FPS de hardware móvel.
- O service worker está em `arena-fps-v8-p14` e inclui `industrial-materials.js`; o servidor HTTP usado foi temporário, sem publicação.
- A captura confirma a composição do Hangar, contraste da retícula e leitura do Fuzil. Não foi executado playtest humano de disparo/recarga nem benchmark de FPS em aparelho móvel; essas medições permanecem pendentes.

## Performance histórica (medições do pacote 5; não reavaliadas no p14)

Medições curtas no navegador de teste, com viewport de 1280 × 1100, DPR 1 e uma cena carregada com 12 inimigos (incluindo o chefe), poeira e projéteis. WebGL2 permaneceu ativo sem perda de contexto.

| Qualidade | Resolução interna do canvas | FPS médio medido | Frametime P95 | Maior frametime observado |
|---|---:|---:|---:|---:|
| Baixa | 960 × 825 | 59,5 | 20,0 ms | 24,1 ms |
| Média | 1280 × 1100 | 44,9 | 29,5 ms | 48,4 ms |
| Alta | 1280 × 1100 | 47,9 | 26,4 ms | 30,0 ms |

Na amostra da cena carregada, o renderer indicou 43 chamadas de desenho, 484 triângulos, 260 pontos de poeira, 15 geometrias e 2 texturas. As amostras são breves e variam entre execuções; não representam uma garantia de FPS em outros computadores, navegadores ou dispositivos.

## Alterações e limitações

- No p14, `script.js`, `maps.js`, `index.html`, `sw.js`, `industrial-materials.js`, `tests/core.test.js`, `TODO.md`, `plan.md` e este relatório registram o piloto; `weapons.js` não foi alterado.
- Os detalhes históricos dos pacotes 1–13 permanecem nas seções abaixo; este topo resume somente a entrega p14.
- Recordes, desafios e cosméticos persistem no `localStorage` do navegador; não são sincronizados entre dispositivos nem enviados a servidor.
- A rotação e os parâmetros de missão foram testados como funções puras; a execução completa da vitória alternativa e a retirada de hostis não tiveram playtest manual nesta sessão.
- A tabela de desempenho abaixo registra uma amostra antiga do pacote 5 e não deve ser interpretada como benchmark do p14.

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

## Pacote 14 — Piloto industrial semi-realista (17/11/2026)

O escopo visual foi deliberadamente restrito ao Fuzil (índice 1), ao par de mãos associado e ao mapa inicial. `industrial-materials.js` cria uma biblioteca determinística de Canvas para mapas de cor, rugosidade e relevo, com perfis reutilizados e sem imagens remotas. O material PBR foi calibrado para o renderer atual sem HDRI: metalness reduzida e preenchimento quente/frio maior somente no Fuzil.

O modelo do Fuzil agora tem receptor sobreposto, coronha/soleira, cobertura, trilhos, ranhuras, mira compacta, ferragens, magazine em grupo móvel e caixas com bordas chanfradas. As peças repetidas de ventilação, trilho e magazine usam `InstancedMesh` para limitar draw calls. As luvas recebem tecido, borracha, costura e pequenos reforços procedurais; o movimento continua ligado aos grupos/animações existentes. As outras sete armas mantêm o caminho de materiais original.

O Hangar usa piso com placas e sinalização de segurança, superfícies de concreto e contêineres de metal pintado. As cores e os materiais mudam, mas os dez conjuntos de coordenadas e dimensões dos obstáculos permanecem idênticos, conforme as asserções de regressão. A ativação industrial depende de `look: 'industrial'`, presente apenas no mapa 0. Nenhuma regra, atributo em `weapons.js`, controle, HUD, câmera, colisão, navegação ou linha de tiro foi alterada.

### Validação do pacote 14

- `./test.sh`: aprovado (`core tests: OK`; `syntax checks: OK`), com snapshots de combate e verificação do tema do mapa/obstáculos.
- Playtest Chromium headless por HTTP: partida iniciada, HUD/canvas ativos, Fuzil selecionado e sem erros de console/JavaScript; captura `p14-rifle-playtest.png` incluída no pacote.
- O cache offline foi versionado para `arena-fps-v8-p14` e a nova biblioteca Canvas foi incluída.
- O playtest foi visual e curto. Não houve teste humano de tiro/recarga, benchmark comparativo de FPS nem verificação em dispositivo móvel físico; o uso de geometrias compartilhadas e `InstancedMesh` reduz custo repetitivo, mas não substitui essas medições.


## Pacote 15 — Telemetria e cenário para reduzir travamentos (17/11/2026)

`perf-telemetry.js` adiciona um buffer circular local para até 3.600 quadros, resumos p50/p95/p99/máximo e exportação CSV. O painel só é criado quando a URL inclui `?perf=1`; fora desse modo não há buffer de amostras, wrappers de IA ou painel. A coleta registra intervalo entre `requestAnimationFrame`, CPU de `update` e tempo síncrono da chamada `renderer.render`, recursos/draw calls/triângulos, qualidade/pixel ratio e contadores de colisão, visibilidade e A*. O tempo de `render` é submissão CPU e não representa o tempo concluído da GPU.

O modo de diagnóstico inicia uma situação fixa no Hangar: Sobrevivência/Normal, Fuzil selecionado e 12 inimigos de tipos/posições predefinidos. Durante essa sessão de teste, dano recebido é ignorado e inimigos não podem ser eliminados, mantendo uma carga estável; não há alteração de score/carreira/desafios/recordes. F8 mostra/oculta o painel, F9 reinicia o cenário e F10 exporta os últimos quadros a CSV. Essa exceção só existe com `?perf=1`; o fluxo e os atributos de combate da partida comum permanecem intactos. O cenário e a coleta não enviam dados à rede.

### Validação do Pacote 15

- `./test.sh`: aprovado (`core tests: OK`; `syntax checks: OK`), incluindo quantis, sobrescrita circular, reset e CSV.
- Chromium headless com SwiftShader, 1280 × 720, cenário visível por 60 s: 426 amostras, 12 inimigos ativos e zero erros JavaScript. A captura é `p15-telemetry-playtest.png`; os dados brutos estão em `p15-headless-60s.csv`.
- Nesse ambiente específico: frametime p50 133,4 ms, p95 166,7 ms, p99 483,4 ms, máximo 916,7 ms; CPU de `update` média 0,98 ms/p95 1,5 ms; submissão CPU de `render` média 8,45 ms/p95 31,4 ms; último quadro com 219 draw calls, 7.824 triângulos, 111 geometrias e 31 texturas. O perfil indica que a atualização de jogo não foi o custo dominante nesse teste, mas o resultado é fortemente condicionado ao Chromium headless/SwiftShader e à máquina sandbox.
- Verificados também: F9 reinicia mantendo os 12 inimigos; F10 baixa CSV; painel presente no modo de diagnóstico e ausente em URL normal; viewport móvel simulado 844 × 390; `localStorage` permanece igual antes/depois de iniciar o cenário.
- Limitação: não houve medição em celular/GPU física nem uso de timer de GPU WebGL. Os números headless servem como referência de instrumentação, não como FPS esperado para o jogador. A próxima rodada deve coletar o CSV no dispositivo/browser-alvo e priorizar a investigação do caminho de renderização se o frametime alto se repetir.
- Cache offline versionado como `arena-fps-v8-p15`, com `perf-telemetry.js` incluído.

## Pacote 16 — Mescla p15 + p14 de mapas e correções anti-travamento (17/11/2026)

### Ordem das atividades (Fácil → Médio → Difícil)

| # | Nível | Atividade | Arquivos |
|---|---|---|---|
| 1 | Fácil | Base = p15 (traz telemetria `?perf=1` e Fuzil/Hangar). Do p14 "gráficos industriais" entram os nomes de setor (`theme`) e a linha de banner da nova arena. | `maps.js`, `script.js` |
| 2 | Fácil | Cache offline versionado para `arena-fps-v8-p16`. | `sw.js` |
| 3 | Médio | Look industrial nos 3 mapas reutilizando as mesmas texturas do `industrial-materials.js` (cor do piso por mapa via `floorTint`); em qualidade Baixa os blocos voltam a materiais simples e o cenário decorativo não é criado. | `maps.js`, `script.js` |
| 4 | Médio | Luz de explosão deixa de ser ligada/desligada durante o jogo. | `script.js` |
| 5 | Médio | Geometria da antena e materiais de selo/farol dos inimigos compartilhados (antes: um novo por inimigo). | `script.js` |
| 6 | Difícil | Aquecimento (`warmScene`/`prewarmAll`): compila shaders e sobe geometrias/texturas antes de jogar e a cada troca de mapa. | `script.js` |
| 7 | Difícil | Resolução adaptativa em qualquer aparelho: desce rápido se o quadro passar de 26 ms, sobe devagar (3 janelas de 60 quadros abaixo de 18,5 ms) até o teto da qualidade. Desligada em `?perf=1`. | `script.js` |

### Conceitos praticados e justificativa

- **Recompilação de shader por contagem de luzes (Three.js r128):** luz com `visible = false` sai da contagem; mudar a contagem muda a chave dos programas e todos os materiais com luz são recompilados. Ligar a luz de explosão no primeiro estouro causava esse congelamento. Agora ela só muda de visibilidade quando a qualidade muda, no menu; em jogo só a intensidade varia.
- **Primeiro uso na GPU:** shader, buffer de geometria e textura só são enviados na primeira vez que o objeto é desenhado. Um quadro de aquecimento com tudo visível, no menu, paga esse custo antes da partida. Na troca de mapa o aquecimento roda durante o banner.
- **Reuso:** como as texturas PBR são por tipo de superfície, não por mapa, estender o look aos 3 mapas não aumentou o número de texturas (31 no p15 e no p16).
- **Resolução adaptativa com histerese:** descer rápido evita travada sustentada; subir devagar evita oscilação.

### Testes e medições

- `./test.sh`: aprovado. O teste de mapas foi atualizado: os 3 mapas têm `look` industrial, `theme` e `floorTint`; as coordenadas dos obstáculos do mapa 0 continuam fixadas por asserção.
- Chromium via HTTP: sem erros de console/JavaScript em qualidade Baixa, Média e Alta, no modo `?perf=1` (painel presente, 12 inimigos) e nas trocas de mapa 0→1→2→0. O Fuzil dispara em qualidade Alta.
- Programas de shader compilados (`renderer.info.programs`): p15 = 6 no menu e 7 depois da primeira explosão (compilou durante o jogo); p16 = 9 no menu e 9 depois da explosão (nada novo compila em combate). Capturas em `capturas/`.
- Custo do aquecimento na abertura: 129 ms em renderizador por software.
- Chamadas de desenho, triângulos e texturas ficaram iguais às do p15 (156 / 7 160 / 31), pois esta entrega não mudou o desenho em si.

### Limitações

- O frametime mediano no teste (~507 ms, SwiftShader) é idêntico ao do p15 (~509 ms): **não há ganho de FPS médio medido**. O ganho esperado é nas travadas pontuais (primeira explosão, primeira aparição de cada inimigo, troca de mapa), e isso foi verificado pela contagem de shaders, não por cronômetro de quadro. O SwiftShader é lento demais para medir travadas de milissegundos.
- Resolução adaptativa, aquecimento e qualidade Baixa não foram testados em celular ou GPU física. Use `?perf=1` no aparelho-alvo e exporte o CSV (F10) para comparar com o p15.
- Cada inimigo ainda usa cerca de 15 malhas (≈150 chamadas de desenho com 12 inimigos); fundir as peças é a próxima otimização provável, mas altera a estrutura dos rigs e exige playtest.
- Não houve playtest humano.


## Pacote 21 — Terminais físicos detalhados (18/11/2026)

A antiga representação de mesa + tela foi substituída por um módulo visual reutilizável em `terminal-props.js`. O Console KVM agora tem gabinete/rack, monitor com moldura, teclado com teclas, trackball, leitor, LEDs, parafusos, cabos e painel de manutenção. O Console de Rede tem rack alto, patch panel, portas, indicadores de atividade e cinco cabos coloridos. O Console Central do Datacenter tem três monitores, rack central, teclado, módulos laterais, indicadores de temperatura/energia e cabeamento.

Os três terminais receberam `kind` e orientação próprios em `incursion.js`. Os props são decorativos e entram em `mapMeshes`, portanto são removidos na troca de mapa sem adicionar caixas a `solids`/`boxes`; a mesa-base e os caminhos A* continuam iguais. O runtime atualiza estados `standby`, `detected`, `intrusion`, `committed` e `locked` conforme o setor, proximidade, progresso de invasão e alarme. A aproximação de câmera e a operação física segurando E continuam reservadas ao Pacote 22.

### Validação p21

- `./test.sh`: aprovado (`core tests: OK`; `incursão: OK`; `syntax checks: OK`), incluindo tipos dos três terminais, orientações, integração HTML e cache.
- Todos os JavaScript e `sw.js`: `node --check` aprovado.
- HTTP local: `index.html`, `script.js`, `incursion.js`, `terminal-props.js`, `sw.js` e `manifest.json` retornaram HTTP 200.
- Boot no Chromium headless 1280×720: captura `arena-fps-p21-menu.png` gerada sem falha de inicialização.
- Cache offline versionado para `arena-fps-v8-p21` e `terminal-props.js` incluído no núcleo.
- Sem CDN externa adicionada; todas as geometrias e materiais dos terminais são locais.

### Limites p21

Ainda não houve playtest humano completo aproximando-se dos três terminais nem validação de legibilidade em Baixa/Média/Alta. A interação de câmera, cancelamento por dano e tela NEXUS integrada ao monitor ficam para os Pacotes 22 e 23. Não houve medição de FPS em aparelho móvel físico.


## Pacote 22 — Interação física em primeira pessoa (18/11/2026)

A incursão agora apresenta um prompt contextual de operação próximo ao terminal. O prompt só oferece a ação quando o jogador está dentro do raio e olhando para o console; se estiver próximo, mas fora do cone de visão, orienta `OLHE PARA O TERMINAL`. A linha de visão usa raycast contra os obstáculos sólidos existentes, sem adicionar colisões aos props decorativos.

Ao segurar E, o jogador entra em um estado de operação: o movimento é reduzido para 18% para não congelar a partida, a câmera aproxima ligeiramente, reduz o campo de visão em até 6 graus e centraliza suavemente no monitor. Monitores e LEDs continuam reagindo ao estado de invasão. Inimigos permanecem ativos e podem contestar o terminal, reduzindo a velocidade do progresso pela regra já existente.

A operação é cancelada quando o jogador recebe dano, morre, se afasta, perde a linha de visão ou o terminal deixa de ser o alvo atual. O progresso volta a zero, o prompt informa o motivo e o sistema exige que E seja solto antes de uma nova tentativa, evitando reinício acidental enquanto o botão permanece pressionado. O modo toque e o gamepad reaproveitam o mesmo estado de operação pelo botão USAR/ação correspondente.

### Validação p22

- `./test.sh`: aprovado (`core tests: OK`; `incursão: OK`; `syntax checks: OK`).
- Todos os JavaScript e `sw.js`: `node --check` aprovado.
- HTTP local e boot no Chromium headless 1280×720: aprovados; captura `arena-fps-p22-menu.png` gerada.
- Cache offline versionado como `arena-fps-v8-p22`.
- Não houve alteração em armas, dano, hitboxes, A*, IA, balanceamento ou regra abstrata de hacking.

### Limites p22

A validação automatizada confirma a integração e o boot, mas ainda falta um playtest humano aproximando-se de cada terminal em desktop e toque. Também falta comparar visualmente Baixa/Média/Alta e medir o custo em aparelho Android real. O Pacote 23 continua responsável pela interface NEXUS integrada ao monitor.


## Mescla seletiva p21 — três prédios preservando p22 (19/11/2026)

A versão p21 enviada pelo usuário foi auditada e trouxe três prédios jogáveis para a Incursão: Complexo, Refinaria e Laboratório. Esses dados foram incorporados seletivamente à base p22. O menu agora possui `Prédio (Incursão)`, o carregamento usa `INCURSION_LEVELS`, e cada prédio possui layout, terminais, saída, dicas, cor temática e pontos de spawn próprios.

Os terminais simples de mesa + tela da p21 não foram incorporados. Cada terminal dos três prédios recebeu tipo e orientação para continuar usando `terminal-props.js` da p22. O prompt contextual, raycast de linha de visão, aproximação/foco de câmera, redução de movimento, cancelamento por dano/afastamento e interação por teclado/toque/gamepad foram preservados. Armas, dano, IA, colisões e regras de vitória permanecem inalterados.

### Validação da mescla

- `./test.sh`: aprovado (`core tests: OK`; `incursão: OK`; `syntax checks: OK`), agora cobrindo os três prédios, caminhos A*, centro livre, spawns livres, tipos/orientações dos terminais e integração do seletor.
- Todos os JavaScript, `sw.js` e manifesto: sintaxe/estrutura aprovadas.
- HTTP local: recursos principais retornaram HTTP 200.
- Boot Chromium headless 1280×720: aprovado; captura `arena-fps-merge-menu.png` gerada.
- Backup preservado em `/home/ubuntu/arena-fps-p22-before-p21-merge` para rollback.
- Cache offline atualizado para `arena-fps-v8-p22-buildings`.

### Limitações da mescla

Ainda falta playtest humano nos três prédios e validação visual dos consoles físicos em Baixa/Média/Alta. A p21 foi testada isoladamente em boot e testes; a mescla foi testada em núcleo, HTTP e boot, mas não houve uma execução manual completa da campanha mesclada em aparelho físico. A interface NEXUS continua sendo a próxima camada visual planejada.


## Pacote 23 — Interface hacker NEXUS (19/11/2026)

### Pacote concluído

A tela cenográfica de invasão foi transformada em uma estação operacional fictícia chamada **NEXUS // OPERATIONS CONSOLE**. A camada mantém as mesmas fases de gameplay (`choose → run → done`) e as mesmas opções/efeitos de incursão, mas apresenta o fluxo com uma linguagem visual de terminal físico avançado.

### Alterações

- Nova moldura NEXUS com barra de estado, link local, modo seguro e identificação de simulação.
- Painel lateral de perfil de nó com `NX-07`, integridade, risco de rastreamento, sistema fictício `NX/ARCHIVE`, link `FIBER-07` e modo `OFFLINE SIM`.
- Topologia de rede em Canvas ampliada, com grade, links, pulsos de conexão, núcleo destacado, fluxo de pacote, contador de frame e rótulos de rota.
- Cartões de operação com estados de seleção, foco, risco e confirmação.
- Console de logs com sequência de conexão, bloqueio e resultado fictício.
- Scanline, grade holográfica, glow, pulsos de status e barras segmentadas implementados somente com CSS/Canvas local.
- Aviso explícito de que nenhum comando real, rede externa ou sistema operacional é acessado.
- Layout responsivo: painel lateral é ocultado em telas estreitas e opções passam para uma coluna.
- Suporte a `prefers-reduced-motion`, contraste, foco de teclado e leitura em toque preservados.
- Cache offline atualizado para `arena-fps-v8-p23-nexus`.

### Preservado

Não foram alterados dano, cadência, munição, IA, hitboxes, colisões, navegação A*, condições de vitória, escolhas de segurança, objetivos finais ou regras de alarme. A interface continua sendo apenas uma apresentação de jogo, sem executar comandos ou acessar sistemas reais.

### Validação

- `./test.sh`: aprovado.
- Sintaxe de todos os JavaScript e `sw.js`: aprovada.
- Manifesto: válido.
- Ausência de CDN externa: confirmada.
- HTTP local dos recursos principais: todos retornaram 200.
- Boot Chromium headless em viewport desktop 1280×720: aprovado.
- Boot Chromium headless em viewport mobile 390×844: aprovado.
- Prévia visual estática do modal NEXUS em desktop: conferida.
- Backup anterior preservado em `/home/ubuntu/arena-fps-p23-before-nexus`.

### Limitações

A validação visual do modal foi feita em prévia estática e a validação funcional em boot/testes; ainda falta playtest humano abrindo os três terminais nos três prédios. A interface NEXUS ainda não é desenhada diretamente dentro das telas dos consoles físicos; essa é a próxima camada planejada. Não houve medição de FPS em aparelho móvel real.

### Próximo pacote

Integrar uma versão compacta da identidade NEXUS aos monitores físicos KVM, Rede e Datacenter e fazer as escolhas alterarem LEDs, racks, portas, câmeras e iluminação dos prédios.

## Pacote 24 — Mescla p23 + portas/câmeras, consoles leves (21/11/2026)

**Base:** seu p23 (interface NEXUS, `terminal-props.js`). Trazidos do p22: portas e câmeras de segurança nos 3 prédios.

### Ordem das atividades (Fácil → Difícil)
| Nível | Atividade | Conceito praticado | Justificativa |
|---|---|---|---|
| Fácil | Texto das opções ("sem alertas") e log inicial `[SIM] aguardando seleção…` | Dados separados da lógica | Só muda texto em `incursion.js`/`script.js`. |
| Fácil | Cache `arena-fps-v8-p24` | Service Worker / versionamento | Força o PWA a baixar os arquivos novos. |
| Fácil | `Arena.holdAllowed` (progresso do hold respeita `lockout`) | Função pura e testável | Corrige o bug do p23: segurar E durante o bloqueio por dano ainda enchia a barra. |
| Médio | Portas (lista `doors`) e câmeras (cone + linha de visão) por prédio | Produto escalar, `lineClear`, listas de dados | Porta é só visual (colisão/IA inalteradas); câmera detecta no cone sem parede. |
| Médio | Alerta só troca cores (faixa e névoa) | Custo de shaders no Three r128 | Mudar nº de luzes recompila shaders; cor não. |
| Médio | Material próprio por terminal (`ownMat`) | Estado isolado | No p23 todos os terminais compartilhavam o material e as telas mudavam juntas. |
| Difícil | `mergeByMaterial`: funde os meshes do console por material em 1 `BufferGeometry` | Geometria manual (posições/normais/índices), descarte (`dispose`) | Console passou de 56/76/66 para 15/16/18 meshes. |
| Difícil | Rótulos do canvas na base e grafo escalado (`KX/KY`) | Canvas 2D responsivo | Rótulos não cobrem mais o grafo. |

### Testes
- `./test.sh` aprovado (inclui testes p24: portas, câmeras, cone, `holdAllowed`, ≤24 meshes/console, cores distintas, materiais não compartilhados).
- Chromium/SwiftShader: fluxo completo (infiltrar → rede → datacenter → fuga → vitória) sem erro JS; lockout mantém hold em 0; 8 portas e 3 câmeras no Complexo; câmera dispara alerta de 12 s.
- Draw calls (4 pontos): p24 193/153/173/164 · p23 290/194/211/183 · p22 164/139/159/151. Triângulos ≈ iguais ao p23; geometrias 115 (p23 108, p22 66); programas 11 nos três.

### Limites
- Medidas são de renderizador por software: só valem como comparação relativa. FPS real em celular/GPU continua **não medido** (use `?perf=1` e envie o CSV).
- Portas não bloqueiam tiro nem visão dos inimigos. Armas, dano, IA, colisão e balanceamento não foram alterados.
- Toda a "invasão" é cenográfica; nenhum comando ou rede real.

## Pacote 25 — Marcadores 3D do drone (21/11/2026)

| Nível | Atividade | Conceito praticado | Justificativa |
|---|---|---|---|
| Fácil | Cache `v8-p25`, canvas `#droneOverlay` + CSS | Camadas sobrepostas, `pointer-events: none` | O marcador não atrapalha mouse/toque. |
| Médio | `Arena.droneScreenPos` (função pura) | Coordenadas NDC → pixels, borda | Testável em Node; marcador fora da tela fica preso à borda, atrás da câmera não aparece. |
| Médio | `drawDroneMarks()` | `Vector3.project(camera)`, Canvas 2D | Com o drone ativo (F), mostra inimigos, console/saída e câmeras com distância, atravessando paredes. Fora do drone não desenha nada (custo zero). |

Testes: `./test.sh` aprovado (inclui p25); Chromium: marcador de câmera/console aparece, canvas limpo ao fim do drone, 0 erros JS. Armas, dano, IA, colisão e balanço não foram alterados.
**Medição de celular:** abra `?perf=1`, jogue ~60 s e envie o CSV exportado (e `chrome://gpu`). Ainda não medido.

### P25 (parte 2) — NEXUS nos monitores físicos
| Nível | Atividade | Conceito praticado | Justificativa |
|---|---|---|---|
| Fácil | Texto da tela por estado (STANDBY, ENLACE DETECTADO, INTRUSÃO SIM…, CONCLUÍDO, ACESSO NEGADO) | Mapa de dados | Textos fictícios, só cenografia. |
| Médio | UVs mantidos na fusão de malhas | Atributos de `BufferGeometry` | Sem UV a textura não aparece na malha fundida. |
| Médio | Uma `CanvasTexture` 256×128 por terminal, em tons de branco; `material.color` tinge pelo estado | Textura dinâmica, tinta por multiplicação | A cor de estado (p24) continua valendo sem redesenhar cores. |
| Difícil | `Arena.paintIncursionScreen` (grade + grafo animado), ≤ ~6 quadros/s e só a menos de 14 m | Orçamento de custo, `needsUpdate` | Evita enviar textura à GPU toda frame e para terminais distantes. |
| Difícil | `dispose` da textura ao trocar de mapa | Gestão de memória GPU | Sem vazamento entre fases. |

Testes: `./test.sh` aprovado (textura própria por terminal, UV nas malhas, repintura limitada); Chromium sem erros JS e capturas dos 3 consoles. Programas de shader: 12 (eram 11), pois a tela agora usa `map`; o aquecimento do menu já cobre isso. Não medido em GPU real.

## Pacote 26 — Portas barram os tiros dos inimigos (21/11/2026)

| Nível | Atividade | Conceito praticado | Justificativa |
|---|---|---|---|
| Fácil | Guardar `axis` em cada porta e cache `v8-p26` | Dados completos | A regra precisa saber a orientação da porta. |
| Médio | `Arena.doorBlocks` / `pointBlockedByDoors` (função pura) | Teste de caixa (AABB) 2D | Porta fechada (`open < 0.5`) ocupa 4 m × 0,6 m; aberta é livre. |
| Médio | `segmentBlockedByDoors` | Amostragem de segmento (passo 0,25 m < espessura) | Evita "tunelamento" do raio pela porta fina. |
| Difícil | Integração: projétil some ao tocar porta fechada; atirador à distância não dispara se a porta fechada estiver no caminho | Mínima intervenção na IA | Só adiciona uma condição; movimento, A*, colisão e dano não mudam. |

Testes: `./test.sh` aprovado; Chromium: projétil que cruza porta fechada some (1 → 0), 0 erros JS.
**Decisões a conferir:** tiros do jogador continuam atravessando a porta (não alterei armas); inimigos corpo a corpo e o chefe não mudaram; a "visão" dos inimigos (perseguir) segue igual, só o tiro é barrado. Armas, dano e balanceamento: intocados.

## Pacote 27 — Torretas de segurança (21/11/2026)

| Nível | Atividade | Conceito praticado | Justificativa |
|---|---|---|---|
| Fácil | Cache `v8-p27`; constantes `Arena.TURRET` (alcance 14 m, carga 0,6 s, intervalo 1,6 s, dano 4) | Números mágicos em um lugar | Balanceamento fácil de ajustar. |
| Médio | `Arena.turretsFor(cameras)`: 2 torretas por prédio, 1,6 m à frente das câmeras | Reuso de dados já validados | Posição já está fora das paredes; teste confirma nos 3 prédios. |
| Médio | Visual: base + cabeça giratória + lente vermelha (poucos meshes, material básico, sem luz nova) | Custo de render | Não recompila shaders. |
| Difícil | `Arena.turretStep` (máquina de estados pura: carregar → atirar → recarregar; perder o alvo zera a carga) | Regra pura testável | O aviso de 0,6 s dá chance de reação. |
| Difícil | `updateIncTurrets`: alcance + `lineClear` + porta fechada barra; desligadas quando as câmeras estão desligadas (`camerasOff`) | Integração mínima, reaproveita `shootProjectile` | Mesmo projétil e dano escalado pela dificuldade; as portas do p26 também as bloqueiam. |

Testes: `./test.sh` aprovado (posição fora das paredes, estados da torreta); Chromium: ativa → vida 9999→9991 (2 tiros), desligada → 0 projéteis, 0 erros JS.
**Decisão de balanceamento (confirme):** dano 4 por tiro (×dificuldade), a cada 1,6 s, só dentro de 14 m e com linha livre; torretas são indestrutíveis (só desligam com a escolha de segurança/derrubar). Armas, IA e dano existentes: intocados.

## Pacote 28 — Prédio com vários blocos: Campus A–E (21/11/2026)

| Nível | Atividade | Conceito praticado | Justificativa |
|---|---|---|---|
| Fácil | 4ª opção no seletor de prédio e cache `v8-p28` | HTML semântico, versionamento do PWA | Nada mais muda na interface. |
| Médio | `buildCampus()` com os mesmos ajudantes `wallX`/`wallZ` (5 blocos em fila, divisórias com 2 portas cada) | Reuso e dados declarativos | Mesmo formato dos outros prédios; as portas animadas do p22 funcionam sem código novo. |
| Médio | Estágios espalhados pelos blocos: C (início) → D → A → E → saída em B; dicas citam os blocos | Level design: força cruzar o prédio todo | O jogador usa as portas e passa pelas câmeras/torretas. |
| Difícil | Teste automático de alcance: A* de (0,0) até cada console e a saída; spawns, câmeras e torretas fora das paredes | Validação de dados, A* | Garante que nenhum bloco ficou isolado ou com item dentro da parede. |

Testes: `./test.sh` aprovado (incl. p28); Chromium: Campus carrega, 8 portas, 0 erros JS; draw calls 159–232 conforme o ponto (renderizador por software, só relativo).
Armas, dano, IA, colisão e balanceamento: intocados. Os mapas de combate (modo normal) não mudaram.
**Limite:** o Campus usa a mesma área de 56×56 (a cadeia ocupa 56×32, o resto fica vazio/fechado). Prédios maiores exigiriam aumentar `ARENA`, o que afeta tudo, então não fiz.

**Fluxo completo no Campus (Chromium):** infiltrar (D) → rede (A, escolha de segurança) → datacenter (E, 3 objetivos combinados) → fuga (B) → MISSÃO CUMPRIDA, 0 erros JS. O tempo de 'segurar E' foi encurtado no teste (renderizador por software é lento); a posição/linha de visão dos consoles foi validada de verdade.

## Pacote 29 — Torretas destrutíveis (21/11/2026)

| Nível | Atividade | Conceito praticado | Justificativa |
|---|---|---|---|
| Fácil | `Arena.TURRET.hp = 40`, cache `v8-p29`, marcador `TORRETA` no drone | Constantes de balanceamento | Valor único, fácil de ajustar. |
| Médio | `Arena.turretHit` (função pura) e `turretStep` ignora torreta destruída | Estado `dead`, testes de unidade | Mesmo padrão dos inimigos; testado em Node. |
| Difícil | Integração no raio do tiro: partes da torreta viva entram na lista de alvos, `userData.turret`, queda de dano pela distância (mesma fórmula) | `Raycaster`, `userData` | Sem alterar armas: só um ramo novo no laço de acertos; a torreta bloqueia o tiro como o cenário. |
| Difícil | `destroyTurret`: explosão, some o modelo, +50 pontos, aviso no feed | Reuso de efeitos existentes | Nenhuma luz nova (sem recompilar shaders). |

Testes: `./test.sh` aprovado; Chromium: pistola a 6 m destrói a torreta (40 → −15 de HP), modelo some, +50 pontos, 0 erros JS. Armas, dano, IA, colisão e balanceamento existentes intocados.
**Decisão (confirme):** HP 40 e +50 pontos são palpites meus.

## Pacote 30 — Cyberdeck: laptop com shell Kali/Arch (21/11/2026)

| Nível | Atividade | Conceito praticado | Justificativa |
|---|---|---|---|
| Fácil | `deck.js` registrado no `index.html` e no cache `v8-p30`; botão `⌨ DECK [T]` | Estrutura de arquivos, PWA | Mesma organização dos outros módulos. |
| Fácil | Visual do laptop (CSS com variáveis `--bg/--ac`; skins Kali e Arch) | Custom properties, `color-mix` | Trocar de skin é só trocar a classe. |
| Médio | `Arena.deckRun(linha, contexto)`: interpretador puro (alias, `sudo`, `help`, `scan`, `jam`, `theme`, `neofetch`…) | Parsing de string, função pura testável | Fica testado em Node, sem DOM. |
| Médio | Prompt por skin: Kali = zsh em 2 linhas, Arch = bash em 1 linha; mensagens de erro de cada shell | Dados por configuração | Dá a sensação do sistema sem copiar logos. |
| Difícil | Integração no jogo: T abre o deck e congela a Incursão (`choiceOpen`); histórico com ↑/↓; Esc fecha | Foco de teclado, pointer lock | Reaproveita o mesmo mecanismo do modal NEXUS. |
| Difícil | Efeitos de jogo: `scan` marca inimigos/câmeras/torretas/console por 8 s (recarga 20 s); `jam` desliga câmeras e torretas por 12 s (recarga 40 s) | Estados com tempo e recarga | Dá função de jogo ao laptop, sem alterar armas, dano ou IA. |

**Segurança / cenografia:** nada é executado de verdade e não há rede. Ferramentas reais (hydra, msfconsole, sqlmap, ssh, ping, etc.) só respondem "desativado neste jogo". Os IPs são da faixa de documentação 192.0.2.x. Os nomes `nmap`, `apt`, `pacman` são só sabor.
Testes: `./test.sh` aprovado (interpretador, recargas, skins, ferramentas reais bloqueadas, IPs só da faixa 192.0.2.x); Chromium: T abre, digitação e Enter funcionam, trocar skin muda cores/prompt, scan/jam ativam e esfriam, Esc fecha, 0 erros JS.
**Decisões a conferir:** tempos/recargas de scan (8/20 s) e jam (12/40 s) são palpites meus. Limite: o laptop é uma tela sobreposta, não um modelo 3D na mão do personagem.

## Pacote 31 — Detalhes do cyberdeck: sons, animação e comandos (21/11/2026)

| Nível | Atividade | Conceito praticado | Justificativa |
|---|---|---|---|
| Fácil | Linhas CRT (`::after` com `repeating-linear-gradient`) e estilo `.hint` | CSS moderno, pseudo-elementos | Visual de tela de laptop sem imagem. |
| Fácil | Comandos novos: `status`, `date`, `uptime`, `ip a`, `echo`, `history`, `motd` | Mapa de comandos | Todos fictícios; `status` mostra recargas, câmeras, alarme, vigilância. |
| Médio | Sons sintetizados: tecla, Enter, abrir, erro, boot, scan (varredura), jam (ruído + grave) | Web Audio (osciladores e ruído) | Sem arquivos de áudio, no mesmo padrão do `audio.js`. |
| Médio | Chips SCAN/JAM no topo (pronto / ativo Ns / recarga Ns) | Estado visível, `aria` | O jogador vê as recargas sem digitar `status`. |
| Médio | `Arena.deckComplete` (Tab): completa comando e argumento do `theme`; várias opções são listadas | Prefixo comum, função pura | Testado em Node. |
| Difícil | Saída "digitando": fila com `setTimeout` (38 ms por linha, 90 ms no boot); limpa/fecha esvazia a fila na hora | Fila assíncrona, cancelamento | Sensação de terminal sem travar a entrada. |
| Difícil | Boot por skin (`Arena.deckBoot`) na 1ª abertura de cada visual | Dados por configuração | Kali mostra zsh, Arch mostra bash. |

Testes: `./test.sh` aprovado (Tab, boot, status, date, ip, history); Chromium: boot animado, Tab (`sta`→`status `, `s`→lista `scan status`), chips, 0 erros JS. Os sons foram só confirmados sem erro (não ouvi o áudio). Armas, dano, IA, colisão e balanceamento: intocados.

## Pacote 32 — `connect`: o deck prepara a invasão do console (21/11/2026)

| Nível | Atividade | Conceito praticado | Justificativa |
|---|---|---|---|
| Fácil | Comando `connect` em `help`, Tab e cache `v32` | Dados e lista de comandos | Descoberta fácil para o jogador. |
| Médio | `deckRun` devolve `fx.connect` conforme o estado (`ready/far/primed/exit`) e mensagens de aviso | Função pura, estados explícitos | Testado em Node sem DOM. |
| Difícil | `deckConnectState()` e efeito: adianta 50% de `inc.hold` (uma vez por setor, `primedStage`) | Integração com a mecânica existente | O jogador ainda precisa segurar E; a barra decai 0,25/s se ele se afastar, então não é "pular o setor". |

Testes: `./test.sh` aprovado; Chromium: longe → recusa; perto → hold 0 → 2 (de 4); repetir → "já preparada"; segurar E conclui o setor; 0 erros JS.
**Decisão (confirme):** 50% de adianto e 1 uso por setor são palpites meus; o deck congela o jogo enquanto aberto, então o `connect` reduz o tempo de exposição no console, não o torna instantâneo. Armas, dano, IA, colisão: intocados.

## Pacote 33 — Animações do hacker e do cyberdeck (21/11/2026)

| Nível | Atividade | Conceito praticado | Justificativa |
|---|---|---|---|
| Fácil | Tampa do laptop abrindo (`@keyframes deckLid`) e chips SCAN/JAM pulsando quando prontos | CSS `animation`, `color-mix`, `box-shadow` | Sem JS e sem custo de render. |
| Fácil | Glitch (RGB/translate) ao rodar `jam` ou errar um comando | Reinício de animação por classe (`offsetWidth`) | Feedback imediato. |
| Fácil | Todas as animações respeitam `prefers-reduced-motion` | Acessibilidade | Quem desativa movimento no sistema não vê. |
| Médio | Barra de progresso animada (`[██████░░░░] 60%`) em `scan`, `jam` e `connect` | Fila assíncrona com tipo `bar`, `setTimeout` | A fila principal espera a barra acabar; `flush` completa a barra. |
| Médio | Anel azul do scan crescendo pelo chão (RingGeometry + MeshBasicMaterial transparente) | Escala/opacidade por tempo | Não usa luz dinâmica. |
| Médio | Marcadores 2D "travam" no alvo (começam 3,4× maiores e encolhem em 0,4 s) e pulsam a menos de 8 m | Interpolação com tempo real (`performance.now`) | Independe do congelamento do jogo. |
| Difícil | Câmeras e torretas "desligam": `power` 1→0 suave, cabeça cai, lente pisca ao apagar e volta ao religar | Transição com lerp, `Euler.order = 'YXZ'`, pivô no centro da cabeça | A cabeça gira em torno de si, não do chão. |

Testes: `./test.sh` aprovado; Chromium: câmera 1→0,04 (cabeça 0,53 rad), torreta 1→0,04 (0,58 rad), lente apaga, barra 100%, anel visível (escala 4,8, opacidade 0,66), 0 erros JS. Armas, dano, IA, colisão: intocados.
**Não feito (p34):** laptop 3D na mão do personagem.

## Pacote 34 — Laptop 3D na mão do personagem (22/11/2026)

| Nível | Atividade | Conceito praticado | Justificativa |
|---|---|---|---|
| Fácil | Cache `v8-p34`; a arma some enquanto o laptop está na mão (`holder.visible`) | Visibilidade de objetos 3D | Evita arma e laptop se sobrepondo. |
| Médio | Modelo do laptop só com caixas (base, teclado, touchpad, tampa, tela) e `MeshLambertMaterial` | Composição de `Mesh` simples, pivô na dobradiça | Poucos meshes, sem shader novo pesado; a cor da tela segue o visual Kali/Arch. |
| Difícil | Animação em fases: sobe (ease-out cúbico) → abre a tampa (smoothstep) → overlay aparece; fechar faz o inverso | Máquina de estados (`deckAnim`, `deckShown`), `camera.add`, interpolação | O loop principal anima mesmo com o jogo congelado; o overlay só aparece com a tampa aberta. |
| Difícil | `prefers-reduced-motion`: pula a animação | Acessibilidade | Abertura imediata para quem desativa movimento. |

Testes: `./test.sh` aprovado; Chromium: anim 0,61 → 1, tampa de 0,92 → −0,32 rad, overlay só após a tampa abrir, foco no campo, fechar volta a 0 e esconde o laptop, 0 erros JS. Armas, dano, IA, colisão: intocados.
**Limites:** as mãos digitando não foram feitas (o laptop aparece sozinho, sem mãos); o shell não aparece como textura na tela 3D (o overlay cobre a tela).

## Pacote 35 — Telas dos computadores com terminal (22/11/2026)

Referência enviada: desktop com janela de terminal (prompt `usuario@maquina:~$`, balão de fala e mascote em ASCII).

| Nível | Atividade | Conceito praticado | Justificativa |
|---|---|---|---|
| Fácil | Frases do balão (`PHRASES`) e mascote original **BYTE** em ASCII | Dados em lista | O Tux e o dragão do Kali são mascote/logo de marca: não foram desenhados. O BYTE é um robô inventado para o jogo. |
| Médio | `Arena.drawShellScreen(ctx, W, H, opções)`: barra de título com 3 botões, linhas do shell, balão, mascote, prompt e cursor piscando | Canvas 2D parametrizado (mono ou colorido) | Uma função serve aos monitores (cinza, tingido pelo material) e ao laptop (cores Kali/Arch). |
| Médio | Monitores em estado ocioso (`standby`) mostram o terminal; detectado/invasão/concluído/negado continuam com o NEXUS | Reuso do pipeline de textura do p25 | A cor de estado continua valendo. |
| Difícil | Laptop 3D com `CanvasTexture` 320×200 que espelha as últimas linhas do deck (ou o mascote se vazio), repintando a cada comando e no cursor | Sincronizar DOM e textura | A tela do modelo 3D mostra o que o jogador digitou. |

Testes: `./test.sh` aprovado (desenho da tela e terminal ocioso); Chromium: monitor do KVM mostra a janela de terminal, 0 erros JS. Armas, dano, IA, colisão: intocados.
**Limites:** a tela 3D do console é pequena, então o texto só fica legível de perto; o laptop 3D aparece só durante a subida/descida (depois o overlay cobre).
