# LISTA MESTRA — Arena FPS (base P62 + tudo do projeto P22/P23)

**Resultado da fusão:** o projeto P22-buildings (zip enviado) não tem nenhum arquivo, função, ID de HTML,
escolha ou objetivo que o P62 não tenha. O P62 já contém tudo dele (Complexo, Refinaria, Laboratório,
terminais físicos, interação com E, NEXUS) e mais: Campus (4º prédio), deck, modo hack, portas, 10 armas,
lobby novo e P56–P62 visuais. Base única = **P62**. Esta lista junta os pendentes das duas linhas.

## Já feito (não repetir)
P69: comando `missao` no deck (connect, relógio e notificações já existiam).
P68: mezaninos nos 4 prédios · botão de diagnóstico no menu.
P67: mezanino com rampa no Complexo (Média/Alta).
P66: arquivos/pistas por prédio · remapeamento do gamepad. Porta já barra tiros/ataques inimigos.
P65: seta de direção até o objetivo (alarme legível). Estojos/fumaça/peças móveis das armas já existiam.
P64: conquistas da Incursão · ícones do HUD.
P63: rastro para na porta · `grep`/`ssh` simulados · janelas arrastáveis. Já existiam: torretas (destrutíveis), câmeras, marcadores 3D do drone.
Lobby em painéis · prédios (4) · terminais físicos + NEXUS nos monitores · portas bloqueiam tiro do jogador ·
deck/modo hack (CRT, sysmon, rede, journal) · mira/HUD/combate visual · cenários · poças, vinheta,
faíscas adaptativas (Alta) · resolução adaptativa · `?perf=1` · PWA offline.

## 🟢 Fácil
- [ ] HUD enxuto + céu avermelhado + letreiros (pendente do P16, referência visual)
- [ ] Ajustar volume dos sons do deck depois de você ouvir
- [ ] Atualizar LEIA-ME/GUIA-RAPIDO e cabeçalho de versão

## 🟡 Médio
- [ ] Fundir peças dos inimigos (menos draw calls) — só após medir FPS

## 🔴 Difícil
- [ ] Chefe da Incursão reagindo a scan/jam (muda IA: precisa da sua aprovação)
- [ ] Andares: mezanino nos 4 prédios feito (P67/P68); falta 2º andar completo e arena maior (dependem do FPS)
- [ ] Névoa, luz por área, profundidade de campo (dependem de FPS real)
- [ ] Mãos (você pausou; só retomamos se pedir)

## 👤 Depende de você
- [ ] Medir FPS real: `index.html?perf=1`, F10 (CSV) + print do `chrome://gpu`
- [ ] Playtest humano: 4 prédios, Baixa/Média/Alta, desktop e toque
- [ ] Confirmar valores do deck (scan 8/20 s, jam 12/40 s, torreta dano 4/hp 40)

## Regras fixas
Sem libs externas · arquivos separados · não mexer em armas/dano/IA/colisão/balanceamento sem decisão ·
hacking 100% fictício · sem mascotes/logos conhecidos · cada pacote: Fácil→Médio→Difícil + relatório.
