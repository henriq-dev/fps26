# Arena FPS — P45

## Instanciamento dos trilhos perimetrais

O P45 otimiza o dressing industrial do Hangar convertendo os quatro trilhos metálicos em dois `THREE.InstancedMesh`:

- um grupo para os dois trilhos longitudinais;
- um grupo para os dois trilhos transversais.

As geometrias, o material de aço, as posições e as escalas permanecem iguais aos do P44. Cada grupo atualiza `instanceMatrix.needsUpdate` e recalcula `computeBoundingSphere()` depois do preenchimento. Assim, quatro meshes decorativas passam a ser representadas por duas chamadas de desenho.

As otimizações dos stripes, painéis, skyline, neons ciano e luzes vermelhas dos pacotes anteriores permanecem preservadas.

## Escopo preservado

A mudança é somente de renderização. Não altera colisão, navegação, spawn, armas, dano, IA, progressão, controles ou os modos Sobrevivência, Operações e Incursão.

## Validação planejada

- `bash test.sh`
- `node --check` em todos os JavaScripts
- Smoke test HTTP e Chromium headless
- Inspeção de integridade do ZIP final

A medição definitiva de draw calls e FPS deve ser realizada em GPU e dispositivos reais. O Chromium headless usa renderização por software.
