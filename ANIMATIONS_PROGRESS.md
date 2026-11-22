# Arena FPS p35 — Progresso da atualização de animações

## Base
- Trabalhando sobre o pacote p35, preservando gameplay e sistemas existentes.
- Melhorias incrementais em `script.js`; arquivos auxiliares e recursos mantidos.

## Concluído / revisado neste checkpoint
- [x] Camera Bob: balanço da câmera proporcional ao movimento, suavizado por delta time e reduzido ao mirar/interagir.
- [x] Sprint: blend de corrida, leve roll da câmera, FOV dinâmico e arma abaixada/recuada suavemente.
- [x] Jump/Landing: balanço reduzido no ar e pulso amortecido na câmera ao pousar; aterrissagem da arma já tem `landDip` e recebeu amortecimento aprimorado.
- [x] Validação: `node --check` em todos os JS e `node tests/core.test.js` passaram.

## Próximas animações (continuar nesta ordem)
1. Crouch/Slide: verificar se há mecânica; se ausente, não inventar controle sem compatibilidade com layout/controles.
2. Recoil + Weapon Sway: revisar e calibrar resposta, suavização e limites.
3. Reload: revisar ciclo visual, sincronização de barra e interrupções.
4. Fire/Muzzle Flash: revisar flash, luz, partículas, fumaça e feedback.
5. Weapon Inspect: só se encaixar nos controles e não conflitar com gameplay.
6. Enemy Idle/Patrol, Movement, Attack e Hit Reaction.
7. Death; Impact; Damage Feedback; Explosions; Energy Effects.
8. Doors, Elevators, Lights, Objects, suspended props e particles.
9. HUD/UI: entrada, hit marker, crosshair, kill feed, notifications, objectives, score/XP, menus.
10. Spawn/Respawn/Game Over/Victory/Scene Transition, Glitch, Camera Shake, Slow Motion.
11. Teste final de regressão e pacote completo.

## Regras
- Não substituir controles ou mecânicas sem auditoria e consentimento.
- Animações decorativas não podem interferir em hitboxes, física, interação, mira ou navegação.
- Respeitar `prefers-reduced-motion` onde animações de interface permitirem.
- Testar após cada grupo; manter um ZIP cumulativo e atualizar este arquivo.
