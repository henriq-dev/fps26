# Arena FPS — P44

## Instanciamento das luzes vermelhas do Hangar

O P44 reduz chamadas de desenho do dressing industrial convertendo os quatro halos vermelhos lineares das paredes e as duas lâmpadas vermelhas do guindaste para `THREE.InstancedMesh`:

- um `InstancedMesh` para os quatro halos das paredes;
- um `InstancedMesh` para as duas lâmpadas do guindaste.

As posições, escalas, cores e materiais permanecem iguais aos do P43. Cada conjunto atualiza `instanceMatrix.needsUpdate` e recalcula `computeBoundingSphere()` depois do preenchimento. Assim, seis meshes decorativas são representadas por duas chamadas de desenho.

As otimizações adaptativas do skyline e dos neons ciano dos pacotes P41–P43 permanecem preservadas.

## Escopo preservado

A mudança é somente de renderização. Não altera colisão, navegação, spawn, armas, dano, IA, progressão, controles ou os modos Sobrevivência, Operações e Incursão.

## Validação planejada

- `bash test.sh`
- `node --check` em todos os JavaScripts
- Smoke test HTTP e Chromium headless
- Inspeção de integridade do ZIP final

A medição definitiva de draw calls, overdraw e FPS deve ser realizada em GPU e dispositivos reais. O Chromium headless usa renderização por software.
