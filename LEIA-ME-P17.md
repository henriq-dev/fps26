# Arena FPS — Pacote 17: menos travamentos

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
