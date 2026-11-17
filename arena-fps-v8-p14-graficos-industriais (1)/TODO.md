# TODO — Arena FPS v8 · Pacote 14

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

## Pacote 14 — Gráficos industriais detalhados

- [x] Substituir materiais lisos dos obstáculos por materiais procedurais locais com ruído, juntas, fissuras/veios, bump sutil, roughness e metalness por superfície.
- [x] Enriquecer o piso de cada arena com juntas, manchas e desgaste, mantendo textura local e compatibilidade offline.
- [x] Adicionar bordas estruturais, painéis frontais e barras emissivas aos obstáculos sem alterar colisão, raycast ou navegação.
- [x] Dar identidade temática às três arenas: concreto/setor 07, doca/chuva âmbar e planta/núcleo ciano.
- [ ] Adicionar props maiores, tubulações, cabos e módulos arquitetônicos específicos por mapa após validar o custo de renderização.
- [ ] Substituir progressivamente silhuetas de inimigos por modelos detalhados mantendo hitboxes e fallback procedural.
- [ ] Reavaliar FPS em qualidade baixa, média e alta depois da próxima camada de props.
