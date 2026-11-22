# Arena FPS — P42

## Overdraw adaptativo dos neons

O P42 continua a otimização visual do Hangar iniciada no P40 e refinada no P41. Na qualidade Alta, o dressing industrial mantém os quatro pontos ciano em cada lado das paredes, nas colunas `[-18, -6, 6, 18]`. Na qualidade Média, usa duas colunas representativas, `[-18, 6]`, em cada lado.

A redução também diminui os halos transparentes associados aos pontos ciano. Os halos lineares das paredes, as faixas e a leitura cromática principal continuam presentes. A qualidade Baixa e `?simples=1` seguem sem o dressing industrial, como antes.

## Escopo preservado

A mudança é exclusivamente visual e busca reduzir meshes transparentes e overdraw em telas menores ou GPUs móveis. Não altera colisão, navegação, spawn, armas, dano, IA, progressão, controles ou os modos Sobrevivência, Operações e Incursão.

## Validação planejada

- `bash test.sh`
- `node --check` em todos os arquivos JavaScript
- Smoke test HTTP e Chromium headless
- Inspeção de integridade do ZIP final

A medição definitiva de FPS, draw calls e overdraw deve ser realizada em GPU e dispositivos reais. O Chromium headless da validação usa renderização por software.
