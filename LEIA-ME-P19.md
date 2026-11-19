# Arena FPS — Pacote 19

## Como testar no seu aparelho (6 testes de 15 s)
Abra cada link, clique em INICIAR, espere 15 s, pressione F10 e guarde o CSV:
1. `index.html?perf=1` (normal)
2. `index.html?perf=1&simples=1` (materiais leves)
3. `index.html?perf=1&semluzes=1` (sem luzes extras)
4. `index.html?perf=1&escala=0.5` (metade da resolução)
5. `index.html?perf=1&semneblina=1&sempoeira=1`
6. Menu > Qualidade: Baixa, depois `index.html?perf=1`

O painel (F8) mostra a **GPU**. Se aparecer "SOFTWARE", o navegador não está usando a placa de vídeo: ative a aceleração por hardware nas configurações.
