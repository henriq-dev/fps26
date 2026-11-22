# Arena FPS — P39 (junção do P38 consolidado + P38 cenário/animação)

Base: `arena-fps-p38-consolidado` (arsenal de 10 armas, terminais NEXUS detalhados, HUD/touch com safe-area). Por cima, a junção (3-way a partir do P37, sem conflitos de código) trouxe do outro P38:

- **Mapa 0 (Hangar) no estilo da referência:** céu e névoa vermelhos, neons vermelhos com brilho aditivo, 16 torres com janelas, torre central com faixa, ponte, guindaste com contêiner, faixas nas paredes e lâmpadas ciano (`addSkylineDressing` em `script.js`; cores em `maps.js`). Só visual, fora de `solids`, desligado em qualidade baixa e em `?simples=1`.
- **Animações:** inimigos com braços/respiração/recuo ao atirar, explosões com curva suave, hit marker com pop, feed de abates mais suave e reforço de `prefers-reduced-motion`.

Mantido do consolidado: SMG Vespa (onda 8), Carabina Íon (onda 10, tecla 0), telas NEXUS por tipo de terminal, slots roláveis, ajustes de safe-area e os documentos GUIA-RAPIDO / IDEIAS-ANIMACAO-E-VISUAL / HABILIDADE-AUDITORIA-DE-MESCLA.

## Executar e testar
`python3 -m http.server 8000` → http://localhost:8000/ · `bash test.sh` (passou na junção).

## Limites
Sem playtest visual: o ambiente de montagem não renderiza WebGL. Verificados: sintaxe, testes e carregamento da página sem erros de JavaScript. Confira no navegador o brilho/escuridão da névoa vermelha (`sky` do mapa 0 em `maps.js`), o encaixe das faixas, a barra de 10 slots junto da nova cena e o FPS no celular (`?perf=1`). O cache do PWA mudou para `arena-fps-v8-p39`.
