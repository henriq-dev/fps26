# Arena FPS — Pacote 16 unificado

Esta pasta consolida as versões P14 e P15: preserva o Fuzil e mãos industriais do piloto, aplica a biblioteca procedural PBR com paletas próprias a Hangar, Pátio e Fábrica, e mantém a telemetria local opcional. O motor Three.js, HUD neon e mecânicas de combate permanecem os mesmos.

## Executar

Sirva a pasta por HTTP local:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8000/`. A aplicação usa apenas arquivos incluídos e continua disponível offline após o cache do Service Worker ser instalado.

## O que foi combinado

- **P14:** materiais procedurais para metal pintado, concreto e madeira, cores/identidades das arenas e o tema do mapa.
- **P15:** materiais Canvas PBR cacheados, Fuzil e mãos detalhados no Hangar, adereços instanciados, telemetria opt-in e cenário repetível com 12 inimigos.
- Para evitar o custo de painéis individuais por obstáculo usados no P14, as arenas reutilizam geometrias/materiais e o adereço industrial do Hangar é construído uma vez e reaproveitado nas trocas de mapa.
- As coordenadas e dimensões dos blocos, colisões, raycast, navegação, IA, controles, HUD, armas e progressão foram preservados.

## Diagnóstico de desempenho

Use `http://127.0.0.1:8000/?perf=1`, clique em **INICIAR CENÁRIO FIXO** e mantenha a aba em primeiro plano. O cenário fixa Hangar/mapa 0, Sobrevivência/Normal, Fuzil e 12 inimigos; dano/abates são ignorados e não há persistência de score, carreira ou recordes.

- **F8:** mostrar/ocultar painel (o botão PERF também o reabre).
- **F9:** reiniciar o cenário e zerar a janela de amostras.
- **F10:** exportar CSV.
- Ao perder o Pointer Lock, pausar ou ocultar a aba, a medição pausa; essas telas não são adicionadas ao CSV. O primeiro frame após retomar também é descartado.

A telemetria é local: não é enviada à rede. `render-submit` mede a submissão síncrona pelo CPU, não o tempo final da GPU. Resultados de Chromium headless/SwiftShader servem apenas para comparação interna do sandbox e não representam desempenho de celular/GPU física.

## Validação

Execute `bash test.sh` (ou `./test.sh` em instalação com permissão executável). As capturas `p16-hangar-playtest.png`, `p16-patio-playtest.png` e `p16-fabrica-playtest.png` registram a vista em primeira pessoa durante o teste de integração; não são benchmarks de desempenho.
