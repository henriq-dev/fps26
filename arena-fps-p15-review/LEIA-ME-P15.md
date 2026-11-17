# Arena FPS — diagnóstico de desempenho (Pacote 15)

O diagnóstico é opt-in e local. Abra o jogo com `?perf=1`; sem esse parâmetro, o painel e o cenário fixo não aparecem.

## Executar o cenário

Na pasta do projeto, sirva os arquivos por HTTP, por exemplo:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Abra `http://127.0.0.1:8000/?perf=1` em uma aba visível e clique em **INICIAR CENÁRIO FIXO**. O teste usa a arena Hangar/mapa 0, Sobrevivência/Normal, Fuzil e 12 inimigos de tipos e posições predeterminados. Para uma comparação, mantenha iguais viewport, navegador, qualidade gráfica e duração; deixe a página em primeiro plano por pelo menos 60 s.

O cenário é deliberadamente não-combatível: dano ao jogador é ignorado e inimigos não podem morrer. Isso mantém a carga de IA/renderização estável e evita score, carreira, desafios ou recordes. As exceções só são ativadas nesta URL de diagnóstico; o jogo normal continua com as regras originais. Nenhuma amostra é enviada pela rede nem persistida em `localStorage`.

## Painel e exportação

- **F8** mostra/oculta o painel. Se estiver oculto, o botão **PERF** o reabre, inclusive em touch.
- **F9** reinicia o cenário fixo e zera a janela de amostras.
- **F10** baixa um CSV com até 3.600 quadros mais recentes (aproximadamente 60 s a 60 FPS). Os botões do painel oferecem as mesmas ações.
- Os quantis de frametime descrevem o intervalo entre quadros. `update` é o tempo síncrono da simulação JavaScript. `render-submit` é o tempo CPU dentro de `renderer.render`; não mede a conclusão do trabalho da GPU.
- Draw calls, triângulos, entidades, geometrias/texturas, pixel ratio e contadores de `blocked`, `lineClear` e A* ajudam a apontar onde investigar. Geometrias/texturas são contagens, não estimativa de memória em bytes.

## Limites da medição

A referência de 60 s no pacote foi capturada em Chromium headless com SwiftShader no sandbox e não representa o desempenho esperado em um celular ou GPU física. O CSV é mais útil quando coletado no navegador e dispositivo onde os travamentos ocorrem. Um p95 alto de `render-submit` não prova sozinho gargalo de GPU; compare com frametime e `update` e, se necessário, use um profiler de GPU do navegador/dispositivo.

A suíte local pode ser executada com:

```bash
./test.sh
```
